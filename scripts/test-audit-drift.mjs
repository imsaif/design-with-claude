#!/usr/bin/env node
// Regression test for the drift diff engine.
//
// Covers:
//   1. No baseline → empty report with hasBaseline=false
//   2. Identical findings → all unchanged
//   3. New finding shows up in newFindings + sev totals correct
//   4. Resolved finding shows up in resolvedFindings + sev totals correct
//   5. Severity bump (warn → error) shows up in worsened, NOT new
//   6. Identity is stable across line shifts and small numeric jitter
//   7. Identity differs across distinct token names
//   8. parseBaselineFile rejects bad schema
//   9. buildBaselineFile preserves findings + framework

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { diff, buildBaselineFile, parseBaselineFile, _internal } = await import(
  resolve(repoRoot, "dist/audit/drift.js")
);

let failed = 0;
function pass(m) { process.stdout.write(`  ✔ ${m}\n`); }
function fail(m, extra) { failed++; process.stderr.write(`  ✘ ${m}\n`); if (extra) process.stderr.write(`    ${extra}\n`); }

function makeResult(category, findings) {
  return {
    category,
    severity: findings.some((f) => f.severity === "error")
      ? "error"
      : findings.some((f) => f.severity === "warn")
        ? "warn"
        : findings.some((f) => f.severity === "info")
          ? "info"
          : "clean",
    findings,
    gist: "",
    counts: {
      error: findings.filter((f) => f.severity === "error").length,
      warn: findings.filter((f) => f.severity === "warn").length,
      info: findings.filter((f) => f.severity === "info").length,
    },
  };
}

// --- 1. No baseline ---
{
  const current = [makeResult("color", [{ severity: "error", token: "primary", message: "X" }])];
  const report = diff(current, null);
  if (report.hasBaseline !== false) fail("hasBaseline should be false when null baseline");
  else pass("no baseline → hasBaseline=false");
  if (report.newFindings.length !== 0) fail("no baseline → newFindings should be empty");
  else pass("no baseline → newFindings empty");
}

// --- 2. Identical findings ---
{
  const findings = [
    { severity: "warn", token: "primary-500", message: "#2D56D2 on #ffffff fails WCAG AA (ratio 4.10)." },
  ];
  const baseline = buildBaselineFile([makeResult("color", findings)], "nextjs");
  const report = diff([makeResult("color", findings)], baseline);
  if (report.unchangedCount !== 1) fail(`identical → unchanged should be 1, got ${report.unchangedCount}`);
  else pass("identical → 1 unchanged");
  if (report.newFindings.length !== 0) fail("identical → no new");
  else pass("identical → 0 new");
  if (report.resolvedFindings.length !== 0) fail("identical → no resolved");
  else pass("identical → 0 resolved");
  if (report.worsened.length !== 0) fail("identical → no worsened");
  else pass("identical → 0 worsened");
}

// --- 3. New finding ---
{
  const before = [
    { severity: "warn", token: "primary-500", message: "#2D56D2 on #ffffff fails WCAG AA (ratio 4.10)." },
  ];
  const after = [
    ...before,
    { severity: "error", token: "mandated accent", message: "Brand-mandated accent #1F3B90 is not present in any --color-* token." },
  ];
  const baseline = buildBaselineFile([makeResult("color", before)], "nextjs");
  const report = diff([makeResult("color", after)], baseline);
  if (report.newFindings.length !== 1) fail(`new → 1 expected, got ${report.newFindings.length}`);
  else pass("new finding picked up");
  if (report.totals.new.error !== 1) fail(`new error count should be 1, got ${report.totals.new.error}`);
  else pass("new error count correct");
  if (report.unchangedCount !== 1) fail("warn finding still unchanged");
  else pass("preserved unchanged across new addition");
}

// --- 4. Resolved finding ---
{
  const before = [
    { severity: "warn", token: "primary-500", message: "#2D56D2 on #ffffff fails WCAG AA (ratio 4.10)." },
    { severity: "error", token: "mandated accent", message: "Brand-mandated accent #1F3B90 is not present in any --color-* token." },
  ];
  const after = [
    { severity: "warn", token: "primary-500", message: "#2D56D2 on #ffffff fails WCAG AA (ratio 4.10)." },
  ];
  const baseline = buildBaselineFile([makeResult("color", before)], "nextjs");
  const report = diff([makeResult("color", after)], baseline);
  if (report.resolvedFindings.length !== 1) fail(`resolved → 1 expected, got ${report.resolvedFindings.length}`);
  else pass("resolved finding picked up");
  if (report.totals.resolved.error !== 1) fail(`resolved error count should be 1, got ${report.totals.resolved.error}`);
  else pass("resolved error count correct");
}

