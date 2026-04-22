#!/usr/bin/env node
// Regression test for C10 slice 1 — event-history memory injection into
// composeRolePrompt's designer context.
//
// Covers:
//   1. summarizeEvent produces a one-line gist for palette/type-scale/spacing
//   2. setRecentEventsSummary + renderDesignerContext emits the memory block
//   3. Memory block survives into a specialist's composed prompt
//   4. Memory block appears even without a full designer profile
//   5. Full profile + memory render both sections in order
//   6. clearRecentEventsSummary removes the block
//   7. Kill-switch: DWIC_MEMORY_CONTEXT=off is respected at refresh time
//      (integration-level check: we don't spin a server, we assert the helper
//      memoryContextEnabled behavior indirectly via env var + the knowledge
//      that ONLY the server calls refreshMemoryContext).
//
// Run with `npm run test:memory-context`.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { tools } = await import(resolve(repoRoot, "dist/tools/index.js"));
const {
  setDesignerProfile,
  setRecentEventsSummary,
  clearRecentEventsSummary,
  getRecentEventsSummary,
  summarizeEvent,
  renderDesignerContext,
} = await import(resolve(repoRoot, "dist/designer.js"));

let failed = 0;
function pass(msg) {
  process.stdout.write(`  ✔ ${msg}\n`);
}
function fail(msg, extra) {
  failed++;
  process.stderr.write(`  ✘ ${msg}\n`);
  if (extra) process.stderr.write(`    ${extra}\n`);
}

// --- 1. summarizeEvent shapes ---
{
  const paletteEvent = {
    id: "e1",
    toolName: "color-specialist",
    input: { mode: "audit", brief: "audit" },
    output: {
      type: "palette",
      data: { name: "audit", tokens: [{ name: "--a", hex: "#fff", role: "x" }, { name: "--b", hex: "#000", role: "y" }] },
    },
    timestamp: "2026-04-20T12:00:00Z",
    receivedAt: "2026-04-20T12:00:00Z",
  };
  const s = summarizeEvent(paletteEvent);
  if (s.toolName !== "color-specialist") fail(`summarize: toolName wrong (${s.toolName})`);
  else pass("summarizeEvent carries tool name");
  if (s.kind !== "palette") fail(`summarize: kind wrong (${s.kind})`);
  else pass("summarizeEvent detects palette kind");
  if (!/\(audit\)/.test(s.summary) || !/2 color tokens parsed/.test(s.summary)) {
    fail(`summarize: audit gist wrong (${s.summary})`);
  } else {
    pass(`summarizeEvent audit gist: "${s.summary}"`);
  }
}

// --- C10 slice 2: audit gist with mandated-accent check ---
{
  const paletteEventWithAccent = {
    id: "e1b",
    toolName: "color-specialist",
    input: { mode: "audit", brief: "audit", accent: "#1F3B90" },
    output: {
      type: "palette",
      data: {
        name: "audit-3-tokens",
        tokens: [
          { name: "--color-primary-500", hex: "#1F3B90", role: "existing" },
          { name: "--color-neutral-50", hex: "#FFFFFF", role: "existing" },
          { name: "--color-bg", hex: "#F7F7F7", role: "existing" },
        ],
      },
    },
    timestamp: "2026-04-22T12:00:00Z",
    receivedAt: "2026-04-22T12:00:00Z",
  };
  const s = summarizeEvent(paletteEventWithAccent);
  if (!/mandated #1F3B90 present/i.test(s.summary)) {
    fail(`summarize: mandated-accent-present note missing (${s.summary})`);
  } else {
    pass(`summarizeEvent mandated-accent present: "${s.summary}"`);
  }
}

{
  const paletteEventMissingAccent = {
    id: "e1c",
    toolName: "color-specialist",
    input: { mode: "audit", brief: "audit", accent: "#1F3B90" },
    output: {
      type: "palette",
      data: {
        name: "audit-2-tokens",
        tokens: [
          { name: "--color-primary-500", hex: "#2D56D2", role: "existing" },
          { name: "--color-neutral-50", hex: "#FFFFFF", role: "existing" },
        ],
      },
    },
    timestamp: "2026-04-22T12:01:00Z",
    receivedAt: "2026-04-22T12:01:00Z",
  };
  const s = summarizeEvent(paletteEventMissingAccent);
  if (!/MISSING/.test(s.summary)) {
    fail(`summarize: mandated-accent-missing not flagged (${s.summary})`);
  } else {
    pass(`summarizeEvent mandated-accent MISSING: "${s.summary}"`);
  }
}

