#!/usr/bin/env node
// What setup and the audit do to a user's machine and to the server. Everything
// runs against a local stub with a throwaway HOME. setup only obeys --api=, not
// DWIC_API_URL, so every setup call here passes it: without it, this test would
// write to the live database.

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const bin = resolve(here, "../dist/bin/setup.js");
const work = mkdtempSync(join(tmpdir(), "dwic-safety-"));
const home = join(work, "home");
mkdirSync(home);

let failed = 0;
function check(ok, label, extra) {
  if (ok) process.stdout.write(`  ✔ ${label}\n`);
  else {
    failed++;
    process.stderr.write(`  ✘ ${label}\n`);
    if (extra !== undefined) process.stderr.write(`    ${String(extra).slice(0, 400)}\n`);
  }
}

let reply = { status: 200, body: { valid: true } };
const requests = [];
const stub = createServer((req, res) => {
  let body = "";
  req.on("data", (d) => (body += d));
  req.on("end", () => {
    requests.push({ url: req.url, body });
    if (reply.hang) return;
    res.writeHead(reply.status, { "content-type": "application/json" });
    res.end(JSON.stringify(reply.body));
  });
});
await new Promise((ok) => stub.listen(0, "127.0.0.1", ok));
const stubUrl = `http://127.0.0.1:${stub.address().port}`;
const api = `--api=${stubUrl}`;

const baseEnv = { PATH: process.env.PATH, HOME: home, NO_COLOR: "1", DWIC_EVENTS: "off", DWIC_API_URL: "http://127.0.0.1:9" };
function run(args, cwd, env = {}) {
  return new Promise((done) => {
    const c = spawn(process.execPath, [bin, ...args], { cwd, env: { ...baseEnv, ...env } });
    let out = "";
    c.stdout.on("data", (d) => (out += d));
    c.stderr.on("data", (d) => (out += d));
    const kill = setTimeout(() => c.kill("SIGKILL"), 25000);
    c.on("close", (code) => {
      clearTimeout(kill);
      done({ code, out });
    });
  });
}
let n = 0;
function project(files = {}) {
  const p = join(work, `p${n++}`);
  mkdirSync(p, { recursive: true });
  for (const [f, c] of Object.entries({ "package.json": "{}", ...files })) {
    mkdirSync(dirname(join(p, f)), { recursive: true });
    writeFileSync(join(p, f), c);
  }
  return p;
}
const good = ["setup", "--token=imr_abc12345", "--project=acme", api];

