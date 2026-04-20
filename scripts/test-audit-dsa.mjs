#!/usr/bin/env node
// Regression test for design-system-architect audit mode (C2 rollout).
//
// Covers:
//   1. Parser extracts ALL --* custom properties (not just color/font/space)
//   2. Primitive vs semantic layering detected
//   3. Dark-mode theming scope detected
//   4. Naming-consistency inconsistencies surface (mixed prefixes)
//   5. Broken var() references surface
//   6. Single-layer systems get a "promote a semantic layer" finding
//   7. Audit mode does NOT emit a fresh architecture doc
//   8. Audit mode with no existingSystem returns a soft-fail
//   9. Generate mode still works (regression guard)
//
// Run with `npm run test:audit-dsa`.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { tools } = await import(resolve(repoRoot, "dist/tools/index.js"));
const { parseAllCssCustomProperties, buildArchitectureAudit } = await import(
  resolve(repoRoot, "dist/tools/design-system.js")
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

const dsaTool = tools.find((t) => t.name === "design-system-architect");
if (!dsaTool) {
  fail("design-system-architect tool not exported");
  process.exit(1);
}

// Two-layer system WITH intentional problems:
//   - broken var() ref: --color-link references --color-missing
//   - mixed --space-* and --spacing-* prefixes
//   - has dark scope with only 1 token override
const flawedCss = `
:root {
  --color-blue-500: #2563eb;
  --color-neutral-900: #0a0a0a;
  --color-neutral-50: #fafafa;
  --color-text: var(--color-neutral-900);
  --color-surface: var(--color-neutral-50);
  --color-link: var(--color-missing);
  --space-1: 4px;
  --space-2: 8px;
  --spacing-md: 16px;
  --font-family-sans: "Inter", sans-serif;
}
html[data-theme="dark"] {
  --color-text: var(--color-neutral-50);
}
`;

// Single-layer, primitive-only system for comparison
const primitiveOnlyCss = `
:root {
  --color-primary: #1F3B90;
  --color-text: #231F20;
  --space-sm: 8px;
  --space-md: 16px;
}
`;

// --- 1. Parser captures everything ---
{
  const parsed = parseAllCssCustomProperties(flawedCss);
  if (parsed.length < 10) {
    fail(`parser: expected ≥10 tokens, got ${parsed.length}`);
  } else {
    pass(`parser: extracted ${parsed.length} custom properties`);
  }
  const dark = parsed.find((t) => t.name === "--color-text" && t.scope);
  if (!dark) {
    fail("parser: dark-scope --color-text not captured");
  } else {
    pass(`parser: dark-scope captured (${dark.scope})`);
  }
}

// --- 2. Layering detection ---
{
  const audit = buildArchitectureAudit(flawedCss);
  if (audit.layering.semantic < 3) {
    fail(`layering: expected ≥3 semantic tokens, got ${audit.layering.semantic}`);
  } else {
    pass(`layering: ${audit.layering.semantic} semantic + ${audit.layering.primitive} primitive`);
  }
  if (!/two-layer/i.test(audit.layering.verdict)) {
    fail(`layering: expected "two-layer" verdict, got: ${audit.layering.verdict}`);
  } else {
    pass("layering: two-layer verdict");
  }
}

// --- 3. Dark-mode detection ---
{
  const audit = buildArchitectureAudit(flawedCss);
  if (!audit.theming.hasDarkScope) {
    fail("theming: dark scope not detected");
  } else {
    pass(`theming: dark scope detected (${audit.theming.darkSelectors.join(", ")})`);
  }
}

// --- 4. Naming inconsistencies ---
{
  const audit = buildArchitectureAudit(flawedCss);
  const hasMixed = audit.naming.inconsistencies.some((i) =>
    /space.*spacing|spacing.*space/i.test(i),
  );
  if (!hasMixed) {
    fail("naming: mixed --space-* / --spacing-* prefixes not flagged");
  } else {
    pass("naming: mixed space/spacing prefixes flagged");
  }
}

// --- 5. Broken var() reference ---
{
  const audit = buildArchitectureAudit(flawedCss);
  const broken = audit.mapping.brokenRefs;
  const hasMissingRef = broken.some(
    (b) => b.token === "--color-link" && b.ref === "--color-missing",
  );
  if (!hasMissingRef) {
    fail("mapping: broken ref --color-link → --color-missing not flagged");
  } else {
    pass("mapping: broken var() reference flagged");
  }
}

// --- 6. Primitive-only recommendation ---
{
  const audit = buildArchitectureAudit(primitiveOnlyCss);
  if (!/primitive-only/i.test(audit.layering.verdict)) {
    fail(`primitive-only: expected verdict mentioning "primitive-only", got: ${audit.layering.verdict}`);
  } else {
    pass("primitive-only: verdict surfaces the missing-semantic-layer finding");
  }
}

// --- 7. Audit mode end-to-end ---
{
  const result = await dsaTool.handler({
    brief: "Audit my design tokens. We need dark-mode support and a clean semantic layer.",
    mode: "audit",
    existingSystem: flawedCss,
  });
  const text = result.text;

  if (!text.toLowerCase().includes("audit")) {
    fail("audit mode: composed prompt not flagged as audit");
  } else {
    pass("audit mode: composed prompt flagged as audit");
  }

  // No fresh architecture (generate-mode output has "Brief:" in the data.content)
  const content = result.output.data.content;
  if (!/Layering|Theming strategy|Semantic/i.test(content)) {
    fail("audit mode: audit content not in output payload");
  } else {
    pass("audit mode: audit content in output payload");
  }

  // Generate-mode sentinel ("Brief:" exact) should NOT be the ONLY content
  if (/^\*\*Brief:\*\*/.test(content) && !/Layering|Theming/.test(content)) {
    fail("audit mode: output payload reverted to generate-mode content");
  } else {
    pass("audit mode: no fresh architecture doc emitted");
  }

  // Broken ref surfaces in composed prompt
  if (!/--color-link.*--color-missing/s.test(text)) {
    fail("audit mode: broken var() ref not surfaced in prompt");
  } else {
    pass("audit mode: broken var() ref surfaced in prompt");
  }

  // Explicit-ask directive
  if (!text.includes("Explicit asks from the brief")) {
    fail("audit mode: C3 explicit-ask directive lost");
  } else {
    pass("audit mode: C3 explicit-ask directive still applies");
  }
}

// --- 8. Audit mode with no CSS ---
{
  const result = await dsaTool.handler({
    brief: "Audit my system.",
    mode: "audit",
  });
  if (!/cannot audit what it cannot see|no `existingSystem`/i.test(result.text)) {
    fail("audit mode (no CSS): soft-fail guidance missing");
  } else {
    pass("audit mode (no CSS): soft-fail guidance present");
  }
}

// --- 9. Generate mode regression ---
{
  const result = await dsaTool.handler({
    brief: "We're building a fintech dashboard. Need dark mode from day one.",
    framework: "css-vars",
  });
  if (!result.text.includes("Explicit asks from the brief")) {
    fail("generate mode: C3 explicit-ask directive lost");
  } else {
    pass("generate mode: C3 explicit-ask directive still applies");
  }
  if (!result.output.data.content.includes("Brief:")) {
    fail("generate mode: brief not echoed in output content");
  } else {
    pass("generate mode: brief echoed in output content");
  }
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — design-system-architect audit mode wired.\n");
