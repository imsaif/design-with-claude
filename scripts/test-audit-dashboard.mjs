#!/usr/bin/env node
// Regression test for the dashboard renderer.
//
// Covers:
//   1. NO_COLOR disables ANSI
//   2. Category severity sort (errors first, clean last)
//   3. One-screen cap (≤ 40 lines for a normal run)
//   4. Follow-up suggestions capped at 3
//   5. Category rows reference all 8 categories
//   6. JSON renderer produces valid JSON with all categories
//   7. Report path surfaced when non-null
//   8. Install CTA only when showInstallCta is true
//   9. cwd line uses opts.cwd, not process.cwd
//  10. Shows cap notice when markup files capped

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { renderDashboard, renderJson } = await import(resolve(repoRoot, "dist/audit/dashboard.js"));
const { aggregate } = await import(resolve(repoRoot, "dist/audit/aggregator.js"));

let failed = 0;
function pass(m) { process.stdout.write(`  ✔ ${m}\n`); }
function fail(m, extra) { failed++; process.stderr.write(`  ✘ ${m}\n`); if (extra) process.stderr.write(`    ${extra}\n`); }

const detected = {
  framework: "nextjs",
  frameworkVersion: "15.0.0",
  techStack: ["Next.js 15", "React", "TypeScript"],
  designSystemHints: [],
  slug: "demo",
  confidence: "high",
};
const inputs = {
  cssFiles: ["themes.css"],
  markupFiles: ["src/a.tsx"],
  cssContent: `:root { --color-primary: #00B7BD; } .a { transition: all 1s; }`,
  markupContent: `<form><input type="text" /><button>Click here</button></form>`,
  totals: { cssCount: 1, markupCount: 1, cappedAt: null },
};
const results = aggregate(inputs);

// Force NO_COLOR so test output is deterministic
process.env.NO_COLOR = "1";

// --- 1. NO_COLOR ---
{
  const out = renderDashboard(detected, inputs, results, { reportPath: ".dwic/audit.md", showInstallCta: true, cwd: "/tmp/demo" });
  if (/\x1b\[/.test(out)) fail("NO_COLOR didn't suppress ANSI");
  else pass("NO_COLOR suppresses ANSI escapes");
}

// --- 2. Severity sort ---
{
  const out = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/demo" });
  // Find category positions in output
  const pos = (label) => out.indexOf(label);
  // Errors should come before cleans. Given our inputs, motion is error; navigation is clean (no <nav>).
  const motionIdx = pos("Motion");
  const navIdx = pos("Navigation");
  if (motionIdx === -1 || navIdx === -1) fail("category rows missing");
  else if (motionIdx > navIdx) fail("severity sort broken — Motion (error) should precede Navigation (clean)");
  else pass("severity sort: errors before cleans");
}

// --- 3. Screen cap ---
{
  const out = renderDashboard(detected, inputs, results, { reportPath: ".dwic/audit.md", showInstallCta: true, cwd: "/tmp/demo" });
  const lines = out.split("\n").length;
  if (lines > 40) fail(`dashboard too tall: ${lines} lines`);
  else pass(`dashboard fits (${lines} lines)`);
}

// --- 4. Follow-ups capped at 3 ---
{
  const out = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/demo" });
  const followUpMatches = out.match(/with mode:"audit"/g) ?? [];
  if (followUpMatches.length > 3) fail(`follow-ups exceeded 3: ${followUpMatches.length}`);
  else pass(`follow-ups ≤ 3 (got ${followUpMatches.length})`);
}

// --- 5. All categories present ---
{
  const out = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/demo" });
  for (const label of ["Color", "Typography", "Spacing", "Accessibility", "Forms", "Navigation", "Motion", "Copy"]) {
    if (!out.includes(label)) fail(`dashboard missing category: ${label}`);
  }
  pass("all 8 categories rendered");
}

// --- 6. JSON output ---
{
  const json = renderJson(detected, inputs, results);
  const parsed = JSON.parse(json);
  if (parsed.schema !== "dwic.audit.summary/1") fail("JSON schema marker missing");
  else pass("JSON schema marker");
  if (parsed.results.length !== 8) fail("JSON missing categories");
  else pass("JSON has 8 categories");
  if (!parsed.project.framework) fail("JSON missing project.framework");
  else pass("JSON project block");
}

// --- 7. Report path surfaced ---
{
  const out = renderDashboard(detected, inputs, results, { reportPath: ".dwic/audit-2026-04-22.md", showInstallCta: false, cwd: "/tmp/demo" });
  if (!out.includes(".dwic/audit-2026-04-22.md")) fail("report path not echoed");
  else pass("report path echoed");
  const outNoPath = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/demo" });
  if (/Report written to/.test(outNoPath)) fail("report-path line shown even when null");
  else pass("report-path line suppressed when null");
}

// --- 8. Install CTA gating ---
{
  const withCta = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: true, cwd: "/tmp/demo" });
  const withoutCta = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/demo" });
  if (!withCta.includes("Install dwic")) fail("install CTA missing when enabled");
  else pass("install CTA shown when enabled");
  if (withoutCta.includes("Install dwic")) fail("install CTA leaked when disabled");
  else pass("install CTA hidden when disabled");
}

// --- 9. cwd from opts ---
{
  const out = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/custom-path" });
  if (!out.includes("/tmp/custom-path")) fail("dashboard didn't use opts.cwd");
  else pass("dashboard uses opts.cwd");
}

// --- 10. Cap notice ---
{
  const cappedInputs = {
    ...inputs,
    markupFiles: new Array(200).fill("x.tsx"),
    totals: { cssCount: 1, markupCount: 1, cappedAt: 850 },
  };
  const out = renderDashboard(detected, cappedInputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/demo" });
  if (!/capped markup scan/.test(out)) fail("cap notice not shown when cappedAt set");
  else pass("cap notice shown");
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — audit dashboard wired.\n");
