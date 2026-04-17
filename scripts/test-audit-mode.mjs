#!/usr/bin/env node
// Fixture-based regression test for C2 (audit mode + mandated-accent preservation
// + server-computed contrast). Invokes color-specialist in both modes and asserts
// the contract the Cognition field notes named.
//
// Covers:
//   1. accent is preserved exactly as primary-500 in generate mode
//   2. contrast ratios are annotated on every seed token (generate mode)
//   3. audit mode parses existingTokensCss and returns a matrix, not a seed
//   4. turquoise-on-white is flagged as AA-body failing in the audit output
//   5. audit mode with no existingTokensCss returns a soft-fail, not a seed
//   6. contrastRatio math: known pairs produce known values
//
// Run with `npm run test:audit-mode`.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { tools } = await import(resolve(repoRoot, "dist/tools/index.js"));
const { contrastRatio, parseTokensFromCss, buildPrimaryRamp } = await import(
  resolve(repoRoot, "dist/tools/color.js")
);

let failed = 0;
function pass(msg) {
  process.stdout.write(`  ✔ ${msg}\n`);
}
function fail(msg, extra) {
  failed++;
  process.stderr.write(`  ✘ ${msg}\n`);
  if (extra) process.stderr.write(`    ${extra}\n`);
}

const colorTool = tools.find((t) => t.name === "color-specialist");
if (!colorTool) {
  fail("color-specialist tool not exported");
  process.exit(1);
}

// --- 1. Mandated-accent preservation (the #1F3B90 → #2d56d2 bug from field notes) ---
{
  const result = await colorTool.handler({
    brief: "Cognition — navy #1F3B90 as mandated primary.",
    accent: "#1F3B90",
  });
  const primary500 = result.output.data.tokens.find((t) => t.name === "--color-primary-500");
  if (!primary500) {
    fail("generate mode: --color-primary-500 missing from palette");
  } else if (primary500.hex.toLowerCase() !== "#1f3b90") {
    fail(
      `generate mode: primary-500 should be exact mandated accent #1F3B90, got ${primary500.hex}`,
    );
  } else {
    pass("generate mode: primary-500 is the exact mandated accent hex");
  }

  // Belt-and-suspenders: test buildPrimaryRamp directly too.
  const ramp = buildPrimaryRamp("#1F3B90");
  const rampFive = ramp.find((r) => r.step === 500);
  if (!rampFive || rampFive.hex.toLowerCase() !== "#1f3b90") {
    fail(`buildPrimaryRamp("#1F3B90") step 500 should equal #1F3B90, got ${rampFive?.hex}`);
  } else {
    pass("buildPrimaryRamp preserves exact accent at step 500");
  }
}

// --- 2. Contrast ratios annotated in generate mode ---
{
  const result = await colorTool.handler({
    brief: "Calm productivity tool",
    accent: "#5B8DEF",
  });
  const text = result.text;
  if (!/on #FFFFFF:\s*\d+\.\d{2}:1/.test(text)) {
    fail("generate mode: no per-token on-white contrast ratio in composed prompt");
  } else {
    pass("generate mode: per-token contrast ratio against #FFFFFF is present");
  }
  if (!/on #121212:\s*\d+\.\d{2}:1/.test(text)) {
    fail("generate mode: no per-token on-dark contrast ratio in composed prompt");
  } else {
    pass("generate mode: per-token contrast ratio against #121212 is present");
  }
}

// --- 3. Audit mode: Cognition-style themes.css → matrix, no fresh seed ---
const cognitionCss = `
:root {
  --color-primary: #1F3B90;
  --color-primary-contrast: #FFFFFF;
  --color-accent: #00B7BD;
  --color-surface: #FFFFFF;
  --color-text-secondary: #00B7BD;
  --color-text: #231F20;
  --color-border: #E5E7EB;
}
html[data-theme="dark"] {
  --color-surface: #121212;
  --color-text: #F7F8FA;
}
`;

