#!/usr/bin/env node
// Regression test for form-designer audit mode (alpha.5).
//
// Covers:
//   1. Inputs outside <form> flagged
//   2. Inputs without explicit type flagged as info
//   3. Star-label-without-required-attribute flagged
//   4. Password field without reveal toggle flagged as info
//   5. Orphaned error hints (not referenced via aria-describedby) flagged
//   6. Radio group not in <fieldset> flagged
//   7. Multiple submits without `name` flagged
//   8. Audit mode ships findings through to composed prompt
//   9. Empty audit input → soft guidance
//  10. Generate mode regression
//
// Run with `npm run test:audit-form-designer`.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { tools } = await import(resolve(repoRoot, "dist/tools/index.js"));
const { runFormAudit } = await import(resolve(repoRoot, "dist/tools/form.js"));

let failed = 0;
function pass(m) { process.stdout.write(`  ✔ ${m}\n`); }
function fail(m, extra) { failed++; process.stderr.write(`  ✘ ${m}\n`); if (extra) process.stderr.write(`    ${extra}\n`); }

const tool = tools.find((t) => t.name === "form-designer");
if (!tool) { fail("form-designer tool not exported"); process.exit(1); }

// --- 1. Inputs outside <form> ---
{
  const markup = `<input type="email" id="e" /><label for="e">E</label>`;
  const findings = runFormAudit(markup);
  if (!findings.some((f) => /outside any <form>/.test(f.message))) {
    fail("wrapper: inputs outside <form> not flagged");
  } else {
    pass("wrapper: inputs outside <form> flagged");
  }
}

// --- 2. Implicit input type ---
{
  const markup = `<form><input id="x" /><label for="x">X</label></form>`;
  const findings = runFormAudit(markup);
  const implicit = findings.filter((f) => /no explicit type/.test(f.message));
  if (implicit.length !== 1) {
    fail(`types: expected 1 implicit-type info, got ${implicit.length}`);
  } else {
    pass("types: implicit type flagged as info");
  }
}

// --- 3. Required markers ---
{
  const markup = `<form><label for="e">Email *</label><input type="email" id="e" /></form>`;
  const findings = runFormAudit(markup);
  if (!findings.some((f) => /asterisk.*no input has/i.test(f.message))) {
    fail("required: star-only marker not flagged");
  } else {
    pass("required: star-only marker flagged");
  }
}

// --- 4. Required present = quiet ---
{
  const markup = `<form><label for="e">Email *</label><input type="email" id="e" required /></form>`;
  const findings = runFormAudit(markup);
  if (findings.some((f) => /asterisk.*no input has/i.test(f.message))) {
    fail("required: false positive when `required` attribute is present");
  } else {
    pass("required: no false positive when attribute present");
  }
}

// --- 5. Password without reveal ---
{
  const markup = `<form><label for="p">Password</label><input type="password" id="p" /></form>`;
  const findings = runFormAudit(markup);
  if (!findings.some((f) => /reveal toggle/.test(f.message))) {
    fail("password: no reveal toggle not flagged");
  } else {
    pass("password: no-reveal-toggle flagged");
  }
}

// --- 6. Password WITH reveal → quiet ---
{
  const markup = `
    <form>
      <label for="p">Password</label>
      <input type="password" id="p" />
      <button type="button" aria-label="Show password">Show</button>
    </form>
  `;
  const findings = runFormAudit(markup);
  if (findings.some((f) => /reveal toggle/.test(f.message))) {
    fail("password: false positive when reveal button exists");
  } else {
    pass("password: reveal button detected, no flag");
  }
}

// --- 7. Orphaned error hints ---
{
  const markup = `
    <form>
      <label for="e">Email</label>
      <input type="email" id="e" />
      <span id="email-error">Invalid email</span>
    </form>
  `;
  const findings = runFormAudit(markup);
  if (!findings.some((f) => /aria-describedby/.test(f.message))) {
    fail("error wiring: orphaned hint not flagged");
  } else {
    pass("error wiring: orphaned hint flagged");
  }
}

