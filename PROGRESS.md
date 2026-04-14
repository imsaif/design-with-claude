# dwc V2 — Build Progress

**Last updated:** April 14, 2026
**Overall status:** Multi-project alpha shipped. `designwithclaude@2.0.0-alpha.2` is live on npm. Full loop (onboarding → token → per-project CLAUDE.md → install → MCP tool call → live canvas + sticky status sidebar) works end-to-end on production. One designer, many projects, isolated design systems, per-designer free-tier gating across projects. Shareable URL: https://www.designwithclaude.com/start

**For testing / onboarding new contributors:** see `TESTING.md` at repo root — plain-language walkthrough of the live flow, add-a-project, share-with-friends, and common break-fixes.

---

## How to use this file

Read at session start. Update at session end if anything moved.

- Move items from **In progress** → **Done** when complete.
- Add new blockers under the relevant phase.
- Update the `Last updated` date above whenever you edit.
- Don't restructure. Just update content.

---

## Phase 1 — MCP Server

**Status:** Shipped — `designwithclaude@2.0.0-alpha.1` live on npm
**Spec:** `01-mcp-server.md`

### In progress
- _(nothing)_

### Done
- Repo scaffolded as a real npm package at the root (package.json, tsconfig.json, type: module)
- `@modelcontextprotocol/sdk@^1.29.0` + zod wired in; McpServer over stdio
- `dist/server.js` with shebang and exec bit (postbuild `chmod-bins.mjs`)
- `hello-world` tool round-trips end-to-end (`npm run test:mcp`)
- Server auto-discovered by Claude Code via project `.mcp.json`; `claude mcp list` → ✓ Connected
- `src/config.ts` reads `DWC_TOKEN`, `DWC_API_URL`, `DWC_GATING`, `DWC_EVENTS`, `DWC_COMMANDS_DIR`
- `src/api-client.ts` with `gatingCheck`, `gatingConsume`, `emitEvent` (fail-open when API 404s)
- `src/gating.ts` with pre-call check; blocks with clear upgrade copy on `free_tier_exhausted` / `subscription_cancelled`
- `src/events.ts` emits structured events post-call (token-gated)
- Logger writes to stderr so stdio transport isn't corrupted
- 7 real tools implemented: `design-brief`, `design-system-architect`, `color-specialist`, `typography-specialist`, `spacing-specialist`, `setup-guide`, `debug-helper`
- Each tool loads its role prompt from `commands/*.md`
- `src/bin/setup.ts` CLI: `setup` + `uninstall` with `--scope=user|project`, `--token`, `--api`, `--skip-validate`
- Setup prefers `claude mcp add-json`; falls back to direct `~/.claude.json` edit (with timestamped backup) or project `.mcp.json`
- dwc API stubs inside `web/`: `/api/tokens/validate`, `/api/gating/{check,consume}`, `/api/events`, `/api/events/recent`, `/api/profile`
- All API routes pin `runtime = "nodejs"`
- `npm run test:e2e` verifies 10-call free tier + block at 11 + event storage
- **Published** as `designwithclaude@2.0.0-alpha.1` under `latest` tag (user: `imrandwc`, 2FA: auth-only)
- `npx designwithclaude help` from a clean directory downloads + runs successfully

### Blockers
- None

### Next action
First polish pass after self-testing the live flow — friction points, copy, layout glitches.

---

## Phase 2 — Browser Companion

**Status:** Shipped — live at https://www.designwithclaude.com
**Spec:** `02-browser-companion.md`

### In progress
- _(nothing)_

### Done
- Wireframes (`dwc-wireframes-v1.html`, 7 screens)
- `POST /api/profile` mints `imr_` tokens (9 random bytes → base64url), stores onboarding answers, generates CLAUDE.md
- `GET /api/profile?token=xxx` returns stored profile for server-side rendering
- `/start` — 5-step wizard (product type → stack → design system → experience level → tone)
- `/profile?token=xxx` — "it knows me" payoff screen with CLAUDE.md code block + copy button
- `/install?token=xxx` — prefilled `npx designwithclaude setup --token=imr_xxx` + plain-English breakdown
- `/companion?token=xxx` — 2.5s polling of `/api/events/recent`, waiting/ready/feed states, latest-event highlight, "built so far" sidebar
- `/upgrade?token=xxx` — retention-thesis copy + Free vs Subscriber plan cards (Dodo placeholder)
- 6 render components: PaletteRenderer (color grid), TypeScaleRenderer (ramp w/ live preview), SpacingRenderer (bars), ComponentSpecRenderer, CopyRenderer, MarkdownRenderer
- `claude-md-generator.ts` extended with `tone_preference`
- `Shell` + `CopyButton` reusable components
- `npm run test:phase2` — full loop + HTML smoke check on all 5 routes
- Live deployment verified on Vercel: `https://www.designwithclaude.com/start` renders, API routes respond, MCP round-trip confirmed against prod

### Blockers
- None

