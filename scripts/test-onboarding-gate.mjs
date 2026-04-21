#!/usr/bin/env node
// End-to-end test for C9 slice 1 (onboarding gate + set-project-profile tool).
//
// Boots a minimal in-memory stub of the dwic API, spawns the MCP server pointing
// at it via DWIC_API_URL, and exercises:
//   1. specialist call → onboarding response (no profile yet)
//   2. hello-world still runs (exempt from gate)
//   3. set-project-profile call → profile persisted + cache updated
//   4. specialist call → normal palette output (gate released)
//   5. DWIC_ONBOARDING_GATE=off bypasses the gate even without profile
//
// Run with `npm run test:onboarding-gate`.

import { createServer } from "node:http";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const serverPath = resolve(repoRoot, "dist", "server.js");

const PORT = Number(process.env.DWIC_ONBOARDING_TEST_PORT ?? 3098);
const TOKEN = "imr_onboardingtest1";
const PROJECT = "test-project";

let failed = 0;
function ok(msg) {
  process.stdout.write(`  ✔ ${msg}\n`);
}
function fail(msg, extra) {
  failed++;
  process.stderr.write(`  ✘ ${msg}\n`);
  if (extra) process.stderr.write(`    ${extra}\n`);
}

// In-memory stub of the dwic web API, scoped to this test run.
function startStubApi() {
  const state = {
    profiles: new Map(), // key: `${token}:${project}` → profile answers
    events: [],
  };

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    const body = await new Promise((resolve) => {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        try {
          resolve(raw ? JSON.parse(raw) : {});
        } catch {
          resolve({});
        }
      });
    });

    const json = (status, payload) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(payload));
    };

    // GET /api/profile?token=...&project=... — returns 404 unless persisted.
    if (req.method === "GET" && url.pathname === "/api/profile") {
      const token = url.searchParams.get("token");
      const project = url.searchParams.get("project");
      const key = `${token}:${project}`;
      const profile = state.profiles.get(key);
      if (!profile) {
        return json(404, { ok: false, reason: "not_found" });
      }
      return json(200, {
        ok: true,
        profile: {
          status: "free",
          commandCount: 0,
          connected: true,
          onboarding: profile,
          claudeMd: "# test project\n\nGenerated.",
        },
      });
    }

    // POST /api/profile — persist onboarding answers.
    if (req.method === "POST" && url.pathname === "/api/profile") {
      const key = `${body.token}:${body.project}`;
      state.profiles.set(key, {
        product_type: body.product_type,
        product_description: body.product_description,
        tech_stack: body.tech_stack,
        design_system: body.design_system,
        experience_level: body.experience_level,
        tone_preference: body.tone_preference,
      });
      return json(200, {
        ok: true,
        token: body.token,
        project: body.project,
        claudeMd: "# test project\n\nGenerated.",
        profile: {
          product_type: body.product_type,
          experience_level: body.experience_level,
          tone_preference: body.tone_preference,
        },
      });
    }

    // POST /api/events — swallow.
    if (req.method === "POST" && url.pathname === "/api/events") {
      state.events.push(body);
      return json(200, { ok: true });
    }

    // POST /api/gating/{check,consume} — always allow.
    if (req.method === "POST" && url.pathname.startsWith("/api/gating/")) {
      return json(200, { allowed: true, remaining: 10 });
    }

    json(404, { ok: false, reason: "not_found" });
  });

  return new Promise((resolve) => {
    server.listen(PORT, "127.0.0.1", () => resolve({ server, state }));
  });
}

