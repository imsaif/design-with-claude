#!/usr/bin/env node
// Regression test for motion-designer audit mode (alpha.6).
//
// Covers:
//   1. Animations without prefers-reduced-motion → error
//   2. Reduced-motion block present → no reduced-motion error
//   3. Duration > 1000ms flagged
//   4. Duration < 80ms flagged as info
//   5. Normal durations → no flag
//   6. `transition: all` flagged
//   7. Named properties → no flag
//   8. Animating `top`/`width` flagged (layout thrash)
//   9. Animating `transform`/`opacity` → no flag
//  10. Infinite animation without reduced-motion → warn
//  11. Infinite animation with reduced-motion → info
//  12. Majority `linear` easing flagged
//  13. Mixed easing → no flag
//  14. Audit end-to-end (errors section + C3 directive)
//  15. Empty audit input → soft guidance
//  16. Generate mode regression

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { tools } = await import(resolve(repoRoot, "dist/tools/index.js"));
const { runMotionAudit } = await import(resolve(repoRoot, "dist/tools/motion.js"));

let failed = 0;
function pass(m) { process.stdout.write(`  ✔ ${m}\n`); }
function fail(m, extra) { failed++; process.stderr.write(`  ✘ ${m}\n`); if (extra) process.stderr.write(`    ${extra}\n`); }

const tool = tools.find((t) => t.name === "motion-designer");
if (!tool) { fail("motion-designer tool not exported"); process.exit(1); }

// --- 1. No reduced-motion guard ---
{
  const css = `.button { transition: transform 200ms ease-out; }`;
  const findings = runMotionAudit(css);
  if (!findings.some((f) => f.severity === "error" && /prefers-reduced-motion/i.test(f.message))) fail("reduced-motion: missing guard not flagged as error");
  else pass("reduced-motion: missing guard flagged");
}

// --- 2. Reduced-motion present ---
{
  const css = `.button { transition: transform 200ms ease-out; }
    @media (prefers-reduced-motion: reduce) { .button { transition: none; } }`;
  const findings = runMotionAudit(css);
  if (findings.some((f) => f.severity === "error" && /prefers-reduced-motion/i.test(f.message))) fail("reduced-motion: false positive when guard present");
  else pass("reduced-motion: guard present, no error");
}

// --- 3. Over-long duration ---
{
  const css = `.a { transition: opacity 1500ms ease-in; }
    @media (prefers-reduced-motion: reduce) { .a { transition: none; } }`;
  const findings = runMotionAudit(css);
  if (!findings.some((f) => /longer than 1000ms/i.test(f.message))) fail("duration: >1000ms not flagged");
  else pass("duration: >1000ms flagged");
}

// --- 4. Too-short duration ---
{
  const css = `.a { transition: opacity 50ms linear; }
    @media (prefers-reduced-motion: reduce) { .a { transition: none; } }`;
  const findings = runMotionAudit(css);
  if (!findings.some((f) => /under 80ms/i.test(f.message))) fail("duration: <80ms not flagged");
  else pass("duration: <80ms flagged");
}

// --- 5. Normal durations ---
{
  const css = `.a { transition: opacity 200ms ease-out; }
    @media (prefers-reduced-motion: reduce) { .a { transition: none; } }`;
  const findings = runMotionAudit(css);
  if (findings.some((f) => /longer than 1000ms|under 80ms/i.test(f.message))) fail("duration: false positive on 200ms");
  else pass("duration: normal, no flag");
}

// --- 6. transition: all ---
{
  const css = `.a { transition: all 200ms ease; }
    @media (prefers-reduced-motion: reduce) { .a { transition: none; } }`;
  const findings = runMotionAudit(css);
  if (!findings.some((f) => /transition: all/i.test(f.message))) fail("transition-all: not flagged");
  else pass("transition-all: flagged");
}

// --- 7. Named properties ---
{
  const css = `.a { transition: transform 200ms ease, opacity 200ms ease; }
    @media (prefers-reduced-motion: reduce) { .a { transition: none; } }`;
  const findings = runMotionAudit(css);
  if (findings.some((f) => /transition: all/i.test(f.message))) fail("transition-all: false positive");
  else pass("transition-all: named, no flag");
}

