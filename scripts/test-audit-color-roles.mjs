#!/usr/bin/env node
// Regression test for the color-audit role classifier + theme-aware contrast
// pairing. Pre-fix, every --background-*, --surface-*, --border-* token was
// tested for WCAG body-text contrast against #ffffff and #121212, producing
// dozens of false positives on real design systems. The classifier should now
// skip non-text roles and pair text/accent tokens against the correct surface
// based on their declaration scope.
//
// Run with `npm run test:audit-color-roles`.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { aggregate } = await import(resolve(repoRoot, "dist/audit/aggregator.js"));

let failed = 0;
function pass(m) { process.stdout.write(`  ✔ ${m}\n`); }
function fail(m, extra) { failed++; process.stderr.write(`  ✘ ${m}\n`); if (extra) process.stderr.write(`    ${extra}\n`); }

function runColor(css) {
  const inputs = {
    cssFiles: [],
    markupFiles: [],
    cssContent: css,
    markupContent: "",
    totals: { cssCount: 0, markupCount: 0, cappedAt: null },
  };
  const results = aggregate(inputs);
  return results.find((r) => r.category === "color");
}

// 1. Surface tokens are skipped entirely.
{
  const css = `
    :root {
      --background-primary: #ffffff;
      --background-secondary: #fafafa;
      --surface-primary: #ffffff;
      --surface-elevated: #f5f5f5;
    }
  `;
  const r = runColor(css);
  if (r.counts.error + r.counts.warn !== 0) fail(`surface tokens should not trigger contrast warns, got ${r.counts.warn}`);
  else pass("--background-* and --surface-* tokens are skipped");
}

// 2. Border / divider / ring tokens are skipped.
{
  const css = `
    :root {
      --border-primary: #e5e7eb;
      --border-secondary: #d1d5db;
      --divider-subtle: #fcfcfc;
      --ring-focus: #3b82f6;
      --outline-default: #f9f9f9;
    }
  `;
  const r = runColor(css);
  if (r.counts.error + r.counts.warn !== 0) fail(`border/divider/ring tokens should not trigger contrast warns, got ${r.counts.warn}`);
  else pass("--border-*, --divider-*, --ring-*, --outline-* tokens are skipped");
}

// 3. Decorative / status tokens are skipped.
{
  const css = `
    :root {
      --success: #10b981;
      --warning: #f59e0b;
      --shadow-elevated: #00000020;
      --highlight-subtle: #fff7ed;
    }
  `;
  const r = runColor(css);
  if (r.counts.error + r.counts.warn !== 0) fail(`decorative/status tokens should not trigger contrast warns, got ${r.counts.warn}`);
  else pass("--success/--warning/--shadow/--highlight tokens are skipped");
}

// 4. --accent-subtle / --accent-muted / --primary-bg classify as surface.
{
  const css = `
    :root {
      --accent-subtle: #f5f5f5;
      --accent-muted: #fafafa;
      --primary-bg: #ffffff;
    }
  `;
  const r = runColor(css);
  if (r.counts.error + r.counts.warn !== 0) fail(`accent-subtle/-muted/-bg should be classified as surface, got ${r.counts.warn} warn`);
  else pass("--accent-subtle / --accent-muted / --primary-bg classify as surface");
}

// 5. Real text-contrast failures still fire.
{
  const css = `
    :root {
      --text-secondary: #94a3b8;
    }
  `;
  const r = runColor(css);
  if (r.counts.error !== 1) fail(`expected 1 error for failing body-text token, got ${r.counts.error}`);
  else pass("body-text token failing AA contrast still fires (as error)");
  if (!/--text-secondary/.test(r.findings[0]?.token ?? "")) fail("finding should reference the text token");
  else pass("finding identifies the failing text token");
}

// 5b. Intentionally-low-contrast text variants are downgraded to decorative.
{
  const css = `
    :root {
      --text-disabled: #94a3b8;
      --text-placeholder: #cbd5e1;
      --text-hint: #94a3b8;
      --text-inactive: #94a3b8;
    }
  `;
  const r = runColor(css);
  if (r.counts.error + r.counts.warn !== 0) fail(`expected 0 warns for low-contrast-by-design text variants, got ${r.counts.warn}`);
  else pass("--text-disabled/-placeholder/-hint/-inactive treated as decorative (WCAG 1.4.3 inactive-UI exemption)");
}

// 6. Dark-mode tokens are paired against dark surface (not light).
{
  const css = `
    :root {
      --background-primary: #ffffff;
      --text-primary: #162036;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --background-primary: #0f0f0f;
        --text-primary: #fafafa;
      }
    }
  `;
  const r = runColor(css);
  // Light --text-primary on #ffffff: ratio 14.86 (passes). Dark --text-primary
  // on light #ffffff would be 1.04 (fails) — pre-fix bug.
  // With theme-aware pairing, dark token pairs against #0f0f0f → ratio 17.99 (passes).
  if (r.counts.error + r.counts.warn !== 0) {
    fail(`dark-mode --text-primary should pair against dark surface, got ${r.counts.warn} warn(s)`,
         JSON.stringify(r.findings.map(f => ({ tok: f.token, msg: f.message }))));
  } else {
    pass("dark-mode tokens pair against dark surface, not light");
  }
}

