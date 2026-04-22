#!/usr/bin/env node
// Regression test for C1 — design-next-step tool.
//
// Covers:
//   1. Tool exported
//   2. Handler composes a prompt that lists the specialist roster
//   3. Self-exclusion — design-next-step is not in the recommendation roster
//   4. hello-world + set-project-profile are not in the roster
//   5. Color-specialist IS in the roster
//   6. Profile context flows through when setDesignerProfile() is populated
//   7. Recent events context flows through when setRecentEventsSummary() is populated
//   8. Focus hint ends up in the composed prompt
//   9. C3 explicit-ask directive applies
//  10. Closing instruction survives

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { tools } = await import(resolve(repoRoot, "dist/tools/index.js"));
const {
  setDesignerProfile,
  setRecentEventsSummary,
  clearRecentEventsSummary,
} = await import(resolve(repoRoot, "dist/designer.js"));

let failed = 0;
function pass(m) { process.stdout.write(`  ✔ ${m}\n`); }
function fail(m, extra) { failed++; process.stderr.write(`  ✘ ${m}\n`); if (extra) process.stderr.write(`    ${extra}\n`); }

const tool = tools.find((t) => t.name === "design-next-step");
if (!tool) { fail("design-next-step tool not exported"); process.exit(1); }
else pass("design-next-step tool exported");

// --- 2. Handler composes prompt with roster ---
{
  setDesignerProfile(null);
  clearRecentEventsSummary();
  const result = await tool.handler({});
  const text = result.text;
  if (!/Available specialists/.test(text)) fail("roster: heading missing");
  else pass("roster: Available specialists heading present");
  if (!/`color-specialist`/.test(text)) fail("roster: color-specialist missing from roster");
  else pass("roster: color-specialist present");
  if (!/`typography-specialist`/.test(text)) fail("roster: typography-specialist missing");
  else pass("roster: typography-specialist present");
}

// --- 3, 4. Exclusions ---
{
  const result = await tool.handler({});
  const text = result.text;
  // Under "Available specialists", design-next-step must not appear as a roster item
  const rosterStart = text.indexOf("## Available specialists");
  const rosterEnd = text.indexOf("\n---", rosterStart);
  const rosterBody = rosterStart !== -1 ? text.slice(rosterStart, rosterEnd !== -1 ? rosterEnd : undefined) : "";
  if (/`design-next-step`/.test(rosterBody)) fail("roster: must exclude design-next-step itself");
  else pass("roster: self-excluded");
  if (/`hello-world`/.test(rosterBody)) fail("roster: must exclude hello-world");
  else pass("roster: hello-world excluded");
  if (/`set-project-profile`/.test(rosterBody)) fail("roster: must exclude set-project-profile");
  else pass("roster: set-project-profile excluded");
}

// --- 6. Profile context flows ---
{
  setDesignerProfile({
    status: "free",
    commandCount: 2,
    connected: true,
    onboarding: {
      product_type: "Design audit MCP",
      product_description: "audit-first design tool for Claude Code",
      tech_stack: ["Next.js 15", "Tailwind v4"],
      design_system: "Satoshi + navy primary",
      experience_level: "advanced",
      tone_preference: "concise",
    },
    claudeMd: "# project CLAUDE.md",
  });
  clearRecentEventsSummary();
  const result = await tool.handler({});
  if (!/Designer context/.test(result.text)) fail("profile: designer context section missing");
  else pass("profile: designer context present");
  if (!/Design audit MCP/.test(result.text)) fail("profile: product_type not injected");
  else pass("profile: product_type injected");
}

// --- 7. Events context flows ---
{
  setRecentEventsSummary([
    {
      toolName: "color-specialist",
      kind: "palette",
      summary: "(audit) 7 color tokens parsed; mandated #1F3B90 MISSING",
      timestamp: "2026-04-22T12:00:00Z",
    },
  ]);
  const result = await tool.handler({});
  if (!/Recent design decisions/.test(result.text)) fail("events: memory section missing");
  else pass("events: memory section present");
  if (!/mandated #1F3B90 MISSING/.test(result.text)) fail("events: gist not injected");
  else pass("events: rich gist injected");
}

// --- 8. Focus hint ---
{
  const result = await tool.handler({ focus: "accessibility" });
  if (!/Designer focus hint/.test(result.text)) fail("focus: heading missing");
  else pass("focus: hint heading present");
  if (!/\*\*accessibility\*\*/.test(result.text)) fail("focus: value not in prompt");
  else pass("focus: hint value injected");
}

// --- 9. C3 directive ---
{
  const result = await tool.handler({});
  if (!/Before you respond — explicit asks come first/.test(result.text)) {
    fail("directive: C3 explicit-ask directive missing");
  } else {
    pass("directive: C3 explicit-ask directive present");
  }
}

// --- 10. Closing instruction ---
{
  const result = await tool.handler({});
  if (!/Recommend exactly ONE specialist/.test(result.text)) {
    fail("closing: closing instruction lost");
  } else {
    pass("closing: closing instruction present");
  }
}

// cleanup
setDesignerProfile(null);
clearRecentEventsSummary();

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — design-next-step wired.\n");
