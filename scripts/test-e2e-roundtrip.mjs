#!/usr/bin/env node
// End-to-end: boot the Next dev server, point the MCP server at it, run a tool
// call, verify events + gating round-trip.
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
const TOKEN = "imr_e2etesttoken123";

function step(msg) {
  process.stdout.write(`→ ${msg}\n`);
}
function ok(msg) {
  process.stdout.write(`  ✔ ${msg}\n`);
}
function fail(msg, extra) {
  process.stderr.write(`  ✘ ${msg}\n`);
  if (extra) process.stderr.write(`    ${extra}\n`);
  process.exitCode = 1;
}

async function waitForReady(timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/api/tokens/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: TOKEN }),
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(500);
  }
  throw new Error(`web dev server never responded on ${BASE}`);
}

step(`booting next dev on port ${PORT}…`);
const dev = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "-p", String(PORT), "--hostname", "127.0.0.1"],
  {
    cwd: webDir,
    env: { ...process.env, NODE_ENV: "development" },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let devLog = "";
dev.stdout.on("data", (d) => {
  devLog += d.toString();
});
dev.stderr.on("data", (d) => {
  devLog += d.toString();
});

function shutdown() {
  if (!dev.killed) dev.kill("SIGTERM");
}
process.on("exit", shutdown);
process.on("SIGINT", () => {
  shutdown();
  process.exit(130);
});

try {
  await waitForReady();
  ok("next dev is up");

  // validate token
  const v = await (
    await fetch(`${BASE}/api/tokens/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: TOKEN }),
    })
  ).json();
  if (!v.valid) fail("tokens/validate did not return valid:true", JSON.stringify(v));
  else ok("tokens/validate → valid");

  // spawn MCP server pointed at local API
  step("spawning dwc MCP server (gating on, events on)…");
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    env: {
      ...process.env,
      DWC_TOKEN: TOKEN,
      DWC_API_URL: BASE,
      DWC_GATING: "on",
      DWC_EVENTS: "on",
      DWC_DEBUG: "1",
    },
  });
  const client = new Client({ name: "dwc-e2e", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  ok("MCP connected");

  step("calling hello-world 10 times (free tier limit)…");
  for (let i = 1; i <= 10; i++) {
    const r = await client.callTool({ name: "hello-world", arguments: { name: `call-${i}` } });
    const text = r.content?.find?.((c) => c.type === "text")?.text ?? "";
    if (r.isError || !text.includes(`call-${i}`)) {
      fail(`call ${i} failed`, text);
      break;
    }
  }
  ok("10 calls succeeded");

  step("calling hello-world one more time — expect free_tier_exhausted…");
  const blocked = await client.callTool({
    name: "hello-world",
    arguments: { name: "should-block" },
  });
  const blockedText = blocked.content?.find?.((c) => c.type === "text")?.text ?? "";
  if (!blocked.isError || !/free.*commands/i.test(blockedText)) {
    fail("expected gate to block 11th call", blockedText);
  } else {
    ok(`gate blocked with: "${blockedText.slice(0, 80)}…"`);
  }

  step("verifying events stored on the API…");
  const recent = await (await fetch(`${BASE}/api/events/recent?token=${TOKEN}&limit=50`)).json();
  if (!recent.ok) {
    fail("events/recent not ok", JSON.stringify(recent));
  } else {
    const toolEvents = recent.events.filter((e) => e.toolName === "hello-world");
    if (toolEvents.length !== 10) {
      fail(`expected 10 hello-world events, got ${toolEvents.length}`);
    } else {
      ok(`${toolEvents.length} hello-world events recorded, profile count=${recent.profile?.commandCount}`);
    }
    const hasConnected = recent.events.some((e) => e.toolName === "__mcp.connected__");
    if (hasConnected) ok("__mcp.connected__ event observed");
    else ok("(no __mcp.connected__ — ok if server started before subscribe)");
  }

  await client.close().catch(() => {});
} catch (err) {
  fail("e2e threw", err instanceof Error ? err.message : String(err));
  if (process.env.DWC_TEST_VERBOSE === "1") process.stderr.write(devLog);
} finally {
  shutdown();
  await sleep(200);
}

if (!process.exitCode) process.stdout.write("\nALL GOOD — MCP ↔ dwc API round-trip works.\n");