### Next action
Self-test the live flow as a first-time designer would. Note copy friction, layout bugs, missed empty-states.

### Deferred
- Landing page (`/`) redesign — existing skills directory still serves `/`. Companion flow lives on `/start`.
- Supabase Realtime swap — polling works for alpha. Switch once traffic justifies.
- Dodo Payments on `/upgrade` — placeholder CTA; wire when payments are approved.
- Magic-link email recovery for lost tokens.
- Mobile responsive polish.

---

## Phase 3 — Profile, Gating, Retention

**Status:** Persistence shipped; payments deferred
**Spec:** `03-profile-and-gating.md`

### In progress
- _(nothing)_

### Done
- Supabase project created + schema applied (`web/supabase/schema.sql`): `profiles`, `companion_events`, `increment_command_count` RPC
- `web/lib/dwc/supabase.ts` — lazy singleton client using service_role key
- `web/lib/dwc/store.ts` — async functions dispatching to Supabase when `DWC_SUPABASE_URL` + `DWC_SUPABASE_SERVICE_ROLE_KEY` are set; in-memory Map fallback for local dev/tests
- All API routes + server pages (`/profile`, `/upgrade`) updated to `await` store calls
- Vercel env vars set (Production)
- Live smoke test passed: POST `/api/profile` → GET returns same profile across serverless instances; gating counter increments atomically; MCP events land and persist
- `web/supabase/SETUP.md` — 5-step setup doc

### Blockers
- None

### Next action
Dodo Payments integration (upgrade/cancel/resubscribe webhook) — unblocks real monetisation. After that, port `command_history` + `design_artifacts` if the companion needs deeper retention UI.

### Deferred
- `command_history` table — `profiles.command_count` is enough for gating
- `design_artifacts` table — events are sufficient for now
- Dodo webhook — user needs to create a Dodo account + connect HDFC payout
- Row-Level Security policies — we use `service_role` server-side only, so RLS blocks anon access (safe default)
- Supabase Realtime subscription from companion — polling good enough for alpha

---

## Command library

**Status:** MVP (7/39) shipped
**Spec:** `04-command-library.md`

### In progress
- _(nothing)_

### Done
- Library defined (39 tools: 32 design + 7 technical)
- Output types defined (6 kinds: palette, type-scale, spacing, component-spec, copy, markdown)
- Shared `ToolDefinition` + `ToolResult` types (`src/tools/types.ts`)
- 7 tools shipped end-to-end over MCP: `design-brief`, `design-system-architect`, `color-specialist`, `typography-specialist`, `spacing-specialist`, `setup-guide`, `debug-helper`
- Role prompts sourced from existing `commands/*.md` via `loadPrompt.ts`
- Companion renderers for all 6 output kinds

### Blockers
- None

### Next action
Add `visual-hierarchy-specialist`, `landing-page-specialist`, `navigation-designer`, `form-designer`, `auth-security-ux` + matching `component-spec` seeds so `/companion` has richer renderables.

---

## Multi-project (alpha.2) — shipped April 14, 2026

- [x] Supabase migration applied (`projects`, `project_profiles`, `project_id` on events)
- [x] API backward-compat rollout (every endpoint accepts `project`; defaults to `default` when missing)
- [x] MCP server + setup CLI speak `DWC_PROJECT_ID` / `--project=<slug>`
- [x] `designwithclaude@2.0.0-alpha.2` published to npm under `latest`
- [x] Web UX: `/account` dashboard, `+` tile inline add, sample-card orientation, per-project companion, "Welcome back" banner, step-1 back-out
- [x] Live smoke test: one designer, two projects, isolated profiles + events on prod
- [ ] Flip `DWC_ALLOW_IMPLICIT_PROJECT` off once existing alpha.1 installs have been upgraded

## Launch gates

Before public launch:
- [x] Phases 1 + 2 Done
- [x] Phase 3 persistence Done (payments still pending)
- [x] npm package published
- [x] Multi-project architecture live
- [ ] Self-polish pass on live UX (continuous)
- [ ] At least 12 of 39 commands shipped (enough for "Start your project" + "Build your first page" missions)
- [ ] Dodo Payments integrated and tested
- [ ] End-to-end test: new user → onboarding → install → 10 commands → upgrade gate → payment → unlimited
- [ ] V2 homepage replacing the V1 skills-directory at `/`
- [ ] Anthropic plugin directory approval (submitted ~March 5, 2026; awaiting)

---

## Parked / deferred

- Mission runner as its own MCP tool
- Remote-hosted MCP server (stdio sufficient)
- Magic link email as token recovery
- Migrate the 44 existing `commands/*.md` markdown plugin files out of the repo once V2 MCP tools fully replace them
- Gating race condition: `consumeGate` fire-and-forget; negligible in practice
- Update README.md on npm — currently shows V1 markdown-plugin era content. Refresh in `2.0.0-alpha.2` once UX polish settles.
- Re-tighten npm 2FA to "Authorization and writes" once alpha publishes settle down. Currently set to `auth-only` for iteration speed.