{
  const result = await colorTool.handler({
    brief:
      "Audit our existing themes.css. Flag any accessibility issues — especially turquoise on white.",
    accent: "#1F3B90",
    mode: "audit",
    existingTokensCss: cognitionCss,
  });
  const text = result.text;

  if (!text.toLowerCase().includes("audit")) {
    fail("audit mode: composed prompt doesn't indicate audit mode");
  } else {
    pass("audit mode: composed prompt is flagged as audit");
  }

  // The parsed tokens should appear in the output data, NOT a fresh seed ramp.
  const tokens = result.output.data.tokens;
  if (tokens.length === 0) {
    fail("audit mode: parsed tokens missing from output payload");
  } else {
    pass(`audit mode: ${tokens.length} tokens parsed into output payload`);
  }
  const hasSeedRamp = tokens.some((t) => /^--color-primary-(50|100|200)$/.test(t.name));
  if (hasSeedRamp) {
    fail("audit mode: output contains a fresh seed ramp (should only echo existing tokens)");
  } else {
    pass("audit mode: no fresh seed ramp emitted (correct — audit returns diagnostic, not seed)");
  }

  // The matrix should be visible in the composed prompt.
  if (!/Contrast matrix/.test(text)) {
    fail("audit mode: contrast matrix heading missing from composed prompt");
  } else {
    pass("audit mode: contrast matrix rendered in composed prompt");
  }

  // Turquoise-on-white must appear as a failing pairing. The token is named
  // --color-accent in the input, with hex #00B7BD, failing AA on #FFFFFF.
  if (!/--color-accent.*#00b7bd.*#ffffff.*2\.4\d:1/is.test(text)) {
    fail("audit mode: turquoise-on-white (accent on #FFFFFF, ~2.47:1) not flagged");
  } else {
    pass("audit mode: turquoise-on-white flagged with computed ~2.47:1 ratio");
  }

  // Mandated-accent check should confirm #1F3B90 is present.
  if (!/Mandated accent check/.test(text)) {
    fail("audit mode: mandated-accent-check section missing");
  } else if (!/#1F3B90/.test(text)) {
    fail("audit mode: mandated accent #1F3B90 not referenced");
  } else {
    pass("audit mode: mandated-accent check present and references #1F3B90");
  }

  // Explicit-ask directive from C3 must still apply.
  if (!text.includes("Explicit asks from the brief")) {
    fail("audit mode: C3 explicit-ask directive lost");
  } else {
    pass("audit mode: C3 explicit-ask directive still applies");
  }
}

// --- 4. Audit mode with no CSS → soft-fail, no seed ---
{
  const result = await colorTool.handler({
    brief: "Audit my palette.",
    mode: "audit",
  });
  const text = result.text;
  const tokens = result.output.data.tokens;
  if (tokens.length !== 0) {
    fail("audit mode (no CSS): expected empty palette, got tokens");
  } else {
    pass("audit mode (no CSS): empty palette returned");
  }
  if (!/cannot audit what it cannot see|no `existingTokensCss`/i.test(text)) {
    fail("audit mode (no CSS): soft-fail guidance not in composed prompt");
  } else {
    pass("audit mode (no CSS): soft-fail guidance present");
  }
}

// --- 5. Contrast math spot-check ---
{
  const turquoiseOnWhite = contrastRatio("#00B7BD", "#FFFFFF");
  if (Math.abs(turquoiseOnWhite - 2.47) > 0.1) {
    fail(
      `contrastRatio("#00B7BD", "#FFFFFF") expected ~2.47, got ${turquoiseOnWhite.toFixed(3)}`,
    );
  } else {
    pass(`contrastRatio turquoise-on-white = ${turquoiseOnWhite.toFixed(2)}:1`);
  }
  const navyOnWhite = contrastRatio("#1F3B90", "#FFFFFF");
  if (Math.abs(navyOnWhite - 10.06) > 0.2) {
    fail(`contrastRatio("#1F3B90", "#FFFFFF") expected ~10.06, got ${navyOnWhite.toFixed(3)}`);
  } else {
    pass(`contrastRatio navy-on-white = ${navyOnWhite.toFixed(2)}:1`);
  }
  // White on white should be 1:1 (edge case).
  const whiteOnWhite = contrastRatio("#FFFFFF", "#FFFFFF");
  if (Math.abs(whiteOnWhite - 1) > 0.001) {
    fail(`contrastRatio white-on-white expected 1, got ${whiteOnWhite.toFixed(3)}`);
  } else {
    pass("contrastRatio white-on-white = 1 (edge case)");
  }
}

// --- 6. parseTokensFromCss spot-check ---
{
  const parsed = parseTokensFromCss(cognitionCss);
  const byName = Object.fromEntries(parsed.map((t) => [t.name, t]));
  if (byName["--color-primary"]?.hex !== "#1f3b90") {
    fail(`parseTokensFromCss: --color-primary expected #1f3b90, got ${byName["--color-primary"]?.hex}`);
  } else {
    pass("parseTokensFromCss extracts --color-primary");
  }
  if (byName["--color-accent"]?.hex !== "#00b7bd") {
    fail(`parseTokensFromCss: --color-accent expected #00b7bd, got ${byName["--color-accent"]?.hex}`);
  } else {
    pass("parseTokensFromCss extracts --color-accent");
  }
  const darkSurface = parsed.find(
    (t) => t.name === "--color-surface" && t.scope?.includes("dark"),
  );
  if (!darkSurface) {
    fail("parseTokensFromCss: dark-scope --color-surface not captured");
  } else {
    pass("parseTokensFromCss captures scope for dark-mode overrides");
  }
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — audit mode + mandated-accent preservation + contrast math all wired.\n");
