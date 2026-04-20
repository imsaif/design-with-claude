#!/usr/bin/env node
// Regression test for spacing-specialist audit mode (C2 rollout).
//
// Covers:
//   1. Parser extracts --space-*, --spacing-*, --gap-* tokens and resolves to px
//   2. Base unit inference from parsed tokens (GCD-based)
//   3. Off-grid values flagged against inferred or designer-specified base
//   4. Oversized step jumps (>3×) flagged
//   5. Missing common steps (xs, sm, md, lg, xl) surface as gaps
//   6. Audit mode does NOT emit a fresh seed scale
//   7. Audit mode with no existingSpacingTokens returns a soft-fail
//   8. Generate mode still works (regression guard)
//
// Run with `npm run test:audit-spacing`.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { tools } = await import(resolve(repoRoot, "dist/tools/index.js"));
const { parseSpacingTokensFromCss, inferBaseUnit } = await import(
  resolve(repoRoot, "dist/tools/spacing.js")
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

const spacingTool = tools.find((t) => t.name === "spacing-specialist");
if (!spacingTool) {
  fail("spacing-specialist tool not exported");
  process.exit(1);
}

// Planted issues:
//   --space-weird = 7px (off-grid against 4px base)
//   --space-xl = 64px after --space-lg = 16px (4× jump)
//   No --space-md / --space-3 / --space-4
const flawedCss = `
:root {
  --space-0: 0;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-weird: 7px;
  --space-lg: 16px;
  --space-xl: 64px;
  --gap-default: 1rem;
}
`;

// --- 1. Parser ---
{
  const parsed = parseSpacingTokensFromCss(flawedCss);
  if (parsed.length < 6) {
    fail(`parser: expected ≥6 spacing tokens, got ${parsed.length}`);
  } else {
    pass(`parser: extracted ${parsed.length} spacing tokens`);
  }
  const gapToken = parsed.find((t) => t.name === "--gap-default");
  if (!gapToken) {
    fail("parser: --gap-default not captured");
  } else if (gapToken.px !== 16) {
    fail(`parser: --gap-default 1rem expected 16px, got ${gapToken.px}`);
  } else {
    pass("parser: 1rem → 16px conversion");
  }
  const zero = parsed.find((t) => t.name === "--space-0");
  if (!zero || zero.px !== 0) {
    fail(`parser: --space-0 expected 0, got ${zero?.px}`);
  } else {
    pass("parser: handles 0 without unit");
  }
}

// --- 2. Base unit inference ---
{
  // 4, 8, 16, 64 GCD = 4 (plus 7 which is an outlier breaking gcd to 1)
  // So we test with a clean ramp
  const clean = parseSpacingTokensFromCss(`
    :root {
      --space-xs: 4px;
      --space-sm: 8px;
      --space-md: 16px;
      --space-lg: 32px;
    }
  `);
  const base = inferBaseUnit(clean);
  if (base !== 4) {
    fail(`inferBaseUnit: expected 4, got ${base}`);
  } else {
    pass(`inferBaseUnit: resolved to ${base}`);
  }
}

// --- 3. Audit end-to-end ---
{
  const result = await spacingTool.handler({
    brief: "Audit my spacing scale. Dashboard UI, forms-heavy.",
    mode: "audit",
    baseUnitPx: 4,
    existingSpacingTokens: flawedCss,
  });
  const text = result.text;

  if (!text.toLowerCase().includes("audit")) {
    fail("audit mode: composed prompt not flagged as audit");
  } else {
    pass("audit mode: composed prompt flagged as audit");
  }

  const steps = result.output.data.steps;
  const hasSeedStep = steps.some((s) => s.name === "space-5" || s.name === "space-6");
  if (hasSeedStep) {
    fail("audit mode: output contains fresh seed step names");
  } else {
    pass("audit mode: no fresh seed steps emitted");
  }

  // Off-grid 7px flagged
  if (!/space-weird.*(7px|multiple of base)/is.test(text)) {
    fail("audit mode: --space-weird off-grid 7px not flagged");
  } else {
    pass("audit mode: off-grid 7px flagged");
  }

  // Big jump from lg (16px) to xl (64px) = 4×
  if (!/space-xl.*(4\.0x|jump|4×|4x)/i.test(text)) {
    fail("audit mode: 4× jump lg → xl not flagged");
  } else {
    pass("audit mode: oversized step jump flagged");
  }

  // Missing md
  if (!/Structural gaps/.test(text)) {
    fail("audit mode: structural-gaps section missing");
  } else if (!/md/.test(text.split("Structural gaps")[1] ?? "")) {
    fail("audit mode: missing-md gap not reported");
  } else {
    pass("audit mode: missing-md step flagged");
  }

  // Explicit-ask directive
  if (!text.includes("Explicit asks from the brief")) {
    fail("audit mode: C3 explicit-ask directive lost");
  } else {
    pass("audit mode: C3 explicit-ask directive still applies");
  }
}

// --- 4. Audit mode with no CSS ---
{
  const result = await spacingTool.handler({
    brief: "Audit my spacing.",
    mode: "audit",
  });
  const steps = result.output.data.steps;
  if (steps.length !== 0) {
    fail("audit mode (no CSS): expected empty steps, got some");
  } else {
    pass("audit mode (no CSS): empty steps returned");
  }
  if (!/cannot audit what it cannot see|no `existingSpacingTokens`/i.test(result.text)) {
    fail("audit mode (no CSS): soft-fail guidance missing");
  } else {
    pass("audit mode (no CSS): soft-fail guidance present");
  }
}

// --- 5. Generate mode regression ---
{
  const result = await spacingTool.handler({
    brief: "Marketing site, generous density.",
  });
  const steps = result.output.data.steps;
  if (steps.length < 10) {
    fail(`generate mode: expected ≥10 steps, got ${steps.length}`);
  } else {
    pass(`generate mode: ${steps.length} steps`);
  }
  if (!result.text.includes("Explicit asks from the brief")) {
    fail("generate mode: C3 explicit-ask directive lost");
  } else {
    pass("generate mode: C3 explicit-ask directive still applies");
  }
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — spacing audit mode wired.\n");