// --- 8. Layout properties ---
{
  const css = `.a { transition: width 200ms ease; }
    @media (prefers-reduced-motion: reduce) { .a { transition: none; } }`;
  const findings = runMotionAudit(css);
  if (!findings.some((f) => /layout properties|reflow/i.test(f.message))) fail("expensive-props: width not flagged");
  else pass("expensive-props: width flagged");
}

// --- 9. GPU-friendly properties ---
{
  const css = `.a { transition: transform 200ms ease, opacity 200ms ease; }
    @media (prefers-reduced-motion: reduce) { .a { transition: none; } }`;
  const findings = runMotionAudit(css);
  if (findings.some((f) => /layout properties|reflow/i.test(f.message))) fail("expensive-props: false positive on transform/opacity");
  else pass("expensive-props: transform/opacity, no flag");
}

// --- 10. Infinite, no guard ---
{
  const css = `.spinner { animation: spin 1s linear infinite; }`;
  const findings = runMotionAudit(css);
  const infFinding = findings.find((f) => /infinite animation/i.test(f.message));
  if (!infFinding || infFinding.severity !== "warn") fail("infinite: without guard not flagged as warn");
  else pass("infinite: without guard, warn");
}

// --- 11. Infinite with guard ---
{
  const css = `.spinner { animation: spin 1s linear infinite; }
    @media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }`;
  const findings = runMotionAudit(css);
  const infFinding = findings.find((f) => /infinite animation/i.test(f.message));
  if (!infFinding || infFinding.severity !== "info") fail("infinite: with guard should be info");
  else pass("infinite: with guard, info");
}

// --- 12. Majority linear ---
{
  const css = `
    .a { transition: opacity 200ms linear; }
    .b { transition: transform 200ms linear; }
    .c { transition: color 200ms linear; }
    @media (prefers-reduced-motion: reduce) { .a,.b,.c { transition: none; } }
  `;
  const findings = runMotionAudit(css);
  if (!findings.some((f) => /linear/i.test(f.message) && /mechanical|easing/i.test(f.message))) fail("easing: majority linear not flagged");
  else pass("easing: majority linear flagged");
}

// --- 13. Mixed easing ---
{
  const css = `
    .a { transition: opacity 200ms ease-out; }
    .b { transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1); }
    .c { transition: color 200ms linear; }
    @media (prefers-reduced-motion: reduce) { .a,.b,.c { transition: none; } }
  `;
  const findings = runMotionAudit(css);
  if (findings.some((f) => /mechanical/i.test(f.message))) fail("easing: false positive on mixed easing");
  else pass("easing: mixed, no flag");
}

// --- 14. Audit end-to-end ---
{
  const result = await tool.handler({
    brief: "Audit motion for our app. Need vestibular safety + performance on low-end Android.",
    mode: "audit",
    existingCss: `
      .card { transition: all 1200ms linear; }
      .modal { animation: slide 400ms ease-out; }
      .spinner { animation: spin 1s linear infinite; }
    `,
  });
  const text = result.text;
  if (!/Errors \(accessibility/.test(text)) fail("audit: errors section missing");
  else pass("audit: errors section rendered");
  if (!/prefers-reduced-motion/i.test(text)) fail("audit: reduced-motion finding missing");
  else pass("audit: reduced-motion finding in prompt");
  if (!text.includes("Explicit asks from the brief")) fail("audit: C3 directive lost");
  else pass("audit: C3 directive applies");
}

// --- 15. Empty audit input ---
{
  const result = await tool.handler({
    brief: "Audit my motion.",
    mode: "audit",
  });
  if (!/was empty.*Paste the CSS/i.test(result.text)) fail("audit (empty): soft guidance missing");
  else pass("audit (empty): soft guidance present");
}

// --- 16. Generate mode regression ---
{
  const result = await tool.handler({
    brief: "Native-feel motion for our mobile web app. Keep it under 300ms everywhere.",
  });
  if (!result.text.includes("Explicit asks from the brief")) fail("generate: C3 directive lost");
  else pass("generate: C3 directive applies");
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — motion-designer audit wired.\n");
