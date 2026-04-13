# dwc V2 — Build Progress

**Last updated:** April 13, 2026
**Overall status:** Phases 1 + 2 code-complete for the alpha path. Full loop works: onboarding → token → install → MCP tool call → live-render in the companion. Phase 3 (Supabase) + command library expansion are the open fronts.

---

## How to use this file

Read at session start. Update at session end if anything moved.

- Move items from **In progress** → **Done** when complete.
- Add new blockers under the relevant phase.
- Update the `Last updated` date above whenever you edit.
- Don't restructure. Just update content.

---

## Phase 1 — MCP Server

**Status:** Code-complete (pending npm publish)
**Spec:** `01-mcp-server.md`

### In progress
- Publish `designwithclaude@2.0.0-alpha.1` to npm (user decision — private tag recommended until Phase 3 hardens payments + persistence)

### Done
- Repo scaffolded as a real npm package at the root (package.json, tsconfig.json, type: module)
- `@modelcontextprotocol/sdk@^1.29.0` + zod wired in; McpServer over stdio
- `dist/server.js` with shebang and exec bit (postbuild `chmod-bins.mjs`)
- `hello-world` tool round-trips end-to-end (`npm run test:mcp`)
- Server auto-discovered by Claude Code via project `.mcp.json` (machine-local, gitignored); `claude mcp list` → ✓ Connected
- `src/config.ts` reads `DWC_TOKEN`, `DWC_API_URL`, `DWC_GATING`, `DWC_EVENTS`, `DWC_COMMANDS_DIR`
- `src/api-client.ts` with `gatingCheck`, `gatingConsume`, `emitEvent` (fail-open when API 404s)
- `src/gating.ts` with pre-call check; blocks with clear upgrade copy on `free_tier_exhausted` / `subscription_cancelled`
- `src/events.ts` emits structured events post-call (token-gated)
- Logger writes to stderr so stdio transport isn't corrupted
- 7 real tools implemented: `design-brief`, `design-system-architect`, `color-specialist` (deterministic HSL seed palette), `typography-specialist` (clamp scale), `spacing-specialist` (non-linear scale), `setup-guide`, `debug-helper`
- Each tool loads its role prompt from `commands/*.md` (frontmatter stripped, cached)
- `src/bin/setup.ts` CLI: `setup` + `uninstall` with `--scope=user|project`, `--token`, `--api`, `--skip-validate`
- Setup prefers `claude mcp add-json`; falls back to direct `~/.claude.json` edit (with timestamped backup) or project `.mcp.json`
- Dry-run covering install + uninstall + env propagation passes (`npm run test:setup`)
- dwc API stubs shipped inside `web/` Next.js app:
  - `POST /api/tokens/validate` — shape-checks `imr_*`, returns profile summary
  - `POST /api/gating/check` — enforces 10-command free tier
  - `POST /api/gating/consume` — increments command count on successful tool call
  - `POST /api/events` — ingests `EventPayload`, detects `__mcp.connected__` to flip the profile's `connected` flag
  - `GET /api/events/recent?token=imr_xxx&limit=N` — debug polling endpoint (Phase 2 companion polls this until Supabase Realtime lands)
- Shared types + in-memory store at `web/lib/dwc/{types,tokens,store}.ts`; `Symbol.for` singleton survives Next HMR
- All API routes pin `runtime = "nodejs"` (needed for `node:crypto` token hashing + minting)
- `npm run test:e2e` verifies 10-call free tier + block at 11 + event storage

### Blockers
- None

### Next action
Decide: publish alpha to npm (enables external testers to run `npx designwithclaude setup`) or push straight to Phase 3 Supabase migration.

---

## Phase 2 — Browser Companion

**Status:** Code-complete for alpha
**Spec:** `02-browser-companion.md`

### In progress
- _(nothing — Supabase Realtime swap is Phase 3 work)_

