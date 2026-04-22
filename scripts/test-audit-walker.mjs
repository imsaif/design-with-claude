#!/usr/bin/env node
// Regression test for the audit walker.
//
// Covers:
//   1. Finds themes.css + components under src/
//   2. Skips node_modules / .next / dist / .git
//   3. Respects maxFiles cap on markup
//   4. High-signal CSS (themes.css) sorted ahead of plain .css
//   5. JSX files without an element are excluded
//   6. Empty dir — no throws, zero inputs
//   7. CSS/markup overrides appended
//   8. relative() paths in cssFiles/markupFiles

import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { walkProject } = await import(resolve(repoRoot, "dist/audit/walker.js"));

let failed = 0;
function pass(m) { process.stdout.write(`  ✔ ${m}\n`); }
function fail(m, extra) { failed++; process.stderr.write(`  ✘ ${m}\n`); if (extra) process.stderr.write(`    ${extra}\n`); }

function makeFixture(files) {
  const dir = mkdtempSync(join(tmpdir(), "dwic-walker-"));
  for (const [rel, body] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body, "utf8");
  }
  return dir;
}
const cleanup = [];
function track(d) { cleanup.push(d); return d; }

// --- 1 + 4 ---
{
  const dir = track(
    makeFixture({
      "package.json": "{}",
      "themes.css": ":root { --color-primary: #1F3B90; }",
      "src/globals.css": "* { box-sizing: border-box; }",
      "src/components/Button.tsx": "export const X = () => <button>ok</button>;",
    }),
  );
  const inputs = walkProject(dir);
  if (inputs.cssFiles.length !== 2) fail(`css count ${inputs.cssFiles.length} !== 2`);
  else pass("found both CSS files");
  if (!/themes\.css/.test(inputs.cssFiles[0])) fail("themes.css should sort first (high-signal)");
  else pass("high-signal CSS sorted ahead of plain");
  if (inputs.markupFiles.length !== 1) fail(`markup count ${inputs.markupFiles.length} !== 1`);
  else pass("found Button.tsx");
  if (!/--color-primary/.test(inputs.cssContent)) fail("cssContent missing token");
  else pass("cssContent aggregated");
}

// --- 2. Skip dirs ---
{
  const dir = track(
    makeFixture({
      "package.json": "{}",
      "src/app.tsx": "export default () => <div>x</div>;",
      "node_modules/react/cjs/react.development.js": "// noise",
      ".next/cache/foo.tsx": "export default () => <div>.next noise</div>;",
      "dist/bundle.tsx": "export default () => <div>dist</div>;",
      ".git/objects/abc.tsx": "export default () => <div>git</div>;",
    }),
  );
  const inputs = walkProject(dir);
  if (inputs.markupFiles.length !== 1) fail(`skip-dirs failed — got ${inputs.markupFiles.length} markup files, expected 1`);
  else pass("skip set excludes node_modules/.next/dist/.git");
}

// --- 3. maxFiles ---
{
  const files = { "package.json": "{}" };
  for (let i = 0; i < 10; i++) {
    files[`src/c${i}.tsx`] = `export default () => <div>${i}</div>;`;
  }
  const dir = track(makeFixture(files));
  const inputs = walkProject(dir, { maxFiles: 3 });
  if (inputs.markupFiles.length !== 3) fail(`maxFiles not respected — got ${inputs.markupFiles.length}`);
  else pass("maxFiles cap applied");
  if (inputs.totals.cappedAt !== 10) fail(`cappedAt should report original count (10); got ${inputs.totals.cappedAt}`);
  else pass("cappedAt reports pre-cap total");
}

// --- 5. JSX without element excluded ---
{
  const dir = track(
    makeFixture({
      "package.json": "{}",
      "src/hooks/useCount.ts": "export const useCount = () => 1;",
      "src/components/C.tsx": "export const C = () => <p>ok</p>;",
      "src/utils/noise.tsx": "export const Z = 1;",
    }),
  );
  const inputs = walkProject(dir);
  if (inputs.markupFiles.length !== 1) fail(`JSX-without-element exclusion wrong: ${inputs.markupFiles.join(", ")}`);
  else pass("pure TS files without JSX excluded");
}

// --- 6. Empty dir ---
{
  const dir = track(makeFixture({ "package.json": "{}" }));
  const inputs = walkProject(dir);
  if (inputs.cssFiles.length !== 0 || inputs.markupFiles.length !== 0) {
    fail(`empty project should return zero inputs; got ${inputs.cssFiles.length}/${inputs.markupFiles.length}`);
  } else {
    pass("empty project returns zero inputs without throwing");
  }
}

// --- 7. Overrides ---
{
  const dir = track(
    makeFixture({
      "package.json": "{}",
      "extra-tokens.css": ":root { --space-1: 4px; }",
      "lib/extra.tsx": "export const X = () => <div>x</div>;",
    }),
  );
  const inputs = walkProject(dir, {
    cssOverrides: ["extra-tokens.css"],
    markupOverrides: ["lib/extra.tsx"],
  });
  // Override paths should be additive even if they'd also be found by the walker
  if (!/--space-1/.test(inputs.cssContent)) fail("override css not absorbed");
  else pass("css override absorbed");
}

// --- 8. Relative paths ---
{
  const dir = track(
    makeFixture({
      "package.json": "{}",
      "src/styles/themes.css": ":root { --x: 1px; }",
    }),
  );
  const inputs = walkProject(dir);
  const p = inputs.cssFiles[0];
  if (!p || p.startsWith("/")) fail(`expected relative path, got absolute: ${p}`);
  else pass(`relative path: ${p}`);
}

for (const dir of cleanup) {
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — audit walker wired.\n");
