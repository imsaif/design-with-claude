#!/usr/bin/env node
// Regression test for the dashboard renderer.
//
// Covers:
//   1.  NO_COLOR disables ANSI
//   2.  Category severity sort (errors first, clean last)
//   3.  One-screen cap (≤ 50 lines for a normal run with drift block)
//   4.  Headline action picks ONE specialist with a Claude Code prompt
//   5.  Category rows reference all 8 categories
//   6.  JSON renderer produces valid JSON v2 with all categories
//   7.  Report path surfaced when non-null
//   8.  Install CTA only when showInstallCta is true
//   9.  cwd line uses opts.cwd, not process.cwd
//  10.  Shows cap notice when markup files capped
//  11.  First-run notice when drift.hasBaseline is false
//  12.  Drift summary line when prior baseline existed
//  13.  "no drift" wording when nothing changed
//  14.  Drift block hidden when drift opt is null
//  15.  JSON output carries drift block when present

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { renderDashboard, renderJson } = await import(resolve(repoRoot, "dist/audit/dashboard.js"));
const { aggregate } = await import(resolve(repoRoot, "dist/audit/aggregator.js"));
const { buildBaselineFile, diff } = await import(resolve(repoRoot, "dist/audit/drift.js"));

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
  const out = renderDashboard(detected, inputs, results, { reportPath: ".dwic/audit.md", showInstallCta: true, cwd: "/tmp/demo", drift: null });
  if (/\x1b\[/.test(out)) fail("NO_COLOR didn't suppress ANSI");
  else pass("NO_COLOR suppresses ANSI escapes");
}

// --- 2. Severity sort ---
{
  const out = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/demo", drift: null });
  const pos = (label) => out.indexOf(label);
  const motionIdx = pos("Motion");
  const navIdx = pos("Navigation");
  if (motionIdx === -1 || navIdx === -1) fail("category rows missing");
  else if (motionIdx > navIdx) fail("severity sort broken — Motion (error) should precede Navigation (clean)");
  else pass("severity sort: errors before cleans");
}

// --- 3. Screen cap ---
{
  const out = renderDashboard(detected, inputs, results, { reportPath: ".dwic/audit.md", showInstallCta: true, cwd: "/tmp/demo", drift: null });
  const lines = out.split("\n").length;
  if (lines > 50) fail(`dashboard too tall: ${lines} lines`);
  else pass(`dashboard fits (${lines} lines)`);
}

// --- 4. Headline action picks ONE specialist + a Claude Code prompt ---
{
  const out = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/demo", drift: null });
  if (!/What to do next:/.test(out)) fail("headline 'What to do next' block missing");
  else pass("headline 'What to do next' present");
  // Error categories in this fixture: accessibility + color (contrast) + motion.
  // Accessibility outranks the rest (failing AA blocks shipping), so the
  // headline must surface accessibility-specialist.
  if (!/accessibility-specialist/.test(out)) fail("headline didn't surface accessibility-specialist for highest-priority error");
  else pass("headline surfaces accessibility-specialist for fixture");
  if (/motion-designer/.test(out)) fail("headline shouldn't mention motion-designer when accessibility outranks it");
  else pass("headline picks ONE specialist (accessibility, not motion)");
  if (!/In Claude Code, ask/.test(out)) fail("Claude Code prompt template missing");
  else pass("Claude Code prompt template surfaced");
}

// --- 5. All categories present ---
{
  const out = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/demo", drift: null });
  for (const label of ["Color", "Typography", "Spacing", "Accessibility", "Forms", "Navigation", "Motion", "Copy"]) {
    if (!out.includes(label)) fail(`dashboard missing category: ${label}`);
  }
  pass("all 8 categories rendered");
}

// --- 6. JSON output ---
{
  const json = renderJson(detected, inputs, results, null);
  const parsed = JSON.parse(json);
  if (parsed.schema !== "dwic.audit.summary/2") fail(`JSON schema marker missing or wrong (got ${parsed.schema})`);
  else pass("JSON schema marker");
  if (parsed.results.length !== 8) fail("JSON missing categories");
  else pass("JSON has 8 categories");
  if (!parsed.project.framework) fail("JSON missing project.framework");
  else pass("JSON project block");
  if (!parsed.headlineAction || parsed.headlineAction.tool !== "accessibility-specialist") fail("JSON missing headlineAction or wrong category");
  else pass("JSON headlineAction block");
}

