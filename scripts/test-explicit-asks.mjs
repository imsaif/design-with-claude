#!/usr/bin/env node
// Fixture-based regression test for C3 (explicit-ask directive).
// Invokes each specialist's handler with a brief containing explicit asks
// and asserts the composed prompt wires the directive correctly.
//
// This test checks plumbing, not LLM behavior. Efficacy ("does Claude actually
// lead with the explicit ask?") is verified by re-running the Cognition replay
// manually after this passes. Run with `npm run test:explicit-asks`.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { tools } = await import(resolve(repoRoot, "dist/tools/index.js"));

let failed = 0;
function pass(msg) {
  process.stdout.write(`  ✔ ${msg}\n`);
}
function fail(msg, extra) {
  failed++;
  process.stderr.write(`  ✘ ${msg}\n`);
  if (extra) process.stderr.write(`    ${extra}\n`);
}

// Briefs loaded with explicit asks of each kind the directive names:
// questions, imperatives, numeric constraints, named constraints, existing-state refs.
const fixtures = {
  "color-specialist": {
    brief:
      "Cognition chat UI. NewGlobe brand mandates navy #1F3B90 + turquoise #00B7BD. " +
      "Flag any accessibility issues with the mandated palette — especially turquoise " +
      "on white, which I suspect may fail contrast. WCAG AA minimum, AAA where feasible.",
    accent: "#1F3B90",
  },
  "typography-specialist": {
    brief:
      "Arial-only (mandated), editorial tone. Base 15px, ratio 1.2, avoid 700/800 weights. " +
      "No display size — utility product, no hero. Body measure capped at 68ch.",
    baseSizePx: 15,
  },
  "spacing-specialist": {
    brief:
      "Chat interface, 260px sidebar + main content. Tailwind CSS v4 compatible (4px base). " +
      "Prose measure 68ch. Desktop-first with mobile drawer. Generous density.",
    baseUnitPx: 4,
  },
  "design-system-architect": {
    brief:
      "Cognition — audit the existing 60+ CSS variables in themes.css with light/dark overrides. " +
      "Semantic naming in use. Want your take on soundness + gaps. Framework output: css-vars.",
  },
  "design-brief": {
    brief:
      "NewGlobe Cognition AI chat. Two modes (Lite/Pro). Existing design system aligned to " +
      "brand manual. Audience makes policy decisions. Tell me which specialists to run and why.",
  },
  "setup-guide": {
    goal:
      "Fastest path to a Next.js 15 + Tailwind v4 project with Claude Code installed. " +
      "I'm a designer, not a developer — no jargon please. What do I install first?",
    platform: "mac",
  },
  "debug-helper": {
    error: "Error: Cannot find module 'tailwindcss/preflight' in Next.js 15 App Router",
    context:
      "Tailwind theme tokens work in dev but not in production. Especially check " +
      "whether v4's @theme directive is being stripped by the build.",
    stack: "Next.js 15 on Vercel, Tailwind v4",
  },
};

// Briefs where the "brief fragment" check uses a different field than `brief`.
const briefFieldByTool = {
  "setup-guide": "goal",
  "debug-helper": "error",
};

// The exact markers the directive contributes to the composed prompt.
// If composeRolePrompt or the directive text changes, update these.
const DIRECTIVE_HEADING = "Before you respond — explicit asks come first";
const RESPONSE_HEADING = "Explicit asks from the brief";
const WHAT_NEXT_FOOTER = "What to do next";

for (const tool of tools) {
  if (tool.name === "hello-world") continue; // ping tool — directive not expected
  const fixture = fixtures[tool.name];
  if (!fixture) {
    fail(`no fixture defined for ${tool.name}`);
    continue;
  }

  let result;
  try {
    result = await tool.handler(fixture);
  } catch (err) {
    fail(`${tool.name} handler threw`, String(err?.message ?? err));
    continue;
  }

  const text = result?.text ?? "";

  if (!text.includes(DIRECTIVE_HEADING)) {
    fail(`${tool.name}: directive heading missing`);
    continue;
  }
  if (!text.includes(RESPONSE_HEADING)) {
    fail(`${tool.name}: response-shape instruction missing`);
    continue;
  }

  // Positional check: directive must appear before the "What to do next" footer
  // so the LLM reads it while building its response, not after.
  const dirIdx = text.indexOf(DIRECTIVE_HEADING);
  const footerIdx = text.indexOf(WHAT_NEXT_FOOTER);
  if (footerIdx !== -1 && dirIdx > footerIdx) {
    fail(`${tool.name}: directive appears after footer (position ${dirIdx} vs ${footerIdx})`);
    continue;
  }

  // Sanity: the brief (or tool-specific primary input) should be restated.
  const briefField = briefFieldByTool[tool.name] ?? "brief";
  const briefFragment = String(fixture[briefField]).slice(0, 40);
  if (!text.includes(briefFragment)) {
    fail(`${tool.name}: ${briefField} not restated in composed prompt`);
    continue;
  }

  pass(`${tool.name}: directive + response-shape present and positioned correctly`);
}

// Cognition-specific fixture — the loud failure case from field notes.
// color-specialist with the turquoise ask: directive must specifically survive
// and the brief's "especially turquoise on white" clause must reach the prompt.
{
  const colorTool = tools.find((t) => t.name === "color-specialist");
  const result = await colorTool.handler(fixtures["color-specialist"]);
  const text = result.text;
  if (!text.includes("turquoise on white")) {
    fail("Cognition replay: turquoise-on-white ask missing from composed prompt");
  } else {
    pass("Cognition replay: turquoise-on-white ask survives into composed prompt");
  }
  if (!text.includes("WCAG AA")) {
    fail("Cognition replay: WCAG AA constraint missing from composed prompt");
  } else {
    pass("Cognition replay: WCAG AA constraint survives into composed prompt");
  }
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — explicit-ask directive wired across all specialists.\n");