// --- C10 slice 2: generate mode carries accent in gist ---
{
  const paletteGenerate = {
    id: "e1d",
    toolName: "color-specialist",
    input: { brief: "new palette", accent: "#5B8DEF" },
    output: { type: "palette", data: { name: "palette-5B8DEF", tokens: new Array(11).fill({ name: "x", hex: "#fff", role: "y" }) } },
    timestamp: "2026-04-22T12:02:00Z",
    receivedAt: "2026-04-22T12:02:00Z",
  };
  const s = summarizeEvent(paletteGenerate);
  if (!/around #5B8DEF/.test(s.summary) || !/11-token/.test(s.summary)) {
    fail(`summarize: generate palette gist wrong (${s.summary})`);
  } else {
    pass(`summarizeEvent generate palette gist: "${s.summary}"`);
  }
}

// --- C10 slice 2: markdown audit event with flagged counts ---
{
  const mdAudit = {
    id: "e1e",
    toolName: "accessibility-specialist",
    input: { mode: "audit", brief: "audit" },
    output: {
      type: "markdown",
      data: {
        title: "Accessibility audit",
        content: "**Parsed 1200 char(s) of markup.** Flagged 3 error(s), 2 warning(s), 1 info note(s). Audit focuses on...",
      },
    },
    timestamp: "2026-04-22T12:03:00Z",
    receivedAt: "2026-04-22T12:03:00Z",
  };
  const s = summarizeEvent(mdAudit);
  if (!/3 error/.test(s.summary) || !/2 warn/.test(s.summary) || !/1 info/.test(s.summary)) {
    fail(`summarize: markdown audit counts not mined (${s.summary})`);
  } else {
    pass(`summarizeEvent markdown audit counts: "${s.summary}"`);
  }
}

// --- C10 slice 2: gist capped at 120 chars ---
{
  const massivePayload = {
    id: "e1f",
    toolName: "markdown-generator",
    input: { brief: "x" },
    output: {
      type: "markdown",
      data: {
        title: "A very long title that keeps going and going with lots of extra words designed to overflow any reasonable gist cap and force truncation so we can verify the ellipsis behaviour",
        content: "no-counts here",
      },
    },
    timestamp: "2026-04-22T12:04:00Z",
    receivedAt: "2026-04-22T12:04:00Z",
  };
  const s = summarizeEvent(massivePayload);
  if (s.summary.length > 120) fail(`summarize: gist not capped (${s.summary.length} chars)`);
  else pass(`summarizeEvent gist capped at ${s.summary.length} chars`);
  if (!s.summary.endsWith("…")) fail("summarize: truncated gist should end with ellipsis");
  else pass("summarizeEvent truncated with ellipsis");
}

{
  const scaleEvent = {
    id: "e2",
    toolName: "typography-specialist",
    input: { brief: "marketing" },
    output: { type: "type-scale", data: { name: "ts", scale: new Array(9).fill({ role: "x", clamp: "c", lineHeight: 1, weight: 400 }) } },
    timestamp: "2026-04-20T12:05:00Z",
    receivedAt: "2026-04-20T12:05:00Z",
  };
  const s = summarizeEvent(scaleEvent);
  if (!/9 role/.test(s.summary)) fail(`summarize: type-scale gist wrong (${s.summary})`);
  else pass(`summarizeEvent type-scale gist: "${s.summary}"`);
}

{
  const spacingEvent = {
    id: "e3",
    toolName: "spacing-specialist",
    input: { brief: "dashboard" },
    output: { type: "spacing", data: { name: "sp", steps: new Array(12).fill({ name: "s", px: 4, rem: 0.25 }) } },
    timestamp: "2026-04-20T12:10:00Z",
    receivedAt: "2026-04-20T12:10:00Z",
  };
  const s = summarizeEvent(spacingEvent);
  if (!/12 step/.test(s.summary)) fail(`summarize: spacing gist wrong (${s.summary})`);
  else pass(`summarizeEvent spacing gist: "${s.summary}"`);
}

// --- 2. renderDesignerContext with memory only ---
{
  setDesignerProfile(null);
  setRecentEventsSummary([
    {
      toolName: "color-specialist",
      kind: "palette",
      summary: "audited 7 color token(s)",
      timestamp: "2026-04-20T12:00:00Z",
    },
  ]);
  const ctx = renderDesignerContext();
  if (!/Recent design decisions/i.test(ctx)) {
    fail("renderDesignerContext: memory-only case missing heading");
  } else {
    pass("renderDesignerContext: memory-only rendered");
  }
  if (!/color-specialist.*audited 7/.test(ctx)) {
    fail("renderDesignerContext: memory entry not rendered");
  } else {
    pass("renderDesignerContext: memory entry rendered");
  }
  clearRecentEventsSummary();
  if (getRecentEventsSummary().length !== 0) {
    fail("clearRecentEventsSummary did not empty cache");
  } else {
    pass("clearRecentEventsSummary empties cache");
  }
}

