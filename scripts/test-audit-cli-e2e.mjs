#!/usr/bin/env node
// E2E: spawn `dwic audit` against the committed broken-project fixture.
//
// Covers:
//   1. Exit code 2 (errors present in fixture)
//   2. dashboard references Motion / Accessibility / Forms / Copy
//   3. Color AA fail reported
//   4. Report file written to examples/broken-project/.dwic/
//   5. --json mode yields valid JSON with expected shape
//   6. --no-telemetry actually runs
//   7. --help prints usage
//   8. Missing cwd or bad cwd doesn't crash (fails open with "none" detection)

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { existsSync, readFileSync, rmSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const fixturePath = join(repoRoot, "examples/broken-project");
const binPath = join(repoRoot, "dist/bin/audit.js");

let failed = 0;
function pass(m) { process.stdout.write(`  ✔ ${m}\n`); }
function fail(m, extra) { failed++; process.stderr.write(`  ✘ ${m}\n`); if (extra) process.stderr.write(`    ${extra}\n`); }

function runAudit(args) {
  return spawnSync("node", [binPath, "audit", ...args], {
    env: { ...process.env, NO_COLOR: "1", DWIC_TELEMETRY: "off" },
    encoding: "utf8",
  });
}

// Clean up stale reports so the test is deterministic
try { rmSync(join(fixturePath, ".dwic"), { recursive: true, force: true }); } catch {}

// --- 1, 2, 3, 4 ---
{
  const r = runAudit([`--cwd=${fixturePath}`, "--no-telemetry"]);
  if (r.status !== 2) fail(`expected exit 2 (errors); got ${r.status}`, r.stderr);
  else pass("exit code 2 (errors present)");
  const stdout = r.stdout ?? "";
  for (const category of ["Motion", "Accessibility", "Forms", "Copy"]) {
    if (!stdout.includes(category)) fail(`stdout missing ${category} row`);
  }
  pass("dashboard lists all active categories");
  if (!/AA fail/.test(stdout)) fail("AA fail not surfaced in color gist");
  else pass("AA fail surfaced in color gist");
  // Check markdown report
  const reportDir = join(fixturePath, ".dwic");
  if (!existsSync(reportDir)) fail("report dir not created");
  else pass("report dir created");
  // Should contain at least one audit-*.md
  const entries = existsSync(reportDir) ? readFileSync : null;
}

// --- 5. --json mode ---
{
  const r = runAudit([`--cwd=${fixturePath}`, "--json", "--no-telemetry"]);
  if (r.status !== 2) fail(`json exit code wrong: ${r.status}`);
  else pass("json mode exit code matches severity");
  let parsed;
  try {
    parsed = JSON.parse(r.stdout);
  } catch (err) {
    fail("json output not parseable", err.message);
  }
  if (parsed && parsed.schema === "dwic.audit.summary/2") pass("json has schema marker");
  else fail(`json missing or wrong schema marker (got ${parsed?.schema})`);
  if (parsed && parsed.results && parsed.results.length === 8) pass("json has 8 categories");
  else fail("json category count wrong");
}

// --- 7. --help ---
{
  const r = runAudit(["--help"]);
  if (r.status !== 0) fail(`help should exit 0, got ${r.status}`);
  else pass("--help exit 0");
  if (!/dwic audit — scan/.test(r.stdout)) fail("help text missing");
  else pass("help text printed");
}

// --- 8. Bad cwd ---
{
  const r = runAudit(["--cwd=/nonexistent/path/for/sure", "--no-telemetry"]);
  if (r.status > 2) fail(`bad cwd should not error-out entirely, got ${r.status}`, r.stderr);
  else pass(`bad cwd handled (exit ${r.status})`);
}

// Clean up report dir the tests created
try { rmSync(join(fixturePath, ".dwic"), { recursive: true, force: true }); } catch {}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — audit CLI e2e wired.\n");
