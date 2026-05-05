#!/usr/bin/env node
// Regression test for accessibility-specialist audit mode (alpha.5).
//
// Covers:
//   1. Parser flags images without alt
//   2. Parser tolerates alt="" as decorative (info, not error)
//   3. Unlabeled form inputs surface as errors; labeled ones do not
//   4. Heading-level skips flagged
//   5. Anchors with href="#" flagged (should be buttons)
//   6. Buttons with no accessible name flagged
//   7. Missing <main> landmark flagged
//   8. Color-pair contrast computes correctly on a failing pair
//   9. Audit mode with empty input and no color pair → soft guidance
//  10. Generate mode produces a checklist prompt
//
// Run with `npm run test:audit-accessibility`.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { tools } = await import(resolve(repoRoot, "dist/tools/index.js"));
const { runA11yAudit } = await import(resolve(repoRoot, "dist/tools/accessibility.js"));

let failed = 0;
function pass(msg) {
  process.stdout.write(`  ✔ ${msg}\n`);
}
function fail(msg, extra) {
  failed++;
  process.stderr.write(`  ✘ ${msg}\n`);
  if (extra) process.stderr.write(`    ${extra}\n`);
}

const tool = tools.find((t) => t.name === "accessibility-specialist");
if (!tool) {
  fail("accessibility-specialist tool not exported");
  process.exit(1);
}

// --- 1. Images with/without alt ---
{
  const markup = `
    <img src="hero.png" />
    <img src="logo.svg" alt="" />
    <img src="avatar.png" alt="User avatar" />
  `;
  const findings = runA11yAudit(markup);
  const missingAlt = findings.filter(
    (f) => f.severity === "error" && /no alt attribute/.test(f.message),
  );
  if (missingAlt.length !== 1) {
    fail(`images: expected 1 missing-alt error, got ${missingAlt.length}`);
  } else {
    pass("images: exactly 1 missing-alt error");
  }
  const decorative = findings.filter(
    (f) => f.severity === "info" && /empty alt/.test(f.message),
  );
  if (decorative.length !== 1) {
    fail(`images: expected 1 decorative info, got ${decorative.length}`);
  } else {
    pass("images: empty-alt treated as decorative info");
  }
}

// --- 2. Form controls ---
{
  const markup = `
    <input type="email" id="email" />
    <label for="email">Email</label>
    <input type="text" />
    <label><input type="checkbox" /> Agree</label>
    <input type="hidden" name="csrf" value="x" />
    <input type="submit" value="Save" />
  `;
  const findings = runA11yAudit(markup);
  const unlabeled = findings.filter(
    (f) => f.severity === "error" && /no accessible label/.test(f.message),
  );
  // Only the bare <input type="text" /> should fail. hidden/submit excluded.
  // Wrapped checkbox is labeled. Email input has matching <label for>.
  if (unlabeled.length !== 1) {
    fail(`forms: expected 1 unlabeled input, got ${unlabeled.length}`);
  } else {
    pass("forms: exactly 1 unlabeled input flagged");
  }
}

// --- 3. Heading hierarchy ---
{
  const markup = `<h1>Title</h1><h3>Section</h3>`;
  const findings = runA11yAudit(markup);
  const skip = findings.filter((f) => /heading level skipped/.test(f.message));
  if (skip.length !== 1) {
    fail(`headings: expected 1 skip finding, got ${skip.length}`);
  } else {
    pass("headings: h1 → h3 skip flagged");
  }
}

// --- 4. Multiple h1 ---
{
  const markup = `<h1>One</h1><h1>Two</h1>`;
  const findings = runA11yAudit(markup);
  if (!findings.some((f) => /2 <h1>/.test(f.message))) {
    fail("headings: two h1s not flagged");
  } else {
    pass("headings: multiple h1 flagged");
  }
}

// --- 5. Anchors as buttons ---
{
  const markup = `<a href="#">Click</a><a href="/real">Real</a><a>No href</a>`;
  const findings = runA11yAudit(markup);
  const anchorAsButton = findings.filter((f) => /as a button/.test(f.message));
  const noHref = findings.filter((f) => /without href/.test(f.message));
  if (anchorAsButton.length !== 1) {
    fail(`anchors: expected 1 href="#" flag, got ${anchorAsButton.length}`);
  } else {
    pass("anchors: href=\"#\" flagged");
  }
  if (noHref.length !== 1) {
    fail(`anchors: expected 1 no-href flag, got ${noHref.length}`);
  } else {
    pass("anchors: missing href flagged");
  }
}

// --- 6. Buttons without names ---
{
  const markup = `<button></button><button>Save</button><button aria-label="Close">×</button>`;
  const findings = runA11yAudit(markup);
  const unnamed = findings.filter((f) => /unnamed button/.test(f.message));
  if (unnamed.length !== 1) {
    fail(`buttons: expected 1 unnamed button, got ${unnamed.length}`);
  } else {
    pass("buttons: unnamed button flagged");
  }
}

