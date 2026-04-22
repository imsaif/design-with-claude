#!/usr/bin/env node
// Regression test for markdown report writer.
//
// Covers:
//   1. Writes to .dwic/audit-<date>.md
//   2. Header contains framework + tech stack
//   3. All 8 categories have headings
//   4. Findings grouped by severity (✗/⚠/·)
//   5. Next steps section only mentions tools for non-clean categories
//   6. No absolute paths leak into the report (no PII)

import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { writeMarkdownReport } = await import(resolve(repoRoot, "dist/audit/markdown-report.js"));
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

const css = `:root { --color-primary: #00B7BD; } .a { transition: all 1s; }`;
const markup = `<form><input type="text" /><button>Click here</button></form>`;
const results = aggregate({
  cssFiles: [], markupFiles: [],
  cssContent: css, markupContent: markup,
  totals: { cssCount: 0, markupCount: 0, cappedAt: null },
});

const dir = mkdtempSync(join(tmpdir(), "dwic-report-"));

try {
  const report = writeMarkdownReport(dir, detected, results);
  const content = readFileSync(report.path, "utf8");

  // --- 1 ---
  if (!/\.dwic\/audit-\d{4}-\d{2}-\d{2}\.md$/.test(report.relativePath)) {
    fail(`report path format unexpected: ${report.relativePath}`);
  } else {
    pass(`report path: ${report.relativePath}`);
  }

  // --- 2 ---
  if (!/nextjs/.test(content) || !/Next\.js 15/.test(content)) fail("report missing framework/stack");
  else pass("report header includes framework + stack");

  // --- 3 ---
  for (const heading of ["Color", "Typography", "Spacing", "Accessibility", "Forms", "Navigation", "Motion", "Copy"]) {
    if (!new RegExp(`## ${heading} —`, "i").test(content)) fail(`missing heading: ${heading}`);
  }
  pass("all 8 category headings present");

  // --- 4 ---
  // Motion is the strongest error case — expect an ✗ ERROR block somewhere
  if (!/✗ ERROR/.test(content)) fail("ERROR sub-heading not rendered");
  else pass("ERROR severity grouping rendered");

  // --- 5 ---
  if (!/Next steps/.test(content)) fail("Next steps section missing");
  else pass("Next steps section present");
  // Expect at least one mode:"audit" reference, specifically for motion (error)
  if (!/motion-designer.*mode:"audit"/.test(content)) fail("motion-designer follow-up missing");
  else pass("motion-designer follow-up present");
  // Clean categories (navigation has no <nav> here — clean) should NOT appear in Next steps
  const nextStepsBlock = content.split("## Next steps")[1]?.split("## How this report was made")[0] ?? "";
  if (/navigation-specialist/.test(nextStepsBlock)) fail("clean category leaked into Next steps");
  else pass("clean categories excluded from Next steps");

  // --- 6 ---
  if (content.includes(dir)) fail("PII: tmp path leaked into report");
  else pass("no tmp/absolute path leak");

} finally {
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — audit markdown report wired.\n");
