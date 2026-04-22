#!/usr/bin/env node
// Regression test for C9 slice 3 — project-config auto-detector.
//
// Covers:
//   1. Next.js 15 + Tailwind v4 + TS → framework "nextjs", techStack contains
//      "Next.js 15" + "React" + "TypeScript" + "Tailwind v4", confidence "high"
//   2. Vite + React + plain CSS → framework "vite", confidence "partial"+
//   3. Empty dir (no package.json) → confidence "none", no throws
//   4. Malformed package.json → confidence "none", no throws
//   5. themes.css with --color-primary-500 → designSystemHints includes accent
//   6. --space-* tokens → designSystemHints includes base unit
//   7. Slug sanitized from package.json name
//   8. renderDetectionHints produces a markdown block when confidence != "none"
//   9. renderDetectionHints returns null when confidence === "none"

import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { detectProjectConfig, renderDetectionHints } = await import(
  resolve(repoRoot, "dist/utils/detect-project-config.js")
);

let failed = 0;
function pass(m) { process.stdout.write(`  ✔ ${m}\n`); }
function fail(m, extra) { failed++; process.stderr.write(`  ✘ ${m}\n`); if (extra) process.stderr.write(`    ${extra}\n`); }

function makeFixture(files) {
  const dir = mkdtempSync(join(tmpdir(), "dwic-detect-"));
  for (const [rel, body] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body, "utf8");
  }
  return dir;
}

const cleanup = [];
function track(dir) { cleanup.push(dir); return dir; }

// --- 1. Next.js 15 + Tailwind v4 + TS ---
{
  const dir = track(
    makeFixture({
      "package.json": JSON.stringify({
        name: "@acme/landing",
        dependencies: { next: "15.0.0", react: "19.0.0" },
        devDependencies: { typescript: "5.6.0", tailwindcss: "4.0.0" },
      }),
    }),
  );
  const d = detectProjectConfig(dir);
  if (d.framework !== "nextjs") fail(`nextjs: framework wrong (${d.framework})`);
  else pass("nextjs: framework detected");
  if (!d.techStack.some((s) => /Next\.js 15/.test(s))) fail(`nextjs: techStack missing Next.js 15 (${d.techStack.join(", ")})`);
  else pass("nextjs: techStack includes Next.js 15");
  if (!d.techStack.includes("React")) fail("nextjs: React missing");
  else pass("nextjs: React present");
  if (!d.techStack.includes("TypeScript")) fail("nextjs: TypeScript missing");
  else pass("nextjs: TypeScript present");
  if (!d.techStack.some((s) => /Tailwind v4/.test(s))) fail(`nextjs: Tailwind v4 missing (${d.techStack.join(", ")})`);
  else pass("nextjs: Tailwind v4 present");
  if (d.confidence !== "high") fail(`nextjs: confidence should be high (${d.confidence})`);
  else pass("nextjs: confidence high");
  if (d.slug !== "landing") fail(`nextjs: slug wrong (${d.slug})`);
  else pass(`nextjs: slug sanitized → ${d.slug}`);
}

// --- 2. Vite + React ---
{
  const dir = track(
    makeFixture({
      "package.json": JSON.stringify({
        name: "my-app",
        dependencies: { react: "18.0.0" },
        devDependencies: { vite: "5.0.0" },
      }),
    }),
  );
  const d = detectProjectConfig(dir);
  if (d.framework !== "vite") fail(`vite: framework wrong (${d.framework})`);
  else pass("vite: framework detected");
  if (d.techStack.some((s) => /Tailwind/.test(s))) fail(`vite: false positive Tailwind`);
  else pass("vite: no Tailwind detected");
  if (d.confidence === "none") fail("vite: confidence should be at least partial");
  else pass(`vite: confidence ${d.confidence}`);
}

// --- 3. Empty dir ---
{
  const dir = track(makeFixture({ "readme.txt": "nothing to see" }));
  const d = detectProjectConfig(dir);
  if (d.confidence !== "none") fail(`empty: confidence should be none (${d.confidence})`);
  else pass("empty: confidence none");
  if (d.techStack.length !== 0) fail(`empty: techStack should be empty (${d.techStack.join(", ")})`);
  else pass("empty: techStack empty");
}

