#!/usr/bin/env node
// Full Phase 2 flow: boot web, POST /api/profile, drive MCP with the minted
// token, call all three structured tools, verify the stored events are
// renderable (shapes match ToolOutputPayload).
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const webDir = resolve(repoRoot, "web");
const serverPath = resolve(repoRoot, "dist", "server.js");

const PORT = Number(process.env.DWC_TEST_PORT ?? 3099);
const BASE = `http://127.0.0.1:${PORT}`;

const VALID_TYPES = new Set(["palette", "type-scale", "spacing", "component-spec", "copy", "markdown"]);

function step(msg) {
  process.stdout.write(`→ ${msg}\n`);
}
function ok(msg) {
  process.stdout.write(`  ✔ ${msg}\n`);
}
function fail(msg, extra) {
  process.stderr.write(`  ✘ ${msg}\n`);
  if (extra) process.stderr.write(`    ${typeof extra === "string" ? extra : JSON.stringify(extra)}\n`);
  process.exitCode = 1;
}

async function waitForReady(token) {
  const start = Date.now();
  while (Date.now() - start < 60_000) {
    try {
      const res = await fetch(`${BASE}/api/tokens/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) return;
    } catch {}
    await sleep(400);
  }
  throw new Error("web dev never started");
}

step(`booting next dev on :${PORT}…`);
const dev = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "-p", String(PORT), "--hostname", "127.0.0.1"],
  { cwd: webDir, stdio: ["ignore", "pipe", "pipe"] },
);
let log = "";
dev.stdout.on("data", (d) => (log += d.toString()));
dev.stderr.on("data", (d) => (log += d.toString()));
function shutdown() {
  if (!dev.killed) dev.kill("SIGTERM");
}
process.on("exit", shutdown);
process.on("SIGINT", () => { shutdown(); process.exit(130); });

try {
  // Use any shape-valid token just for the ready-check; the real one comes from /api/profile.
  await waitForReady("imr_warmupttoken123");
  ok("next dev up");

  step("POST /api/profile with onboarding answers…");
  const profileRes = await fetch(`${BASE}/api/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_type: "SaaS",
      product_description: "Calm Pomodoro timer for indie designers who work late at night.",
      tech_stack: ["Next.js", "Tailwind CSS"],
      design_system: "Starting fresh",
      experience_level: "intermediate",
      tone_preference: "concise",
    }),
  });
  const profileBody = await profileRes.json();
  if (!profileBody.ok || !profileBody.token || !profileBody.claudeMd) {
    fail("profile creation failed", profileBody);
    throw new Error("aborting");
  }
  const token = profileBody.token;
  ok(`minted token ${token}`);
  if (!/^imr_[A-Za-z0-9_-]{8,}$/.test(token)) fail("minted token fails shape check");
  if (!profileBody.claudeMd.includes("Calm Pomodoro")) {
    fail("CLAUDE.md didn't include the product description");
  } else {
    ok("CLAUDE.md contains the product description");
  }

  step("GET /api/profile?token=… (no project) returns AccountState with the minted project…");
  const accountRes = await (await fetch(`${BASE}/api/profile?token=${token}`)).json();
  if (!accountRes.ok || !accountRes.account?.projects?.some((p) => p.slug === "default")) {
    fail("AccountState missing default project", accountRes);
  } else {
    ok(`account has ${accountRes.account.projects.length} project(s)`);
  }

  step("GET /api/profile?token=&project=default returns scoped ProfileState…");
  const scopedRes = await (await fetch(`${BASE}/api/profile?token=${token}&project=default`)).json();
  if (!scopedRes.ok || !scopedRes.profile?.onboarding?.tone_preference) {
    fail("scoped profile missing onboarding", scopedRes);
  } else {
    ok(`project=default · tone=${scopedRes.profile.onboarding.tone_preference}`);
  }

  step("spawning MCP server bound to minted token…");
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    env: {
      ...process.env,
      DWC_TOKEN: token,
      DWC_API_URL: BASE,
      DWC_GATING: "on",
      DWC_EVENTS: "on",
    },
  });
  const client = new Client({ name: "dwc-phase2-e2e", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  ok("MCP connected");

  step("calling color-specialist + typography-specialist + spacing-specialist + design-brief…");
  const calls = [
    {
      name: "color-specialist",
      arguments: { brief: "Calm productivity tool", accent: "#5B8DEF", mode: "both" },
    },
    {
      name: "typography-specialist",
      arguments: { brief: "Editorial but minimal", baseSizePx: 16 },
    },
    {
      name: "spacing-specialist",
      arguments: { brief: "Compact dashboard density", baseUnitPx: 4 },
    },
    {
      name: "design-brief",
      arguments: { brief: "SaaS landing page for a pomodoro timer", stack: "Next.js + Tailwind" },
    },
  ];
  for (const c of calls) {
    const r = await client.callTool(c);
    if (r.isError) fail(`${c.name} errored`, r.content?.[0]?.text?.slice(0, 200));
  }
  ok("4 tool calls succeeded");

  step("polling /api/events/recent for structured output shapes…");
  // give the fire-and-forget event emit ~500ms
  await sleep(500);
  const recent = await (await fetch(`${BASE}/api/events/recent?token=${token}&limit=50`)).json();
  if (!recent.ok) {
    fail("recent not ok", recent);
  } else {
    const toolEvents = recent.events.filter((e) => e.toolName !== "__mcp.connected__");
    if (toolEvents.length < 4) fail(`expected ≥4 tool events, got ${toolEvents.length}`);
    else ok(`${toolEvents.length} tool events stored`);

    const kinds = new Set(toolEvents.map((e) => e.output?.type));
    const expected = ["palette", "type-scale", "spacing", "markdown"];
    for (const e of expected) {
      if (!kinds.has(e)) fail(`missing output type: ${e}`);
    }
    if (![...kinds].every((k) => VALID_TYPES.has(k))) {
      fail("unexpected output type(s)", [...kinds]);
    } else {
      ok(`all output kinds valid: ${[...kinds].join(", ")}`);
    }

    const palette = toolEvents.find((e) => e.output?.type === "palette");
    if (!Array.isArray(palette?.output?.data?.tokens) || palette.output.data.tokens.length < 10) {
      fail("palette event missing tokens array", palette?.output?.data);
    } else {
      ok(`palette has ${palette.output.data.tokens.length} tokens`);
    }
  }

  await client.close().catch(() => {});

  step("fetching rendered HTML for each companion route…");
  const routes = [
    // React SSR injects comment-boundary nodes between {step} and neighboring
    // text — assert on stable literals only.
    { url: "/start", must: ["What are you building", "of 5"] },
    { url: `/profile?token=${token}`, must: ["CLAUDE.md", "This is what Claude will know"] },
    { url: `/install?token=${token}`, must: [`--token=${token}`, "Install the MCP server"] },
    { url: `/companion?token=${token}`, must: ["Your design system", "Compounding here"] },
    { url: `/upgrade?token=${token}`, must: ["Keep what you", "Subscriber"] },
  ];
  for (const r of routes) {
    const res = await fetch(`${BASE}${r.url}`);
    const html = await res.text();
    if (!res.ok) {
      fail(`${r.url} returned ${res.status}`);
      continue;
    }
    const missing = r.must.filter((s) => !html.includes(s));
    if (missing.length) fail(`${r.url} missing expected substrings: ${missing.join(", ")}`);
    else ok(`${r.url} rendered (${html.length} bytes)`);
  }
} catch (err) {
  fail("phase2 e2e threw", err instanceof Error ? err.message : String(err));
  if (process.env.DWC_TEST_VERBOSE === "1") process.stderr.write(log);
} finally {
  shutdown();
  await sleep(200);
}

if (!process.exitCode) {
  process.stdout.write("\nALL GOOD — Phase 2 profile → MCP → renderable events flow works.\n");
}
