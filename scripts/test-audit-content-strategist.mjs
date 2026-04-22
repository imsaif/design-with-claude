#!/usr/bin/env node
// Regression test for content-strategist audit mode (alpha.6).
//
// Covers:
//   1. Weak CTA verb ("click here") flagged
//   2. Strong CTA ("Create account") → no flag
//   3. Long CTA (>6 words) flagged as info
//   4. Jargon hits flagged
//   5. Jargon-free copy → no flag
//   6. Passive voice flagged
//   7. Active voice → no flag
//   8. Over-long sentence flagged
//   9. Short sentences → no flag
//  10. ALL CAPS outside acronyms flagged
//  11. Acronyms only → no flag
//  12. Title Case headings flagged as info
//  13. Audit end-to-end (warnings section + C3 directive)
//  14. Empty audit input → soft guidance
//  15. Generate mode regression

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { tools } = await import(resolve(repoRoot, "dist/tools/index.js"));
const { runContentAudit } = await import(resolve(repoRoot, "dist/tools/content.js"));

let failed = 0;
function pass(m) { process.stdout.write(`  ✔ ${m}\n`); }
function fail(m, extra) { failed++; process.stderr.write(`  ✘ ${m}\n`); if (extra) process.stderr.write(`    ${extra}\n`); }

const tool = tools.find((t) => t.name === "content-strategist");
if (!tool) { fail("content-strategist tool not exported"); process.exit(1); }

// --- 1. Weak CTA ---
{
  const findings = runContentAudit(`<button>Click here</button>`);
  if (!findings.some((f) => /generic|Weak verbs/i.test(f.message))) fail("cta: 'Click here' not flagged");
  else pass("cta: weak verb flagged");
}

// --- 2. Strong CTA ---
{
  const findings = runContentAudit(`<button>Create account</button>`);
  if (findings.some((f) => /generic|Weak verbs/i.test(f.message))) fail("cta: false positive on strong CTA");
  else pass("cta: strong verb, no flag");
}

// --- 3. Long CTA ---
{
  const findings = runContentAudit(`<button>Click this button to create a new account now</button>`);
  if (!findings.some((f) => /\d+ words/.test(f.message))) fail("cta: long CTA not flagged for word count");
  else pass("cta: long CTA flagged");
}

// --- 4. Jargon ---
{
  const findings = runContentAudit(`We leverage cutting-edge synergies to empower your team.`);
  if (!findings.some((f) => /Jargon\/filler/i.test(f.message))) fail("jargon: not flagged");
  else pass("jargon: flagged");
}

// --- 5. Jargon-free ---
{
  const findings = runContentAudit(`Audit your design system in Claude Code. See what broke.`);
  if (findings.some((f) => /Jargon\/filler/i.test(f.message))) fail("jargon: false positive");
  else pass("jargon: clean copy, no flag");
}

// --- 6. Passive voice ---
{
  const findings = runContentAudit(`The palette was audited. The tokens are checked. Findings are reported.`);
  if (!findings.some((f) => /Passive voice/i.test(f.message))) fail("passive: not flagged");
  else pass("passive: flagged");
}

// --- 7. Active voice ---
{
  const findings = runContentAudit(`Claude audits your palette. The tool checks tokens. It reports findings.`);
  if (findings.some((f) => /Passive voice/i.test(f.message))) fail("passive: false positive on active voice");
  else pass("passive: active voice, no flag");
}

// --- 8. Long sentence ---
{
  const longText = `Our comprehensive design audit tool examines your entire codebase for accessibility issues, performance regressions, typography inconsistencies, color contrast failures, and a variety of other problems that typically plague modern design systems in production environments today.`;
  const findings = runContentAudit(longText);
  if (!findings.some((f) => /over 30 words/.test(f.message))) fail("sentence: over-long not flagged");
  else pass("sentence: over-long flagged");
}

// --- 9. Short sentences ---
{
  const findings = runContentAudit(`Short copy wins. Keep it tight. Ship it.`);
  if (findings.some((f) => /over 30 words/.test(f.message))) fail("sentence: false positive on short copy");
  else pass("sentence: short copy, no flag");
}

// --- 10. ALL CAPS ---
{
  const findings = runContentAudit(`URGENT: THIS OFFER EXPIRES SOON.`);
  if (!findings.some((f) => /all-caps/i.test(f.message))) fail("shouting: not flagged");
  else pass("shouting: flagged");
}

// --- 11. Acronyms only ---
{
  const findings = runContentAudit(`The API returns JSON over HTTPS. Check the WCAG rules.`);
  if (findings.some((f) => /all-caps/i.test(f.message))) fail("shouting: false positive on acronyms");
  else pass("shouting: acronyms only, no flag");
}

// --- 12. Title Case headings ---
{
  const markup = `<h1>Welcome To Our Platform</h1><h2>Get Started Today</h2><h2>Learn About Features</h2>`;
  const findings = runContentAudit(markup);
  if (!findings.some((f) => /Title Case/.test(f.message))) fail("heading case: Title Case not flagged");
  else pass("heading case: Title Case flagged");
}

// --- 13. Audit end-to-end ---
{
  const result = await tool.handler({
    brief: "Audit landing page copy. Voice should be direct, no jargon.",
    mode: "audit",
    existingCopy: `
      <h1>Revolutionary Design Audit Platform</h1>
      <p>We leverage cutting-edge AI to seamlessly empower your team with world-class insights that are delivered in real-time.</p>
      <button>Click here</button>
    `,
  });
  const text = result.text;
  if (!/Warnings \(clarity/.test(text)) fail("audit: warnings section missing");
  else pass("audit: warnings section rendered");
  if (!/Jargon\/filler/.test(text)) fail("audit: jargon finding missing");
  else pass("audit: jargon finding in prompt");
  if (!text.includes("Explicit asks from the brief")) fail("audit: C3 directive lost");
  else pass("audit: C3 directive applies");
}

// --- 14. Empty audit input ---
{
  const result = await tool.handler({
    brief: "Audit my copy.",
    mode: "audit",
  });
  if (!/was empty.*Paste the copy/i.test(result.text)) fail("audit (empty): soft guidance missing");
  else pass("audit (empty): soft guidance present");
}

// --- 15. Generate mode regression ---
{
  const result = await tool.handler({
    brief: "B2B SaaS landing page. Direct voice. Target audience: engineering leads.",
  });
  if (!result.text.includes("Explicit asks from the brief")) fail("generate: C3 directive lost");
  else pass("generate: C3 directive applies");
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — content-strategist audit wired.\n");