// --- 4. Malformed package.json ---
{
  const dir = track(makeFixture({ "package.json": "not valid json at all" }));
  let d;
  try { d = detectProjectConfig(dir); } catch (err) { fail("malformed: threw", String(err?.message ?? err)); }
  if (d) {
    if (d.confidence !== "none") fail(`malformed: confidence should be none (${d.confidence})`);
    else pass("malformed: confidence none without throwing");
  }
}

// --- 5. themes.css with mandated accent ---
{
  const dir = track(
    makeFixture({
      "package.json": JSON.stringify({ name: "cognition", dependencies: { next: "15.0.0", react: "19.0.0" } }),
      "themes.css": `
        :root {
          --color-primary-500: #1F3B90;
          --color-accent-500: #00B7BD;
          --color-neutral-0: #ffffff;
          --color-neutral-900: #121212;
        }
      `,
    }),
  );
  const d = detectProjectConfig(dir);
  if (!d.designSystemHints.some((h) => /--color-\*/.test(h))) {
    fail(`themes.css: color-token hint missing (${d.designSystemHints.join(" | ")})`);
  } else {
    pass(`themes.css: color-token hint present → "${d.designSystemHints[0]}"`);
  }
  if (!d.designSystemHints.some((h) => /#1f3b90/i.test(h))) {
    fail("themes.css: mandated accent hex not surfaced");
  } else {
    pass("themes.css: mandated accent surfaced in hints");
  }
}

// --- 6. --space-* tokens ---
{
  const dir = track(
    makeFixture({
      "package.json": JSON.stringify({ name: "spacey", dependencies: { next: "15.0.0", react: "18.0.0" } }),
      "tokens.css": `
        :root {
          --space-1: 4px;
          --space-2: 8px;
          --space-3: 12px;
          --space-4: 16px;
        }
      `,
    }),
  );
  const d = detectProjectConfig(dir);
  if (!d.designSystemHints.some((h) => /--space-\*/.test(h))) {
    fail(`space tokens: hint missing (${d.designSystemHints.join(" | ")})`);
  } else {
    pass(`space tokens: hint present → "${d.designSystemHints.find((h) => /--space-\*/.test(h))}"`);
  }
  if (!d.designSystemHints.some((h) => /≈ 4px/.test(h))) {
    fail("space tokens: smallest step (4px) not inferred");
  } else {
    pass("space tokens: base unit inferred");
  }
}

// --- 7. Scoped package name → slug stripped ---
{
  const dir = track(
    makeFixture({
      "package.json": JSON.stringify({ name: "@acme/my_fancy-app", dependencies: { vite: "5.0.0" } }),
    }),
  );
  const d = detectProjectConfig(dir);
  if (d.slug !== "my-fancy-app") fail(`slug: unexpected "${d.slug}"`);
  else pass(`slug: scoped + underscore sanitized → ${d.slug}`);
}

// --- 8. renderDetectionHints markdown ---
{
  const dir = track(
    makeFixture({
      "package.json": JSON.stringify({ name: "acme", dependencies: { next: "15.0.0", react: "19.0.0" } }),
    }),
  );
  const d = detectProjectConfig(dir);
  const md = renderDetectionHints(d);
  if (!md || !/We detected/.test(md)) fail("renderDetectionHints: missing heading");
  else pass("renderDetectionHints: heading present");
  if (md && !/Tech stack/.test(md)) fail("renderDetectionHints: tech stack line missing");
  else if (md) pass("renderDetectionHints: tech stack line present");
}

// --- 9. renderDetectionHints null when none ---
{
  const dir = track(makeFixture({ "readme.txt": "empty" }));
  const d = detectProjectConfig(dir);
  const md = renderDetectionHints(d);
  if (md !== null) fail("renderDetectionHints: should return null when confidence=none");
  else pass("renderDetectionHints: null when confidence=none");
}

// Cleanup tmp fixtures
for (const dir of cleanup) {
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — project-config detector wired.\n");
