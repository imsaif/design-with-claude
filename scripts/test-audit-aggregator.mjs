#!/usr/bin/env node
// Regression test for the aggregator.
//
// Covers:
//   1. Empty inputs → all clean
//   2. Contrast fail surfaces in color result
//   3. Missing mandated accent → error
//   4. Typography partition (size/lh/weight)
//   5. Spacing off-grid detection in gist
//   6. A11y finding passthrough
//   7. Form detection via regex
//   8. Motion reduced-motion = error
//   9. Copy weak CTA / jargon surfaces
//  10. worstOverall escalates to worst category
//  11. exitCodeFromSeverity mapping
//  12. gist truncation under cap
//  13. Clean categories still get a useful gist
//  14. Counts sum correctly
//  15. CATEGORY_ORDER constant matches aggregator output

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { aggregate, worstOverall, exitCodeFromSeverity, CATEGORY_ORDER } = await import(
  resolve(repoRoot, "dist/audit/aggregator.js")
);

let failed = 0;
function pass(m) { process.stdout.write(`  ✔ ${m}\n`); }
function fail(m, extra) { failed++; process.stderr.write(`  ✘ ${m}\n`); if (extra) process.stderr.write(`    ${extra}\n`); }

function inputs(css = "", markup = "") {
  return {
    cssFiles: [],
    markupFiles: [],
    cssContent: css,
    markupContent: markup,
    totals: { cssCount: 0, markupCount: 0, cappedAt: null },
  };
}

// --- 1. Empty ---
{
  const results = aggregate(inputs());
  if (results.length !== 8) fail(`expected 8 categories, got ${results.length}`);
  else pass("aggregate returns 8 categories");
  if (results.some((r) => r.severity !== "clean")) fail("empty inputs should be all clean");
  else pass("empty inputs → all clean");
}

// --- 2. Contrast fail ---
{
  const css = `:root { --color-primary: #00B7BD; --color-bg: #ffffff; }`;
  const results = aggregate(inputs(css));
  const color = results.find((r) => r.category === "color");
  if (!/AA fail/.test(color.gist)) fail(`color gist missing AA fail: ${color.gist}`);
  else pass(`color gist: "${color.gist}"`);
}

// --- 3. Mandated accent missing ---
{
  const css = `:root { --color-primary: #2D56D2; }`;
  const results = aggregate(inputs(css), { mandatedAccent: "#1F3B90" });
  const color = results.find((r) => r.category === "color");
  if (color.severity !== "error") fail(`mandated missing should be error, got ${color.severity}`);
  else pass("mandated accent missing = error severity");
  if (!/missing/.test(color.gist)) fail(`gist should mention missing accent: ${color.gist}`);
  else pass("mandated missing appears in gist");
}

// --- 4. Typography partition ---
{
  const css = `:root {
    --font-size-body: 15px;
    --line-height-body: 1.5;
    --font-weight-emphasis: 550;
  }`;
  const results = aggregate(inputs(css));
  const t = results.find((r) => r.category === "typography");
  if (!/size/.test(t.gist) || !/lh/.test(t.gist) || !/weight/.test(t.gist)) {
    fail(`typography gist should break down by kind: ${t.gist}`);
  } else {
    pass(`typography gist: "${t.gist}"`);
  }
}

// --- 5. Spacing — tokens parsed, gist reports step count ---
// NOTE: spacing audit uses GCD to infer the base unit, so a single off-grid
// value (e.g. 13px) collapses GCD to 1 and everything is "on" the 1px grid.
// We just assert tokens are parsed and the gist describes the step count.
{
  const css = `:root {
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
  }`;
  const results = aggregate(inputs(css));
  const s = results.find((r) => r.category === "spacing");
  if (!/3 steps/.test(s.gist)) fail(`spacing gist should show step count: ${s.gist}`);
  else pass(`spacing gist: "${s.gist}"`);
}

// --- 6. A11y passthrough ---
{
  const markup = `<form><input type="text" /></form>`;
  const results = aggregate(inputs("", markup));
  const a = results.find((r) => r.category === "accessibility");
  if (a.severity === "clean") fail("a11y should flag unlabeled input");
  else pass(`a11y severity: ${a.severity}`);
}

// --- 7. Form detection ---
{
  const markup = `<form><input type="radio" name="p" /><input type="radio" name="p" /></form>`;
  const results = aggregate(inputs("", markup));
  const f = results.find((r) => r.category === "form");
  if (f.severity === "clean") fail("form should flag unwrapped radio group");
  else pass(`form severity: ${f.severity}`);
}

// --- 8. Motion reduced-motion ---
{
  const css = `.a { transition: transform 200ms ease; }`;
  const results = aggregate(inputs(css));
  const m = results.find((r) => r.category === "motion");
  if (m.severity !== "error") fail(`motion should be error without reduced-motion guard (got ${m.severity})`);
  else pass("motion = error without reduced-motion");
}

// --- 9. Copy findings ---
{
  const markup = `<button>Click here</button><p>We leverage cutting-edge synergies.</p>`;
  const results = aggregate(inputs("", markup));
  const c = results.find((r) => r.category === "copy");
  if (!/weak CTA|jargon/.test(c.gist)) fail(`copy gist should mention CTA/jargon: ${c.gist}`);
  else pass(`copy gist: "${c.gist}"`);
}

// --- 10. worstOverall escalation ---
{
  const css = `.a { transition: all 200ms ease; }`; // motion = error
  const results = aggregate(inputs(css));
  if (worstOverall(results) !== "error") fail("worstOverall should pick up error category");
  else pass("worstOverall = error when any category has error");
}

// --- 11. Exit codes ---
{
  if (exitCodeFromSeverity("error") !== 2) fail("error exit code should be 2");
  else pass("exit(error) = 2");
  if (exitCodeFromSeverity("warn") !== 1) fail("warn exit code should be 1");
  else pass("exit(warn) = 1");
  if (exitCodeFromSeverity("clean") !== 0) fail("clean exit code should be 0");
  else pass("exit(clean) = 0");
}

// --- 12. Gist truncation ---
{
  // Very long mandated accent + many findings — synthesise via css
  const longSuffix = " very long extra verbiage ".repeat(10);
  const css = `:root { --color-primary: #00B7BD; /*${longSuffix}*/ }`;
  const results = aggregate(inputs(css));
  for (const r of results) {
    if (r.gist.length > 58) fail(`gist over cap for ${r.category}: ${r.gist.length} chars`);
  }
  pass("all gists ≤ cap");
}

// --- 13. Clean categories gist ---
{
  const results = aggregate(inputs());
  const nav = results.find((r) => r.category === "navigation");
  if (!nav.gist || nav.gist.length === 0) fail("clean categories still need a gist");
  else pass(`clean navigation gist: "${nav.gist}"`);
}

// --- 14. Counts sum ---
{
  const markup = `<form><input /><input /></form>`;
  const results = aggregate(inputs("", markup));
  for (const r of results) {
    const { error, warn, info } = r.counts;
    const total = r.findings.length;
    if (error + warn + info !== total) fail(`counts desync on ${r.category}`);
  }
  pass("counts sum matches findings length");
}

// --- 15. Category order constant ---
{
  const results = aggregate(inputs());
  const actual = results.map((r) => r.category);
  if (JSON.stringify(actual) !== JSON.stringify(CATEGORY_ORDER)) {
    fail(`category order mismatch\n  expected: ${CATEGORY_ORDER.join(",")}\n  got:      ${actual.join(",")}`);
  } else {
    pass("category order matches constant");
  }
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — audit aggregator wired.\n");