### Done
- Wireframes (`dwc-wireframes-v1.html`, 7 screens) locked the visual spec
- `POST /api/profile` mints `imr_` tokens (9 random bytes → base64url), stores onboarding answers, generates CLAUDE.md, returns `{token, claudeMd, profile}`
- `GET /api/profile?token=xxx` returns the stored profile for server-side rendering
- `/start` — 5-step wizard (not chat): product type → stack → design system → experience level → tone. On submit posts to `/api/profile` and redirects to `/profile?token=xxx`
- `/profile?token=xxx` — the "it knows me" payoff screen. Meta summary tile + CLAUDE.md code block with copy button. CTA → `/install`
- `/install?token=xxx` — prefilled `npx designwithclaude setup --token=imr_xxx` with copy button, plain-English breakdown, how-to-undo, and "I&apos;ve installed → companion" CTA
- `/companion?token=xxx` — polls `/api/events/recent` every 2.5s; states: waiting-for-install → ready-to-build → live feed with latest event highlighted; "built so far" sidebar counts events by output kind
- 6 render components (`components/companion/renderers/*`): `PaletteRenderer` (color grid), `TypeScaleRenderer` (ramp with live preview text), `SpacingRenderer` (horizontal bars), `ComponentSpecRenderer` (structured sections), `CopyRenderer` (tone tag + blocks), `MarkdownRenderer` (`react-markdown` + `remark-gfm`)
- `/upgrade?token=xxx` — retention-thesis copy ("Keep what you&apos;ve built") + Free vs Subscriber plan cards + link-back to companion (Dodo checkout placeholder)
- `claude-md-generator.ts` extended with `tone_preference` for the new 5-question flow
- `Shell` component with step indicator (1→5) ensures consistent nav across the journey
- `CopyButton` with clipboard fallback works in modern browsers + older
- `npm run test:phase2` boots web dev server, posts onboarding, drives MCP with the minted token, fires 4 tool calls (palette/type-scale/spacing/markdown), asserts stored events match `ToolOutputPayload` shapes, and curls all 5 routes to verify server-rendered HTML contains expected content

### Blockers
- None

### Next action
Begin Phase 3: Supabase schema + swap in-memory store for real persistence; then Dodo webhook for upgrade/cancel/resubscribe. Alternatively expand command library to 12+ tools (more renderables = more visual payoff on the companion).

### Deferred
- Supabase Realtime swap — polling is good enough for alpha; realtime is Phase 3
- Landing page (`/`) redesign — existing skills directory stays; companion flow is the new product surface
- Dodo Payments integration on `/upgrade` — placeholder CTA for now
- Magic-link email recovery for lost tokens
- Non-contiguous `## Tone` heading in generated CLAUDE.md — the tone guide text appears as a bare paragraph between experience and design system sections. Reads fine; polish later.

---

## Phase 3 — Profile, Gating, Retention

**Status:** Not started
**Spec:** `03-profile-and-gating.md`

### In progress
- _(nothing yet)_

### Done
- _(nothing yet)_

### Blockers
- None (Phase 2 companion is rendering from in-memory store — Phase 3 just ports the store)

### Next action
Create Supabase tables + RLS (`profiles`, `command_history`, `design_artifacts`, `companion_events`). Port `web/lib/dwc/store.ts` one function at a time (`getOrCreateProfile`, `incrementCommandCount`, `recordEvent`, `getRecentEvents`). Companion can swap from polling to Supabase Realtime subscription once `companion_events` has realtime enabled.

---

## Command library

**Status:** MVP (7/39) shipped alongside Phase 1
**Spec:** `04-command-library.md`

### In progress
- Extend to the 12 "core design" tools in priority order
- Add deterministic seed generators for `visual-hierarchy-specialist`, `landing-page-specialist`, `form-designer`, `navigation-designer`, `dashboard-designer` so the companion always has `component-spec` output to render

### Done
- Library defined (39 tools: 32 design + 7 technical)
- Output types defined (6 kinds: palette, type-scale, spacing, component-spec, copy, markdown)
- Shared `ToolDefinition` + `ToolResult` types (`src/tools/types.ts`)
- 7 tools shipped end-to-end over MCP: `design-brief`, `design-system-architect`, `color-specialist`, `typography-specialist`, `spacing-specialist`, `setup-guide`, `debug-helper`
- Role prompts sourced from existing `commands/*.md` via `loadPrompt.ts` — no duplicate knowledge base
- Companion renderers for all 6 output kinds — every future tool can target one of them

### Blockers
- None

### Next action
Add `visual-hierarchy-specialist`, `landing-page-specialist`, `navigation-designer`, `form-designer`, `auth-security-ux` + matching structured `component-spec` seeds.

---

## Launch gates

Before public launch:
- [ ] Phases 1 + 2 + 3 all Done
- [ ] At least 12 of 39 commands shipped (enough to complete "Start your project" and "Build your first page" missions)
- [ ] Dodo Payments integrated and tested (upgrade → cancel → resubscribe cycle)
- [ ] End-to-end test: new user → onboarding → install → 10 commands → upgrade gate → payment → unlimited
- [ ] Anthropic plugin directory approval (submitted ~March 5, 2026; awaiting response)

---

## Parked / deferred

- Mission runner as its own MCP tool (can start with tool chains orchestrated by `design-brief`)
- Remote-hosted MCP server (stdio is sufficient for now)
- Magic link email as token recovery (Phase 3+ polish)
- Migrate the 44 existing `commands/*.md` markdown plugin files out of the repo once V2 MCP tools replace them one-to-one (keep both distributions live through the alpha)
- Gating race condition: `consumeGate` is fire-and-forget in `src/server.ts`. Two concurrent tool calls could both pass the check before either consume lands. Not observable in practice because MCP is request-response and Claude Code serialises tool calls. Phase 3 Supabase transaction will make this airtight.