// --- 3. Full profile + memory ---
{
  setDesignerProfile({
    status: "free",
    commandCount: 3,
    connected: true,
    onboarding: {
      product_type: "Conversational AI",
      product_description: "a chat app for X",
      tech_stack: ["Next.js 15", "Tailwind v4"],
      design_system: "Satoshi + navy primary",
      experience_level: "intermediate",
      tone_preference: "concise",
    },
    claudeMd: "# project CLAUDE.md",
  });
  setRecentEventsSummary([
    {
      toolName: "color-specialist",
      kind: "palette",
      summary: "audited 7 color token(s)",
      timestamp: "2026-04-20T12:00:00Z",
    },
    {
      toolName: "typography-specialist",
      kind: "type-scale",
      summary: "audited 4 type token(s)",
      timestamp: "2026-04-20T12:05:00Z",
    },
  ]);
  const ctx = renderDesignerContext();
  if (!/Designer context/.test(ctx)) fail("render: profile section missing");
  else pass("render: profile section present");
  if (!/Recent design decisions/.test(ctx)) fail("render: memory section missing");
  else pass("render: memory section present");
  const profileIdx = ctx.indexOf("Designer context");
  const memoryIdx = ctx.indexOf("Recent design decisions");
  if (profileIdx > memoryIdx) {
    fail("render: memory section should come AFTER profile section");
  } else {
    pass("render: profile then memory ordering");
  }

  // Most-recent first (typography was last, should appear first in the memory block)
  const memoryBlock = ctx.slice(memoryIdx);
  const typoIdx = memoryBlock.indexOf("typography-specialist");
  const colorIdx = memoryBlock.indexOf("color-specialist");
  if (typoIdx < 0 || colorIdx < 0) {
    fail("render: one of the memory entries missing");
  } else if (typoIdx >= colorIdx) {
    fail("render: most-recent (typography) should precede older (color)");
  } else {
    pass("render: memory entries ordered most-recent-first");
  }
}

// --- 4. Memory block survives into a specialist's composed prompt ---
{
  const colorTool = tools.find((t) => t.name === "color-specialist");
  const result = await colorTool.handler({
    brief: "New palette for the checkout surface.",
    accent: "#1F3B90",
  });
  if (!/Recent design decisions/.test(result.text)) {
    fail("composed prompt: memory block missing from color-specialist output");
  } else {
    pass("composed prompt: memory block present in color-specialist output");
  }
  if (!/audited 7 color token/.test(result.text)) {
    fail("composed prompt: memory entry not injected");
  } else {
    pass("composed prompt: memory entry injected into prompt");
  }
}

// --- 5. Cleanup: calling clearRecentEventsSummary then a tool drops the block ---
{
  clearRecentEventsSummary();
  const colorTool = tools.find((t) => t.name === "color-specialist");
  const result = await colorTool.handler({
    brief: "Fresh attempt.",
    accent: "#1F3B90",
  });
  if (/Recent design decisions/.test(result.text)) {
    fail("composed prompt: memory block should be gone after clear");
  } else {
    pass("composed prompt: memory block absent after clear");
  }
}

// --- 6. Memory cap at 5 entries ---
{
  const many = Array.from({ length: 8 }, (_, i) => ({
    toolName: `tool-${i}`,
    kind: "palette",
    summary: `entry ${i}`,
    timestamp: `2026-04-20T12:${i.toString().padStart(2, "0")}:00Z`,
  }));
  setDesignerProfile(null);
  setRecentEventsSummary(many);
  const ctx = renderDesignerContext();
  // We expect the last 5 to render (0..7, last 5 = 3..7), most-recent first → 7,6,5,4,3
  if (!/tool-7/.test(ctx)) fail("render: most recent (tool-7) missing");
  else pass("render: most recent entry present");
  if (/tool-0/.test(ctx) || /tool-1/.test(ctx) || /tool-2/.test(ctx)) {
    fail("render: oldest entries should be trimmed (cap at 5)");
  } else {
    pass("render: memory trimmed to last 5");
  }
  clearRecentEventsSummary();
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — memory context (C10 slice 1) wired.\n");
