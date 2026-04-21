#!/usr/bin/env node
// Regression test for navigation-specialist audit mode (alpha.5).
//
// Covers:
//   1. Multiple <nav>s without aria-label flagged
//   2. Single labeled <nav> → no flag
//   3. Active class on link without aria-current flagged
//   4. aria-current present → no flag
//   5. Missing skip link flagged as info
//   6. Skip link present → no flag
//   7. Deep nesting (≥4 levels) flagged
//   8. Shallow nesting → no flag
//   9. Large nav without disclosure toggle flagged
//  10. Large nav with aria-expanded button → no flag
//  11. Audit mode ships findings through to composed prompt
//  12. Empty audit input → soft guidance
//  13. Generate mode regression

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { tools } = await import(resolve(repoRoot, "dist/tools/index.js"));
const { runNavAudit } = await import(resolve(repoRoot, "dist/tools/navigation.js"));

let failed = 0;
function pass(m) { process.stdout.write(`  ✔ ${m}\n`); }
function fail(m, extra) { failed++; process.stderr.write(`  ✘ ${m}\n`); if (extra) process.stderr.write(`    ${extra}\n`); }

const tool = tools.find((t) => t.name === "navigation-specialist");
if (!tool) { fail("navigation-specialist tool not exported"); process.exit(1); }

// --- 1. Multiple navs without labels ---
{
  const markup = `<nav><a href="/">Home</a></nav><nav><a href="/legal">Legal</a></nav>`;
  const findings = runNavAudit(markup);
  if (!findings.some((f) => /distinguishing labels|aria-label/i.test(f.message))) {
    fail("landmarks: multiple unlabeled navs not flagged");
  } else {
    pass("landmarks: multiple unlabeled navs flagged");
  }
}

// --- 2. Multiple navs with labels → quiet ---
{
  const markup = `
    <nav aria-label="Primary"><a href="/">Home</a></nav>
    <nav aria-label="Footer"><a href="/legal">Legal</a></nav>
  `;
  const findings = runNavAudit(markup);
  if (findings.some((f) => /distinguishing labels/i.test(f.message))) {
    fail("landmarks: false positive when navs are labeled");
  } else {
    pass("landmarks: labeled navs, no flag");
  }
}

// --- 3. Active class without aria-current ---
{
  const markup = `<nav><a href="/" class="active">Home</a><a href="/about">About</a></nav>`;
  const findings = runNavAudit(markup);
  if (!findings.some((f) => /aria-current/.test(f.message))) {
    fail("current-page: active class without aria-current not flagged");
  } else {
    pass("current-page: active-class-without-aria-current flagged");
  }
}

// --- 4. aria-current present → quiet ---
{
  const markup = `<nav><a href="/" aria-current="page" class="active">Home</a></nav>`;
  const findings = runNavAudit(markup);
  if (findings.some((f) => /aria-current/.test(f.message))) {
    fail("current-page: false positive when aria-current is present");
  } else {
    pass("current-page: aria-current present, no flag");
  }
}

// --- 5. Missing skip link ---
{
  const markup = `<nav><a href="/">Home</a></nav>`;
  const findings = runNavAudit(markup);
  if (!findings.some((f) => /skip/i.test(f.message))) {
    fail("skip link: missing not flagged");
  } else {
    pass("skip link: missing flagged");
  }
}

// --- 6. Skip link present ---
{
  const markup = `<a href="#main" class="skip">Skip to content</a><nav><a href="/">Home</a></nav>`;
  const findings = runNavAudit(markup);
  if (findings.some((f) => /skip/i.test(f.message))) {
    fail("skip link: false positive when skip link exists");
  } else {
    pass("skip link: present, no flag");
  }
}

// --- 7. Deep nesting ---
{
  const markup = `
    <nav>
      <ul><li>
        <ul><li>
          <ul><li>
            <ul><li><a href="/deep">Deep</a></li></ul>
          </li></ul>
        </li></ul>
      </li></ul>
    </nav>
  `;
  const findings = runNavAudit(markup);
  if (!findings.some((f) => /nesting is \d+ levels deep/.test(f.message))) {
    fail("nesting: 4-deep not flagged");
  } else {
    pass("nesting: 4-deep flagged");
  }
}

// --- 8. Shallow nesting quiet ---
{
  const markup = `<nav><ul><li><a href="/">Home</a></li><li><ul><li><a href="/a">A</a></li></ul></li></ul></nav>`;
  const findings = runNavAudit(markup);
  if (findings.some((f) => /nesting is/.test(f.message))) {
    fail("nesting: 2-deep false positive");
  } else {
    pass("nesting: 2-deep, no flag");
  }
}

// --- 9. Large nav no disclosure ---
{
  const markup = `<nav>${Array.from({ length: 7 }, (_, i) => `<a href="/p${i}">Link ${i}</a>`).join("")}</nav>`;
  const findings = runNavAudit(markup);
  if (!findings.some((f) => /disclosure toggle|aria-expanded|hamburger/i.test(f.message))) {
    fail("mobile: large nav without disclosure not flagged");
  } else {
    pass("mobile: large nav without disclosure flagged");
  }
}

// --- 10. Large nav with disclosure ---
{
  const markup = `
    <nav>
      <button aria-expanded="false" aria-label="Open menu">☰</button>
      ${Array.from({ length: 7 }, (_, i) => `<a href="/p${i}">Link ${i}</a>`).join("")}
    </nav>
  `;
  const findings = runNavAudit(markup);
  if (findings.some((f) => /disclosure toggle/i.test(f.message))) {
    fail("mobile: false positive when aria-expanded button exists");
  } else {
    pass("mobile: disclosure button detected, no flag");
  }
}

// --- 11. Audit end-to-end ---
{
  const result = await tool.handler({
    brief: "Audit the primary nav for keyboard + mobile wayfinding.",
    mode: "audit",
    existingMarkup: `
      <nav>
        <a href="/" class="active">Home</a>
        <a href="/pricing">Pricing</a>
        <a href="/docs">Docs</a>
        <a href="/blog">Blog</a>
        <a href="/careers">Careers</a>
        <a href="/login">Login</a>
      </nav>
    `,
  });
  const text = result.text;
  if (!/Warnings \(wayfinding/.test(text)) fail("audit: Warnings section missing");
  else pass("audit: Warnings section rendered");
  if (!/aria-current/.test(text)) fail("audit: aria-current finding missing");
  else pass("audit: aria-current finding in prompt");
  if (!text.includes("Explicit asks from the brief")) {
    fail("audit: C3 directive lost");
  } else {
    pass("audit: C3 directive applies");
  }
}

// --- 12. Empty audit input ---
{
  const result = await tool.handler({
    brief: "Audit my nav.",
    mode: "audit",
  });
  if (!/was empty.*Paste the nav/i.test(result.text)) {
    fail("audit (empty): soft guidance missing");
  } else {
    pass("audit (empty): soft guidance present");
  }
}

// --- 13. Generate mode regression ---
{
  const result = await tool.handler({
    brief: "Docs site nav: primary + sidebar + breadcrumbs, mobile drawer.",
  });
  if (!result.text.includes("Explicit asks from the brief")) {
    fail("generate: C3 directive lost");
  } else {
    pass("generate: C3 directive applies");
  }
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — navigation-specialist audit wired.\n");