try {
  // --- Setup refuses what it can't use, and writes nothing ------------------------
  for (const [label, args] of [
    ["a malformed token", ["setup", "--token=nope", "--project=acme", api]],
    ["a bad scope", [...good, "--scope=nonsense"]],
    ["an unknown flag", [...good, "--nonsense"]],
  ]) {
    const p = project();
    requests.length = 0;
    const r = await run(args, p);
    check(r.code !== 0 && !existsSync(join(p, ".mcp.json")), `${label} is refused and writes nothing`, r.out);
    check(requests.length === 0, `${label} never reaches the server`, JSON.stringify(requests));
  }

  for (const [label, next] of [
    ["valid: false", { status: 200, body: { valid: false, reason: "unknown_token" } }],
    ["a 401", { status: 401, body: { valid: false, reason: "unknown_token" } }],
    ["a 400", { status: 400, body: { valid: false, reason: "invalid_token_format" } }],
  ]) {
    reply = next;
    const p = project();
    const r = await run(good, p);
    check(r.code !== 0 && !existsSync(join(p, ".mcp.json")), `a token rejected with ${label} writes nothing`, r.out);
    check(/unknown_token|invalid_token_format/.test(r.out), `and says why (${label})`, r.out);
  }

  // A server we can't reach says nothing about the token, so the install goes on.
  for (const [label, next, url] of [
    ["a 500", { status: 500, body: {} }, api],
    ["a server that's down", { status: 200, body: {} }, "--api=http://127.0.0.1:9"],
  ]) {
    reply = next;
    const p = project();
    const r = await run(["setup", "--token=imr_abc12345", "--project=acme", url], p);
    check(r.code === 0 && existsSync(join(p, ".mcp.json")) && /could not validate/.test(r.out), `${label} still installs, with a warning`, r.out);
  }

  // --- Setup leaves a user's files alone ------------------------------------------
  reply = { status: 200, body: { valid: true } };
  {
    const broken = "{ user's broken file";
    const p = project({ ".mcp.json": broken });
    requests.length = 0;
    const r = await run(good, p);
    check(r.code !== 0 && readFileSync(join(p, ".mcp.json"), "utf8") === broken, "a corrupt .mcp.json is left untouched and setup stops", r.out);
    check(/\.mcp\.json/.test(r.out), "and says which file", r.out);
    check(requests.length === 0, "and nothing was registered on the server", JSON.stringify(requests));

    const q = project({ ".mcp.json": '{"mcpServers":{"other":{"command":"x"}}}' });
    await run(good, q);
    const merged = JSON.parse(readFileSync(join(q, ".mcp.json"), "utf8"));
    check(merged.mcpServers.other && merged.mcpServers.dwic, "other servers are kept");
  }

  // --- The token warning ------------------------------------------------------------
  {
    const r = await run(good, project());
    check(/\.gitignore/.test(r.out) && /token/i.test(r.out), "warns when .mcp.json isn't ignored by git", r.out);
    const quiet = await run(good, project({ ".gitignore": "node_modules\n.mcp.json\n" }));
    check(!/\.gitignore/.test(quiet.out), "stays quiet when it is ignored", quiet.out);
  }

  // --- Audit: the anonymous ping arrives, and carries no project content -------------
  {
    const p = project({ "Secret.tsx": `const S = () => <main><h1>TOPSECRETCOPY</h1><img src="/private/acme-logo.png" /></main>;` });
    reply = { status: 200, body: { ok: true } };
    requests.length = 0;
    const r = await run([p, "--no-baseline"], p, { DWIC_API_URL: stubUrl });
    check(requests.length === 1 && requests[0].url === "/api/events", "a normal run delivers its ping", `${requests.length} ${r.out.slice(0, 120)}`);
    const sent = requests[0]?.body ?? "";
    check(!/TOPSECRETCOPY|acme-logo|Secret\.tsx|dwic-safety/.test(sent), "the ping holds no copy, paths or file names", sent.slice(0, 400));
    check(JSON.parse(sent || "{}").token?.startsWith("anon_"), "the ping is anonymous", sent.slice(0, 200));

    requests.length = 0;
    await run([p, "--no-baseline", "--no-telemetry"], p, { DWIC_API_URL: stubUrl });
    check(requests.length === 0, "--no-telemetry sends nothing");
    requests.length = 0;
    await run([p, "--no-baseline"], p, { DWIC_API_URL: stubUrl, DWIC_TELEMETRY: "off" });
    check(requests.length === 0, "DWIC_TELEMETRY=off sends nothing");

    reply = { hang: true };
    const t = Date.now();
    const slow = await run([p, "--no-baseline"], p, { DWIC_API_URL: stubUrl });
    check(slow.code !== null && Date.now() - t < 4000, "a hanging server delays the audit by 2s at most", `${Date.now() - t}ms`);
    reply = { status: 200, body: { ok: true } };
  }

  // --- Audit: reading nothing doesn't look like passing -------------------------------
  {
    const p = project({ "src/App.vue": "<template><img src='a'></template>" });
    const r = await run([p, "--no-baseline", "--no-telemetry"], p);
    check(!/passes CI|No errors or warnings/.test(r.out), "a project with no readable files doesn't claim to pass", r.out);
    check(/Nothing to audit/.test(r.out) && /\.tsx/.test(r.out), "and says what it reads", r.out);
    const real = await run([project({ "A.tsx": "const A = () => <main><h1>x</h1></main>;" }), "--no-baseline", "--no-telemetry"], p);
    check(!/Nothing to audit/.test(real.out), "a project with files doesn't get that message", real.out);
  }

  // --- Audit: symlinks ---------------------------------------------------------------
  {
    const p = project({ "src/A.tsx": "const A = () => <main><h1>x</h1><img src='a' /></main>;" });
    symlinkSync(p, join(p, "src", "loop"));
    symlinkSync(join(p, "src"), join(p, "alias"));
    const r = await run([p, "--json", "--no-baseline", "--no-telemetry"], p);
    const d = JSON.parse(r.out);
    check(d.scanned.markupCount === 1, "symlinks don't scan a file more than once", JSON.stringify(d.scanned));
  }
} finally {
  stub.close();
  rmSync(work, { recursive: true, force: true });
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — setup and the audit are safe on a user's machine.\n");
process.exit(0);