// --- 8. Error hint correctly wired → quiet ---
{
  const markup = `
    <form>
      <label for="e">Email</label>
      <input type="email" id="e" aria-describedby="email-error" />
      <span id="email-error">Invalid email</span>
    </form>
  `;
  const findings = runFormAudit(markup);
  if (findings.some((f) => /aria-describedby/.test(f.message))) {
    fail("error wiring: false positive when aria-describedby is present");
  } else {
    pass("error wiring: describedby wired, no flag");
  }
}

// --- 9. Radio group without fieldset ---
{
  const markup = `
    <form>
      <input type="radio" name="color" value="red" id="r1" />
      <label for="r1">Red</label>
      <input type="radio" name="color" value="blue" id="r2" />
      <label for="r2">Blue</label>
    </form>
  `;
  const findings = runFormAudit(markup);
  if (!findings.some((f) => /fieldset/i.test(f.message))) {
    fail("fieldset: ungrouped radio group not flagged");
  } else {
    pass("fieldset: ungrouped radio group flagged");
  }
}

// --- 10. Radio group wrapped → quiet ---
{
  const markup = `
    <form>
      <fieldset>
        <legend>Color</legend>
        <input type="radio" name="color" value="red" id="r1" />
        <label for="r1">Red</label>
        <input type="radio" name="color" value="blue" id="r2" />
        <label for="r2">Blue</label>
      </fieldset>
    </form>
  `;
  const findings = runFormAudit(markup);
  if (findings.some((f) => /fieldset/i.test(f.message))) {
    fail("fieldset: false positive when radio group is wrapped");
  } else {
    pass("fieldset: wrapped radio group, no flag");
  }
}

// --- 11. Multiple submits without name ---
{
  const markup = `
    <form>
      <button type="submit">Save</button>
      <button type="submit">Save and continue</button>
    </form>
  `;
  const findings = runFormAudit(markup);
  if (!findings.some((f) => /submit/.test(f.message) && /name/.test(f.message))) {
    fail("submits: multiple submits without name not flagged");
  } else {
    pass("submits: multiple submits without name flagged");
  }
}

// --- 12. Multi-submit WITH name → quiet ---
{
  const markup = `
    <form>
      <button type="submit" name="action" value="save">Save</button>
      <button type="submit" name="action" value="save-continue">Save and continue</button>
    </form>
  `;
  const findings = runFormAudit(markup);
  if (findings.some((f) => /submit.*name/i.test(f.message))) {
    fail("submits: false positive when name attribute is present");
  } else {
    pass("submits: names present, no flag");
  }
}

// --- 13. Audit end-to-end ---
{
  const result = await tool.handler({
    brief: "Audit our login form for submit + a11y issues.",
    mode: "audit",
    existingMarkup: `
      <form>
        <label for="e">Email *</label>
        <input id="e" />
        <label for="p">Password</label>
        <input type="password" id="p" />
        <button></button>
      </form>
    `,
  });
  const text = result.text;
  if (!/Errors/.test(text)) fail("audit: Errors section missing");
  else pass("audit: Errors section rendered");
  if (!/asterisk/.test(text)) fail("audit: required marker finding missing");
  else pass("audit: required marker finding present");
  if (!text.includes("Explicit asks from the brief")) {
    fail("audit: C3 explicit-ask directive lost");
  } else {
    pass("audit: C3 explicit-ask directive still applies");
  }
}

// --- 14. Empty audit input ---
{
  const result = await tool.handler({
    brief: "Audit my form.",
    mode: "audit",
  });
  if (!/was empty.*Paste the form/i.test(result.text)) {
    fail("audit (empty): soft guidance missing");
  } else {
    pass("audit (empty): soft guidance present");
  }
}

// --- 15. Generate mode regression ---
{
  const result = await tool.handler({
    brief: "Checkout form: billing address, card details, promo code, 3-step stepper.",
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
process.stdout.write("\nALL GOOD — form-designer audit wired.\n");