// 7. [data-theme="dark"] scope is recognized as dark.
{
  const css = `
    :root { --text-primary: #162036; }
    [data-theme="dark"] {
      --text-primary: #ffffff;
    }
  `;
  const r = runColor(css);
  if (r.counts.error + r.counts.warn !== 0) fail(`[data-theme="dark"] tokens should pair against dark surface, got ${r.counts.warn}`);
  else pass("[data-theme=\"dark\"] scope recognized as dark");
}

// 8. .dark scope is recognized as dark.
{
  const css = `
    :root { --text-primary: #162036; }
    .dark {
      --text-primary: #fafafa;
    }
  `;
  const r = runColor(css);
  if (r.counts.error + r.counts.warn !== 0) fail(`.dark scoped tokens should pair against dark surface, got ${r.counts.warn}`);
  else pass(".dark scope recognized as dark");
}

// 9. Accent tokens (without -subtle/-muted suffix) are still tested.
{
  const css = `
    :root {
      --accent-primary: #94a3b8;
    }
  `;
  const r = runColor(css);
  if (r.counts.error !== 1) fail(`accent token failing AA should error, got ${r.counts.error}`);
  else pass("accent token (used as text/CTA) still tested");
}

// 10. Project-specific surface is detected (not just hardcoded #ffffff).
{
  const css = `
    :root {
      --background-primary: #fafafa;
      --text-primary: #f0f0f0;
    }
  `;
  const r = runColor(css);
  // Text #f0f0f0 against detected surface #fafafa → ratio ~1.05 → fails
  if (r.counts.error !== 1) fail(`detected surface should be used (got ${r.counts.error} error)`);
  else if (!r.findings[0].message.includes("#fafafa")) fail(`finding should mention detected surface #fafafa, got: ${r.findings[0].message}`);
  else pass("project-specific surface detected and used in pairing");
}

// 11. Mandated-accent check still works.
{
  const css = `
    :root {
      --color-primary-500: #2d56d2;
    }
  `;
  const inputs = {
    cssFiles: [],
    markupFiles: [],
    cssContent: css,
    markupContent: "",
    totals: { cssCount: 0, markupCount: 0, cappedAt: null },
  };
  const { aggregate } = await import(resolve(repoRoot, "dist/audit/aggregator.js"));
  const r = aggregate(inputs, { mandatedAccent: "#1F3B90" }).find((x) => x.category === "color");
  if (r.counts.error !== 1) fail(`mandated-accent missing should still error, got ${r.counts.error}`);
  else pass("mandated-accent missing still surfaces as error");
}

// 12. Empty token set still returns clean.
{
  const r = runColor("");
  if (r.severity !== "clean") fail(`empty CSS should be clean, got ${r.severity}`);
  else pass("empty CSS is clean");
}

// 13. Namespace-prefixed tokens classify the same as bare tokens. Tailwind v4
// (`--color-bg-*`, `--color-text-*`), shadcn-style (`--theme-text-*`), and app
// prefixes (`--ds-bg-*`) should not produce false-positive contrast findings.
{
  const css = `
    :root {
      --color-background-50: #ffffff;
      --color-bg-primary: #ffffff;
      --color-surface-elevated: #f5f5f5;
      --color-border-subtle: #e5e7eb;
      --color-text-disabled: #b8b8b8;
      --theme-bg-default: #ffffff;
      --ds-border-divider: #e5e7eb;
    }
  `;
  const r = runColor(css);
  if (r.counts.error + r.counts.warn !== 0) {
    fail(`namespace-prefixed surface/border/disabled tokens should not warn, got ${r.counts.warn}`,
         JSON.stringify(r.findings.map(f => ({ tok: f.token, msg: f.message }))));
  } else {
    pass("namespace prefixes (--color-, --theme-, --ds-) are stripped before classification");
  }
}

// 14. Namespace-prefixed text tokens that genuinely fail AA still fire.
{
  const css = `
    :root {
      --color-text-secondary: #b8b8b8;
    }
  `;
  const r = runColor(css);
  if (r.counts.error !== 1) fail(`namespaced text token failing AA should error, got ${r.counts.error}`);
  else pass("namespace-prefixed text tokens still tested for contrast");
}

// 15. Custom-prefix non-text tokens (line/surface/soft under an arbitrary
// namespace like --dr-*) classify as border/surface via the generic-segment
// retry and are skipped, not false-flagged as failing body text.
{
  const css = `
    :root {
      --dr-line: #e6ebf5;
      --dr-line-strong: #d8dde8;
      --dr-surface: #ffffff;
      --dr-soft: #f7f9fd;
    }
  `;
  const r = runColor(css);
  if (r.counts.error + r.counts.warn !== 0)
    fail(`custom-prefix line/surface/soft tokens should be skipped, got ${r.counts.error}e/${r.counts.warn}w`,
         JSON.stringify(r.findings.map((f) => f.token)));
  else pass("custom-prefix (--dr-line / -surface / -soft) classify as border/surface, not flagged");
}

// 16. The retry must NOT suppress real failures: a custom-prefix TEXT token
// that genuinely fails AA still fires.
{
  const css = `
    :root {
      --dr-text-secondary: #b8b8b8;
    }
  `;
  const r = runColor(css);
  if (r.counts.error !== 1) fail(`custom-prefix failing text token should error, got ${r.counts.error}`);
  else pass("custom-prefix failing text token still flagged (retry does not hide real failures)");
}

if (failed > 0) {
  process.stderr.write(`\n${failed} test(s) failed\n`);
  process.exit(1);
}
process.stdout.write(`\nall color-roles tests passed\n`);