// --- 7. Landmarks ---
{
  const markup = `<div><a href="/">Home</a><a href="/about">About</a></div>`;
  const findings = runA11yAudit(markup);
  const noMain = findings.filter((f) => /no <main>/.test(f.message));
  const noNav = findings.filter((f) => /no <nav>/.test(f.message));
  if (noMain.length === 0) fail("landmarks: missing <main> not flagged");
  else pass("landmarks: missing <main> flagged");
  if (noNav.length === 0) fail("landmarks: missing <nav> not flagged around anchor list");
  else pass("landmarks: missing <nav> flagged");
}

// --- 8. Landmarks present = quiet ---
{
  const markup = `<main><h1>t</h1><a href="#main" class="skip">Skip to content</a></main><nav><a href="/">Home</a></nav>`;
  const findings = runA11yAudit(markup);
  if (findings.some((f) => /no <main>/.test(f.message))) {
    fail("landmarks: <main> false-positive");
  } else {
    pass("landmarks: <main> present = no flag");
  }
  if (findings.some((f) => /skip/.test(f.message))) {
    fail("landmarks: skip-link false-positive");
  } else {
    pass("landmarks: skip link detected");
  }
}

// --- 9. Audit mode end-to-end with markup ---
{
  const result = await tool.handler({
    brief: "Audit this signup component for screen-reader + keyboard issues.",
    mode: "audit",
    existingMarkup: `
      <form>
        <img src="brand.svg" />
        <input type="email" />
        <button></button>
      </form>
    `,
  });
  const text = result.text;
  if (!/Errors \(screen-reader breakers\)/.test(text)) {
    fail("audit: Errors section missing");
  } else {
    pass("audit: Errors section rendered");
  }
  if (!/no alt attribute/.test(text)) fail("audit: missing alt not in prompt");
  else pass("audit: missing alt surfaces in prompt");
  if (!/no accessible label/.test(text)) fail("audit: unlabeled input not in prompt");
  else pass("audit: unlabeled input surfaces in prompt");
  if (!/unnamed button/.test(text)) fail("audit: unnamed button not in prompt");
  else pass("audit: unnamed button surfaces in prompt");
  if (!text.includes("Explicit asks from the brief")) {
    fail("audit: C3 explicit-ask directive lost");
  } else {
    pass("audit: C3 explicit-ask directive still applies");
  }
}

// --- 10. Color-pair contrast check ---
{
  const result = await tool.handler({
    brief: "Is turquoise on white readable as body text?",
    mode: "audit",
    foreground: "#00B7BD",
    background: "#FFFFFF",
  });
  const text = result.text;
  if (!/Color-pair contrast/.test(text)) {
    fail("audit: color-contrast section missing");
  } else {
    pass("audit: color-contrast section rendered");
  }
  if (!/2\.4\d:1/.test(text)) {
    fail("audit: turquoise-on-white contrast ratio wrong in output");
  } else {
    pass("audit: turquoise-on-white ratio computed (~2.47:1)");
  }
  if (!/AA body ✗/.test(text)) {
    fail("audit: AA-body failing verdict not rendered");
  } else {
    pass("audit: AA body fail verdict rendered");
  }
}

// --- 11. Empty audit input → soft guidance ---
{
  const result = await tool.handler({
    brief: "Check my thing.",
    mode: "audit",
  });
  if (!/nothing mechanically parseable/i.test(result.text)) {
    fail("audit (empty): soft guidance missing");
  } else {
    pass("audit (empty): soft guidance present");
  }
}

// --- 12. Generate mode regression ---
{
  const result = await tool.handler({
    brief: "Payment form with inline errors and a stepper across 3 screens.",
  });
  if (!result.text.includes("Explicit asks from the brief")) {
    fail("generate: C3 explicit-ask directive lost");
  } else {
    pass("generate: C3 explicit-ask directive still applies");
  }
  if (!result.text.toLowerCase().includes("accessibility")) {
    fail("generate: role prompt not loaded");
  } else {
    pass("generate: role prompt loaded");
  }
}

// Autocomplete is only flagged on identity/payment fields.
{
  const noiseMarkup = `
    <input type="search" placeholder="Search patterns..." />
    <textarea placeholder="Type your message..."></textarea>
    <input type="range" min="6" max="23" />
    <input type="text" placeholder="Demo input" />
  `;
  const findings = runA11yAudit(noiseMarkup);
  const acFindings = findings.filter((f) => /autocomplete/.test(f.message));
  if (acFindings.length !== 0) {
    fail(`autocomplete should not fire on search/range/anonymous inputs, got ${acFindings.length}`);
  } else {
    pass("autocomplete suppressed on search/chat/range/anonymous inputs (noise gate)");
  }
}

{
  const identityMarkup = `
    <form>
      <label for="em">Email</label>
      <input id="em" type="email" name="email" />
      <label for="pw">Password</label>
      <input id="pw" type="password" name="password" />
    </form>
  `;
  const findings = runA11yAudit(identityMarkup);
  const acFindings = findings.filter((f) => /autocomplete/.test(f.message));
  if (acFindings.length !== 2) {
    fail(`autocomplete should fire on email + password identity fields, got ${acFindings.length}`);
  } else {
    pass("autocomplete still fires on identity fields with name=email/password");
  }
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — accessibility-specialist audit wired.\n");
