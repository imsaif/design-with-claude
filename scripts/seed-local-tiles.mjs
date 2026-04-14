#!/usr/bin/env node
// Dev-only: post sample events to the local in-memory store so you can see
// what the companion tiles look like when filled, without installing the
// MCP server or wiring Supabase locally.
const TOKEN = process.argv[2];
const BASE = process.env.DWC_BASE ?? "http://localhost:3000";
if (!TOKEN || !TOKEN.startsWith("imr_")) {
  console.error("usage: node scripts/seed-local-tiles.mjs imr_yourLocalToken");
  process.exit(1);
}

const now = () => new Date().toISOString();

const events = [
  {
    toolName: "color-specialist",
    input: { brief: "calm productivity app" },
    output: {
      type: "palette",
      data: {
        name: "palette-5B8DEF",
        tokens: [
          { name: "--color-primary-50", hex: "#eef3fd", role: "primary 50" },
          { name: "--color-primary-100", hex: "#d6e2fa", role: "primary 100" },
          { name: "--color-primary-200", hex: "#b3c9f4", role: "primary 200" },
          { name: "--color-primary-300", hex: "#89aaed", role: "primary 300" },
          { name: "--color-primary-400", hex: "#6c92e8", role: "primary 400" },
          { name: "--color-primary-500", hex: "#5B8DEF", role: "primary base" },
          { name: "--color-primary-600", hex: "#4a76d4", role: "primary 600" },
          { name: "--color-primary-700", hex: "#395fb1", role: "primary 700" },
          { name: "--color-primary-800", hex: "#28448c", role: "primary 800" },
          { name: "--color-primary-900", hex: "#182d65", role: "primary 900" },
          { name: "--color-neutral-50", hex: "#fafafa", role: "neutral 50" },
          { name: "--color-neutral-100", hex: "#f2f2f3", role: "neutral 100" },
          { name: "--color-neutral-200", hex: "#e3e3e6", role: "neutral 200" },
          { name: "--color-neutral-300", hex: "#c9c9ce", role: "neutral 300" },
          { name: "--color-neutral-400", hex: "#a1a1a8", role: "neutral 400" },
          { name: "--color-neutral-500", hex: "#757580", role: "neutral base" },
          { name: "--color-neutral-600", hex: "#585862", role: "neutral 600" },
          { name: "--color-neutral-700", hex: "#3f3f47", role: "neutral 700" },
          { name: "--color-neutral-800", hex: "#27272d", role: "neutral 800" },
          { name: "--color-neutral-900", hex: "#17171a", role: "neutral 900" },
          { name: "--color-success", hex: "#2aa876", role: "success" },
          { name: "--color-warning", hex: "#e6a33c", role: "warning" },
          { name: "--color-danger", hex: "#d44343", role: "danger" },
          { name: "--color-info", hex: "#3e8ed0", role: "info" },
        ],
      },
    },
  },
  {
    toolName: "typography-specialist",
    input: { brief: "editorial but minimal", baseSizePx: 16 },
    output: {
      type: "type-scale",
      data: {
        name: "type-scale-16-1.25",
        scale: [
          { role: "display", clamp: "clamp(3.5rem, 3.5rem + 2vw, 4rem)", lineHeight: 1.05, weight: 700 },
          { role: "h1", clamp: "clamp(2.625rem, 2.625rem + 1.5vw, 3rem)", lineHeight: 1.1, weight: 700 },
          { role: "h2", clamp: "clamp(1.97rem, 1.97rem + 1.12vw, 2.25rem)", lineHeight: 1.15, weight: 600 },
          { role: "h3", clamp: "clamp(1.4rem, 1.4rem + 0.8vw, 1.6rem)", lineHeight: 1.2, weight: 600 },
          { role: "h4", clamp: "clamp(1.094rem, 1.094rem + 0.625vw, 1.25rem)", lineHeight: 1.3, weight: 600 },
          { role: "body-lg", clamp: "clamp(0.984rem, 0.984rem + 0.562vw, 1.125rem)", lineHeight: 1.5, weight: 400 },
          { role: "body", clamp: "clamp(0.875rem, 0.875rem + 0.5vw, 1rem)", lineHeight: 1.55, weight: 400 },
          { role: "body-sm", clamp: "clamp(0.766rem, 0.766rem + 0.438vw, 0.875rem)", lineHeight: 1.5, weight: 400 },
          { role: "caption", clamp: "clamp(0.656rem, 0.656rem + 0.375vw, 0.75rem)", lineHeight: 1.4, weight: 500 },
        ],
      },
    },
  },
  {
    toolName: "spacing-specialist",
    input: { brief: "compact dashboard density", baseUnitPx: 4 },
    output: {
      type: "spacing",
      data: {
        name: "spacing-4px",
        steps: [
          { name: "space-0", px: 0, rem: 0 },
          { name: "space-0.5", px: 2, rem: 0.125 },
          { name: "space-1", px: 4, rem: 0.25 },
          { name: "space-2", px: 8, rem: 0.5 },
          { name: "space-3", px: 12, rem: 0.75 },
          { name: "space-4", px: 16, rem: 1 },
          { name: "space-5", px: 24, rem: 1.5 },
          { name: "space-6", px: 32, rem: 2 },
          { name: "space-7", px: 48, rem: 3 },
          { name: "space-8", px: 64, rem: 4 },
          { name: "space-9", px: 96, rem: 6 },
          { name: "space-10", px: 128, rem: 8 },
        ],
      },
    },
  },
  {
    toolName: "design-system-architect",
    input: { brief: "health companion app, PCOS focus" },
    output: {
      type: "markdown",
      data: {
        title: "Token architecture for a health companion system",
        content:
          "**Structure**: CSS custom properties, scoped under `[data-theme]` blocks to support light/dark and a calm/focus theme.\n\n- `tokens/` — primitive color/space/type values\n- `semantic/` — mapped to roles (surface-subtle, text-muted, danger-on-surface)\n- `components/` — per-component overrides\n\n**Naming**: `--{category}-{role}-{modifier}` (e.g. `--color-text-muted-on-dark`).\n**Dark mode**: flip only semantic mappings, never primitives.",
      },
    },
  },
];

let sent = 0;
for (const e of events) {
  const res = await fetch(`${BASE}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: TOKEN, ...e, timestamp: now() }),
  });
  const body = await res.json();
  if (body.ok) {
    console.log(`  ✔ seeded ${e.output.type}`);
    sent++;
  } else {
    console.error(`  ✘ failed ${e.output.type}`, body);
  }
}

// Emit __mcp.connected__ so the sidebar flips to "Connected"
await fetch(`${BASE}/api/events`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    token: TOKEN,
    toolName: "__mcp.connected__",
    input: {},
    output: { seeded: true },
    timestamp: now(),
  }),
});
console.log(`  ✔ connected flag set`);

console.log(`\nSeeded ${sent}/${events.length} events for ${TOKEN}. Reload /companion to see.`);
