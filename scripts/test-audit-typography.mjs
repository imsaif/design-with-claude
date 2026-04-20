#!/usr/bin/env node
// Regression test for typography-specialist audit mode (C2 rollout).
//
// Covers:
//   1. Audit mode parses --font-size-*, --line-height-*, --font-weight-* tokens
//   2. Sub-12px clamp minimums are flagged as errors
//   3. Body line-height outside 1.4–1.8 is flagged
//   4. Heading line-height > 1.3 is flagged
//   5. Non-standard weight values are flagged
//   6. Missing roles (h1, body, etc.) surface as structural gaps
//   7. Mandated font check: flags drift when named font is absent from CSS
//   8. Audit mode does NOT emit a fresh seed scale
//   9. Audit mode with no existingTypeScale returns a soft-fail, not a seed
//  10. Generate mode still works (regression guard)
//
// Run with `npm run test:audit-typography`.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { tools } = await import(resolve(repoRoot, "dist/tools/index.js"));
const { parseTypeTokensFromCss, minPxFromSizeValue } = await import(
  resolve(repoRoot, "dist/tools/typography.js")
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

const typoTool = tools.find((t) => t.name === "typography-specialist");
if (!typoTool) {
  fail("typography-specialist tool not exported");
  process.exit(1);
}

// A deliberately flawed type scale — planted issues:
//   --font-size-caption clamp min 10px (below floor)
//   --line-height-body = 1.2 (too tight)
//   --line-height-h1 = 1.6 (too loose for heading)
//   --font-weight-display = 850 (non-standard)
//   no h2, no body-sm in sizes
const flawedCss = `
:root {
  --font-family-sans: "Satoshi", system-ui;
  --font-size-display: clamp(2.5rem, 2rem + 3vw, 4rem);
  --font-size-h1: clamp(2rem, 1.5rem + 2vw, 3rem);
  --font-size-body: clamp(1rem, 0.95rem + 0.2vw, 1.125rem);
  --font-size-caption: clamp(0.625rem, 0.55rem + 0.2vw, 0.75rem);
  --line-height-body: 1.2;
  --line-height-h1: 1.6;
  --font-weight-display: 850;
  --font-weight-body: 400;
}
`;

// --- 1. Parser spot-check ---
{
  const parsed = parseTypeTokensFromCss(flawedCss);
  const kinds = parsed.reduce((acc, t) => {
    acc[t.kind] = (acc[t.kind] ?? 0) + 1;
    return acc;
  }, {});
  if ((kinds.size ?? 0) < 3) {
    fail(`parser: expected ≥3 size tokens, got ${kinds.size ?? 0}`);
  } else {
    pass(`parser: extracted ${kinds.size} size tokens`);
  }
  if (!kinds.lineHeight) fail("parser: no line-height tokens captured");
  else pass(`parser: extracted ${kinds.lineHeight} line-height tokens`);
  if (!kinds.weight) fail("parser: no weight tokens captured");
  else pass(`parser: extracted ${kinds.weight} weight tokens`);
  if (!kinds.family) fail("parser: no family tokens captured");
  else pass(`parser: extracted ${kinds.family} family tokens`);
}

// --- 2. minPxFromSizeValue ---
{
  const min = minPxFromSizeValue("clamp(0.625rem, 0.55rem + 0.2vw, 0.75rem)");
  if (Math.abs(min - 10) > 0.01) {
    fail(`minPxFromSizeValue clamp: expected 10, got ${min}`);
  } else {
    pass("minPxFromSizeValue reads 10px from 0.625rem clamp min");
  }
  const px = minPxFromSizeValue("14px");
  if (Math.abs(px - 14) > 0.01) fail(`minPxFromSizeValue plain px: expected 14, got ${px}`);
  else pass("minPxFromSizeValue reads plain 14px");
}

// --- 3. Audit mode end-to-end with flawed CSS ---
{
  const result = await typoTool.handler({
    brief: "Audit our existing type scale. Flag legibility issues, especially for small copy.",
    mode: "audit",
    existingTypeScale: flawedCss,
    mandatedFontFamily: "Satoshi",
  });
  const text = result.text;

  if (!text.toLowerCase().includes("audit")) {
    fail("audit mode: composed prompt doesn't indicate audit mode");
  } else {
    pass("audit mode: composed prompt flagged as audit");
  }

  // Parsed tokens should populate output, not a fresh seed
  const scale = result.output.data.scale;
  const hasSeedRoles = scale.some((s) => ["body-lg", "body-sm"].includes(s.role));
  if (hasSeedRoles) {
    fail("audit mode: output contains fresh seed roles (should only echo parsed sizes)");
  } else {
    pass("audit mode: no fresh seed scale emitted");
  }

  // Sub-12px minimum on caption
  if (!/font-size-caption.*(below the 12px floor|10\.\d+px|10px)/is.test(text)) {
    fail("audit mode: --font-size-caption 10px min not flagged as below floor");
  } else {
    pass("audit mode: sub-12px minimum flagged");
  }

  // Body line-height too tight
  if (!/line-height-body.*(1\.2).*(1\.4|body range)/is.test(text)) {
    fail("audit mode: body line-height 1.2 not flagged as tight");
  } else {
    pass("audit mode: tight body line-height flagged");
  }

  // Heading line-height too loose
  if (!/line-height-h1.*(1\.6).*(1\.3|loose|heading)/is.test(text)) {
    fail("audit mode: heading line-height 1.6 not flagged as loose");
  } else {
    pass("audit mode: loose heading line-height flagged");
  }

  // Non-standard weight
  if (!/font-weight-display.*(850)/is.test(text)) {
    fail("audit mode: non-standard weight 850 not flagged");
  } else {
    pass("audit mode: non-standard weight 850 flagged");
  }

  // Structural gap: no h2
  if (!/Structural gaps/.test(text)) {
    fail("audit mode: structural-gaps section missing");
  } else if (!/h2/i.test(text.split("Structural gaps")[1] ?? "")) {
    fail("audit mode: missing-h2 gap not reported");
  } else {
    pass("audit mode: missing-h2 gap reported");
  }

  // Mandated font check — Satoshi IS in the CSS
  if (!/Mandated font check/.test(text)) {
    fail("audit mode: mandated-font-check section missing");
  } else if (!/Satoshi/.test(text)) {
    fail("audit mode: mandated font name not referenced in output");
  } else {
    pass("audit mode: mandated-font check present and references Satoshi");
  }

  // Explicit-ask directive still applies (C3 regression guard)
  if (!text.includes("Explicit asks from the brief")) {
    fail("audit mode: C3 explicit-ask directive lost");
  } else {
    pass("audit mode: C3 explicit-ask directive still applies");
  }
}

// --- 4. Mandated-font drift ---
{
  const driftCss = `:root { --font-size-body: 1rem; }`;
  const result = await typoTool.handler({
    brief: "Audit the scale.",
    mode: "audit",
    existingTypeScale: driftCss,
    mandatedFontFamily: "Satoshi",
  });
  if (!/NOT referenced anywhere|not referenced anywhere/i.test(result.text)) {
    fail("mandated-font drift: missing font not flagged");
  } else {
    pass("mandated-font drift: missing font flagged");
  }
}

// --- 5. Audit mode with no CSS → soft-fail ---
{
  const result = await typoTool.handler({
    brief: "Audit my type scale.",
    mode: "audit",
  });
  const scale = result.output.data.scale;
  if (scale.length !== 0) {
    fail("audit mode (no CSS): expected empty scale, got tokens");
  } else {
    pass("audit mode (no CSS): empty scale returned");
  }
  if (!/cannot audit what it cannot see|no `existingTypeScale`/i.test(result.text)) {
    fail("audit mode (no CSS): soft-fail guidance not in composed prompt");
  } else {
    pass("audit mode (no CSS): soft-fail guidance present");
  }
}

// --- 6. Generate mode regression guard ---
{
  const result = await typoTool.handler({
    brief: "Editorial marketing site, generous and warm.",
  });
  const scale = result.output.data.scale;
  if (scale.length < 8) {
    fail(`generate mode: expected ≥8 scale steps, got ${scale.length}`);
  } else {
    pass(`generate mode: ${scale.length} scale steps`);
  }
  if (!scale.some((s) => /clamp\(/.test(s.clamp))) {
    fail("generate mode: no clamp() values in scale");
  } else {
    pass("generate mode: clamp() values present");
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
process.stdout.write("\nALL GOOD — typography audit mode wired.\n");