// --- 5. Worsened severity ---
{
  const before = [
    { severity: "warn", token: "primary-500", message: "#2D56D2 on #ffffff fails WCAG AA (ratio 4.10)." },
  ];
  const after = [
    { severity: "error", token: "primary-500", message: "#2D56D2 on #ffffff fails WCAG AA (ratio 4.10)." },
  ];
  const baseline = buildBaselineFile([makeResult("color", before)], "nextjs");
  const report = diff([makeResult("color", after)], baseline);
  if (report.worsened.length !== 1) fail(`worsened → 1 expected, got ${report.worsened.length}`);
  else pass("severity bump picked up");
  if (report.newFindings.length !== 0) fail("severity bump must NOT show as new");
  else pass("severity bump not double-counted as new");
  if (report.worsened[0]?.previousSeverity !== "warn") fail("previousSeverity should be warn");
  else pass("previousSeverity preserved");
}

// --- 6. Identity stable across numeric jitter & line shifts ---
{
  // The same rule firing on slightly-different numeric values (the off-grid
  // spacing finding being reported as "13px not a clean multiple" vs "14px not
  // a clean multiple") should NOT be treated as resolved + new — that would
  // make the drift signal noisy. Numbers in the message get normalised to "#".
  const before = [
    { severity: "warn", token: "--space-3", message: "13px is not a clean multiple of the 4px base." },
  ];
  const after = [
    { severity: "warn", token: "--space-3", message: "14px is not a clean multiple of the 4px base." },
  ];
  const baseline = buildBaselineFile([makeResult("spacing", before)], "nextjs");
  const report = diff([makeResult("spacing", after)], baseline);
  if (report.unchangedCount !== 1) fail("numeric jitter should not break identity");
  else pass("identity stable across numeric jitter");
  if (report.newFindings.length !== 0) fail("numeric jitter falsely created a new finding");
  else pass("no false-new from numeric jitter");
}

// --- 7. Identity differs across distinct subjects ---
{
  // Same message shape, different tokens → must be different findings.
  const before = [
    { severity: "warn", token: "--space-3", message: "13px is not a clean multiple of the 4px base." },
  ];
  const after = [
    { severity: "warn", token: "--space-5", message: "13px is not a clean multiple of the 4px base." },
  ];
  const baseline = buildBaselineFile([makeResult("spacing", before)], "nextjs");
  const report = diff([makeResult("spacing", after)], baseline);
  if (report.newFindings.length !== 1) fail("different subject must produce a new finding");
  else pass("identity differs across token names");
  if (report.resolvedFindings.length !== 1) fail("old subject must be resolved");
  else pass("old subject treated as resolved");
}

// --- 8. parseBaselineFile rejects bad schema ---
{
  if (parseBaselineFile("not json") !== null) fail("parser should reject non-JSON");
  else pass("parser rejects non-JSON");
  if (parseBaselineFile(JSON.stringify({})) !== null) fail("parser should reject missing schemaVersion");
  else pass("parser rejects missing schemaVersion");
  if (parseBaselineFile(JSON.stringify({ schemaVersion: "wrong/1" })) !== null) fail("parser should reject wrong schemaVersion");
  else pass("parser rejects wrong schemaVersion");
  const ok = parseBaselineFile(
    JSON.stringify({ schemaVersion: "dwic.baseline/1", runAt: "2026-04-27T00:00:00Z", framework: "nextjs", categories: [] }),
  );
  if (!ok) fail("parser should accept valid file");
  else pass("parser accepts valid baseline");
}

// --- 9. buildBaselineFile shape ---
{
  const findings = [{ severity: "warn", token: "x", message: "y" }];
  const file = buildBaselineFile([makeResult("color", findings)], "vite");
  if (file.schemaVersion !== "dwic.baseline/1") fail("baseline schema marker missing");
  else pass("baseline schema marker present");
  if (file.framework !== "vite") fail("framework not preserved");
  else pass("framework preserved");
  if (file.categories[0]?.findings[0]?.token !== "x") fail("findings not preserved");
  else pass("findings preserved through buildBaselineFile");
  // Round-trip via JSON to assert serialisable
  const round = parseBaselineFile(JSON.stringify(file));
  if (!round || round.categories[0]?.findings[0]?.token !== "x") fail("baseline failed JSON round-trip");
  else pass("baseline round-trips through JSON");
}

// --- 10. Internal helpers sanity ---
{
  const k1 = _internal.findingKey("color", { severity: "warn", token: "primary", message: "Hello 12px world" });
  const k2 = _internal.findingKey("color", { severity: "warn", token: "primary", message: "Hello 14px world" });
  if (k1 !== k2) fail("internal findingKey should normalise numerics");
  else pass("findingKey normalises numerics");
  const k3 = _internal.findingKey("color", { severity: "warn", token: "secondary", message: "Hello 12px world" });
  if (k1 === k3) fail("internal findingKey should distinguish subjects");
  else pass("findingKey distinguishes subjects");
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — drift diff engine wired.\n");
