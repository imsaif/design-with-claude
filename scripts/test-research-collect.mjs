#!/usr/bin/env node
// Unit tests for the Research Scout collector's PURE functions (no network).
// Network wrappers (search.mjs, firstCommit.mjs) are exercised live via
// `npm run research:collect`, not here.
import assert from "node:assert/strict";
import { classifyFrontend, FRONTEND_DEPS } from "./research/collect/classify.mjs";
import { quarterOf, toCsv, rowFrom, CSV_HEADER } from "./research/collect/toCsv.mjs";
import { wilson95, formatCi } from "./research/collect/stats.mjs";

let passed = 0;
const ok = (name) => { console.log(`  ✓ ${name}`); passed++; };

// --- classifyFrontend -------------------------------------------------------
// package.json with a frontend dep => frontend
assert.equal(classifyFrontend({ packageJson: { dependencies: { react: "^18" } }, primaryLanguage: "TypeScript" }), true);
ok("react dep => frontend");

// frontend dep can live in devDependencies
assert.equal(classifyFrontend({ packageJson: { devDependencies: { vite: "^5" } }, primaryLanguage: null }), true);
ok("vite in devDependencies => frontend");

// package.json present but NO frontend dep => NON-frontend (does not fall through to language)
assert.equal(classifyFrontend({ packageJson: { dependencies: { express: "^4" } }, primaryLanguage: "HTML" }), false);
ok("backend deps + HTML language => non-frontend (package.json wins)");

// no package.json, static-site language => frontend
assert.equal(classifyFrontend({ packageJson: null, primaryLanguage: "Svelte" }), true);
ok("no package.json + Svelte language => frontend");

// no package.json, non-UI language => non-frontend
assert.equal(classifyFrontend({ packageJson: null, primaryLanguage: "Go" }), false);
ok("no package.json + Go => non-frontend");

// no signal at all => non-frontend (conservative)
assert.equal(classifyFrontend({ packageJson: null, primaryLanguage: null }), false);
ok("no signal => non-frontend");

// the documented dep list is present and includes the key frameworks
for (const dep of ["react", "next", "vue", "svelte", "astro", "nuxt", "solid-js", "tailwindcss", "@radix-ui", "vite"]) {
  assert.ok(FRONTEND_DEPS.includes(dep), `FRONTEND_DEPS missing ${dep}`);
}
ok("FRONTEND_DEPS matches method doc");

// --- quarterOf --------------------------------------------------------------
assert.equal(quarterOf("2026-03-15T10:57:48Z"), "2026Q1");
ok("2026-03 => 2026Q1");
assert.equal(quarterOf("2025-10-31T11:42:13Z"), "2025Q4");
ok("2025-10 => 2025Q4");
assert.equal(quarterOf("2025-04-01T00:00:00Z"), "2025Q2");
ok("2025-04 => 2025Q2");
assert.equal(quarterOf("2026-07-01T00:00:00Z"), "2026Q3");
ok("2026-07 => 2026Q3");

// --- toCsv / rowFrom --------------------------------------------------------
const rows = [
  rowFrom({ repo: "securego/gosec", fingerprint: "CLAUDE.md", firstCommit: "2026-03-15T10:57:48Z", isFrontend: false }),
  rowFrom({ repo: "vercel/next.js", fingerprint: "AGENTS.md", firstCommit: "2025-10-31T11:42:13Z", isFrontend: true }),
];
const csv = toCsv(rows);
const lines = csv.trim().split("\n");
assert.equal(lines[0], CSV_HEADER);
ok("CSV header matches reference shape");
assert.equal(lines[0], "repo,fingerprint,first_commit,quarter,is_frontend");
ok("CSV header is the exact agentic-terminal-sample.csv columns");
assert.equal(lines[1], "securego/gosec,CLAUDE.md,2026-03-15T10:57:48Z,2026Q1,0");
ok("row: quarter derived + is_frontend 0");
assert.equal(lines[2], "vercel/next.js,AGENTS.md,2025-10-31T11:42:13Z,2025Q4,1");
ok("row: is_frontend 1");
assert.ok(csv.endsWith("\n"), "CSV should end with newline");
ok("CSV ends with trailing newline");

// --- wilson95 / formatCi (the dry-run p=0 false-precision bug) --------------
// The bug: 0/40 must NOT report a zero-width interval.
{
  const { low, high } = wilson95(0, 40);
  assert.equal(low, 0, "0/40 lower bound is 0");
  assert.ok(high > 0.05 && high < 0.13, `0/40 upper bound should be ~9%, got ${(high * 100).toFixed(1)}%`);
}
ok("wilson95(0,40) => [0, ~9%] not [0,0] (kills the ±0 false precision)");

{
  const { low, high } = wilson95(40, 40);
  assert.equal(high, 1, "40/40 upper bound is 1");
  assert.ok(low < 0.95 && low > 0.87, `40/40 lower bound should be ~91%, got ${(low * 100).toFixed(1)}%`);
}
ok("wilson95(40,40) => [~91%, 1] not [1,1] at the p=1 edge");

{
  // Study #2's headline: 63/278 ≈ 23%, published 95% CI ≈ 18–28%.
  const { low, high } = wilson95(63, 278);
  assert.ok(Math.round(low * 100) >= 18 && Math.round(low * 100) <= 19, `low ~18%, got ${Math.round(low * 100)}`);
  assert.ok(Math.round(high * 100) >= 27 && Math.round(high * 100) <= 29, `high ~28%, got ${Math.round(high * 100)}`);
}
ok("wilson95(63,278) reproduces study #2's 18–28% CI");

assert.equal(formatCi(63, 278), "23% (95% CI 18–28%, n=278)");
ok("formatCi renders the study-#2 headline string");
assert.equal(formatCi(0, 0), "0% (95% CI 0–100%, n=0)");
ok("formatCi handles n=0 without dividing by zero");

console.log(`\n✅ research-collect: ${passed} assertions passed`);
