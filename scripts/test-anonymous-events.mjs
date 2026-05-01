// Smoke test for anonymous CLI telemetry on /api/events.
// Spins up `next dev` on a free port, fires three requests (valid anon,
// disallowed tool, invalid token shape), verifies outcomes, kills server.

import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";

const PORT = 3457;
const BASE = `http://localhost:${PORT}`;

const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
  cwd: "web",
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env },
});

let ready = false;
child.stdout.on("data", (d) => {
  const s = d.toString();
  if (s.match(/Ready in|started server|Local:/)) ready = true;
});
child.stderr.on("data", () => {});

const stop = () => {
  try { child.kill("SIGTERM"); } catch {}
};
process.on("exit", stop);

try {
  for (let i = 0; i < 60 && !ready; i++) await wait(500);
  if (!ready) {
    // Fallback: try anyway — server may be up but no banner matched.
  }
  // Probe until 200/4xx from the route
  let alive = false;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE}/api/events`, { method: "POST", body: "{}", headers: {"content-type":"application/json"} });
      if (r.status > 0) { alive = true; break; }
    } catch {}
    await wait(500);
  }
  if (!alive) throw new Error("dev server never came up");

  // 1. Valid anonymous CLI ping
  const r1 = await fetch(`${BASE}/api/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      token: "anon_testaB3xK9zP",
      toolName: "__cli.audit.summary__",
      input: {},
      output: { schema: "dwic.audit.summary/2", framework: "next" },
      timestamp: new Date().toISOString(),
    }),
  });
  const j1 = await r1.json();
  console.log("[1] anon valid:", r1.status, j1);
  if (!j1.ok || !j1.anonymous) throw new Error("anon valid path did not store");

  // 2. Anonymous token + non-allowlisted tool
  const r2 = await fetch(`${BASE}/api/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      token: "anon_testaB3xK9zP",
      toolName: "color-specialist",
      input: {},
      output: {},
      timestamp: new Date().toISOString(),
    }),
  });
  const j2 = await r2.json();
  console.log("[2] anon disallowed tool:", r2.status, j2);
  if (j2.ok || j2.reason !== "anonymous_tool_not_allowed") throw new Error("disallowed-tool guard failed");

  // 3. Garbage token (not imr_, not anon_)
  const r3 = await fetch(`${BASE}/api/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      token: "bogus_xxx",
      toolName: "__cli.audit.summary__",
      input: {},
      output: {},
      timestamp: new Date().toISOString(),
    }),
  });
  const j3 = await r3.json();
  console.log("[3] bogus token:", r3.status, j3);
  if (j3.ok || j3.reason !== "invalid_token") throw new Error("invalid-token guard failed");

  console.log("\n✓ all 3 anonymous-event assertions passed");
  stop();
  process.exit(0);
} catch (e) {
  console.error("✗", e.message);
  stop();
  process.exit(1);
}