// --- 7. Report path surfaced ---
{
  const out = renderDashboard(detected, inputs, results, { reportPath: ".dwic/audit-2026-04-22.md", showInstallCta: false, cwd: "/tmp/demo", drift: null });
  if (!out.includes(".dwic/audit-2026-04-22.md")) fail("report path not echoed");
  else pass("report path echoed");
  const outNoPath = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/demo", drift: null });
  if (/Report written to/.test(outNoPath)) fail("report-path line shown even when null");
  else pass("report-path line suppressed when null");
}

// --- 8. Install CTA gating ---
{
  const withCta = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: true, cwd: "/tmp/demo", drift: null });
  const withoutCta = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/demo", drift: null });
  if (!withCta.includes("dwic-audit setup --token")) fail("install CTA missing when enabled");
  else pass("install CTA shown when enabled");
  if (withoutCta.includes("dwic-audit setup --token")) fail("install CTA leaked when disabled");
  else pass("install CTA hidden when disabled");
}

// --- 9. cwd from opts ---
{
  const out = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/custom-path", drift: null });
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
  const out = renderDashboard(detected, cappedInputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/demo", drift: null });
  if (!/capped markup scan/.test(out)) fail("cap notice not shown when cappedAt set");
  else pass("cap notice shown");
}

// --- 11. First-run notice when no baseline ---
{
  const drift = diff(results, null);
  const out = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/demo", drift });
  if (!/First audit on this project/.test(out)) fail("first-run notice missing when baseline absent");
  else pass("first-run notice shown");
}

// --- 12. Drift summary line when prior baseline existed ---
{
  // Build a baseline that does NOT contain the motion error — current run will
  // therefore have one new error against the baseline.
  const priorResults = results.map((r) =>
    r.category === "motion"
      ? { ...r, severity: "clean", findings: [], counts: { error: 0, warn: 0, info: 0 } }
      : r,
  );
  const baseline = buildBaselineFile(priorResults, "nextjs", new Date(Date.now() - 60 * 60 * 1000));
  const drift = diff(results, baseline);
  const out = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/demo", drift });
  if (!/Since last run:/.test(out)) fail("'Since last run' header missing");
  else pass("'Since last run' header present");
  if (!/new/.test(out.split("Since last run:")[1] ?? "")) fail("drift summary didn't surface new findings");
  else pass("drift summary mentions new findings");
}

// --- 13. "no drift" wording when nothing changed ---
{
  const baseline = buildBaselineFile(results, "nextjs");
  const drift = diff(results, baseline);
  const out = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/demo", drift });
  if (!/no drift since last run/.test(out)) fail("'no drift' line missing when project unchanged");
  else pass("'no drift' line shown when unchanged");
}

// --- 14. Drift block hidden when drift opt is null ---
{
  const out = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/demo", drift: null });
  if (/Since last run:/.test(out)) fail("drift block leaked when drift is null");
  else pass("drift block suppressed when drift is null");
  if (/First audit on this project/.test(out)) fail("first-run notice leaked when drift is null");
  else pass("first-run notice suppressed when drift is null");
}

// --- 15. JSON carries drift block when present ---
{
  const baseline = buildBaselineFile(results, "nextjs");
  const drift = diff(results, baseline);
  const json = renderJson(detected, inputs, results, drift);
  const parsed = JSON.parse(json);
  if (!parsed.drift || parsed.drift.hasBaseline !== true) fail("JSON drift block missing or wrong");
  else pass("JSON drift block present");
}

// --- 16. Priority banding: accessibility-first, with EAA line + CI hint ---
{
  const out = renderDashboard(detected, inputs, results, { reportPath: null, showInstallCta: false, cwd: "/tmp/demo", drift: null });
  if (!/Fix before you ship/.test(out)) fail("'Fix before you ship' band header missing");
  else pass("ship-blocker band header present");
  if (!/EU Accessibility Act/.test(out)) fail("EAA compliance line missing when WCAG band has findings");
  else pass("EAA compliance line shown for WCAG findings");
  // Accessibility (WCAG band) must render before Motion (non-WCAG cleanup band).
  if (out.indexOf("Accessibility") > out.indexOf("Motion")) fail("accessibility should band above non-WCAG categories");
  else pass("accessibility bands above non-WCAG categories");
  if (!/fails CI/.test(out)) fail("CI exit hint missing when errors present");
  else pass("CI exit hint surfaced when errors present");
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — audit dashboard wired.\n");