async function newMcpClient(envOverrides = {}) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    env: {
      ...process.env,
      DWIC_TOKEN: TOKEN,
      DWIC_PROJECT_ID: PROJECT,
      DWIC_API_URL: `http://127.0.0.1:${PORT}`,
      DWIC_GATING: "off",
      DWIC_EVENTS: "off",
      DWIC_DEBUG: "0",
      ...envOverrides,
    },
  });
  const client = new Client({ name: "dwic-onboarding-test", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  return client;
}

function textOf(result) {
  return result.content?.find?.((c) => c.type === "text")?.text ?? "";
}

const { server, state } = await startStubApi();
try {
  // --- 1. specialist call with no profile → onboarding response ---
  {
    const client = await newMcpClient();
    const result = await client.callTool({
      name: "color-specialist",
      arguments: { brief: "Calm productivity tool", accent: "#5B8DEF" },
    });
    const text = textOf(result);
    if (!text.includes("Onboarding required")) {
      fail("specialist call with no profile should return onboarding response", text.slice(0, 300));
    } else {
      ok("specialist call with no profile → onboarding response returned");
    }
    if (text.includes("--color-primary-500")) {
      fail("specialist call should NOT return seed palette when gated");
    } else {
      ok("specialist call did not leak seed palette through the gate");
    }
    if (!text.includes(PROJECT)) {
      fail("onboarding response should name the project slug");
    } else {
      ok("onboarding response names the current project slug");
    }
    await client.close();
  }

  // --- 2. hello-world is exempt from the gate ---
  {
    const client = await newMcpClient();
    const result = await client.callTool({
      name: "hello-world",
      arguments: { name: "imran" },
    });
    const text = textOf(result);
    if (!text.toLowerCase().includes("hello")) {
      fail("hello-world should bypass gate", text);
    } else {
      ok("hello-world bypasses onboarding gate");
    }
    await client.close();
  }

  // --- 3. set-project-profile persists + releases the gate (same process) ---
  {
    const client = await newMcpClient();
    const persistResult = await client.callTool({
      name: "set-project-profile",
      arguments: {
        product_type: "Test chat UI",
        product_description: "Chat interface for policy-decision audiences.",
        tech_stack: ["Next.js 15", "Tailwind v4"],
        design_system: "NewGlobe brand — navy #1F3B90 + turquoise #00B7BD.",
        experience_level: "intermediate",
        tone_preference: "concise",
      },
    });
    const persistText = textOf(persistResult);
    if (!/Profile saved for project/.test(persistText)) {
      fail("set-project-profile should return success text", persistText.slice(0, 300));
    } else {
      ok("set-project-profile persisted and returned confirmation");
    }
    const key = `${TOKEN}:${PROJECT}`;
    if (!state.profiles.has(key)) {
      fail("stub API should have the persisted profile");
    } else {
      ok("stub API received and stored the profile");
    }

    // Same client, next call — gate should now release.
    const after = await client.callTool({
      name: "color-specialist",
      arguments: { brief: "Calm productivity tool", accent: "#5B8DEF" },
    });
    const afterText = textOf(after);
    if (afterText.includes("Onboarding required")) {
      fail("gate still active after set-project-profile in same session", afterText.slice(0, 300));
    } else {
      ok("specialist call after set-project-profile runs normally (gate released in-process)");
    }
    if (!afterText.includes("--color-primary-500")) {
      fail("specialist after profile should emit seed palette", afterText.slice(0, 300));
    } else {
      ok("specialist after profile emits the seed palette");
    }
    await client.close();
  }

  // --- 4. DWIC_ONBOARDING_GATE=off bypasses gate ---
  {
    // Reset: use a fresh token/project so there's definitely no profile.
    const freshToken = "imr_onboardingtest2";
    const freshProject = "bypass-project";
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [serverPath],
      env: {
        ...process.env,
        DWIC_TOKEN: freshToken,
        DWIC_PROJECT_ID: freshProject,
        DWIC_API_URL: `http://127.0.0.1:${PORT}`,
        DWIC_GATING: "off",
        DWIC_EVENTS: "off",
        DWIC_ONBOARDING_GATE: "off",
      },
    });
    const client = new Client({ name: "dwic-bypass-test", version: "1.0.0" }, { capabilities: {} });
    await client.connect(transport);
    const result = await client.callTool({
      name: "color-specialist",
      arguments: { brief: "Calm productivity tool", accent: "#5B8DEF" },
    });
    const text = textOf(result);
    if (text.includes("Onboarding required")) {
      fail("DWIC_ONBOARDING_GATE=off did not bypass the gate");
    } else {
      ok("DWIC_ONBOARDING_GATE=off bypasses the gate");
    }
    await client.close();
  }

  // --- 5. No token → gate skipped (local dev behavior) ---
  {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [serverPath],
      env: {
        ...process.env,
        DWIC_TOKEN: "",
        DWIC_PROJECT_ID: "",
        DWIC_API_URL: `http://127.0.0.1:${PORT}`,
        DWIC_GATING: "off",
        DWIC_EVENTS: "off",
      },
    });
    const client = new Client({ name: "dwc-notoken-test", version: "1.0.0" }, { capabilities: {} });
    await client.connect(transport);
    const result = await client.callTool({
      name: "color-specialist",
      arguments: { brief: "Calm productivity tool", accent: "#5B8DEF" },
    });
    const text = textOf(result);
    if (text.includes("Onboarding required")) {
      fail("gate fired even without a token (should be dev-mode skip)");
    } else {
      ok("no token → gate skipped (local dev mode)");
    }
    await client.close();
  }
} finally {
  server.close();
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — onboarding gate + set-project-profile wired end-to-end.\n");
