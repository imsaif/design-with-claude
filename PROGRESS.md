# dwic V2 — Build Progress

**Last updated:** April 21, 2026 (afternoon)
**Overall status:** Product renamed to **dwic** (d + wi + c = design with claude). Published as `@imrandwc/dwic@1.0.0-alpha.1` on npm; old `designwithclaude@2.0.0-alpha.{1..5}` deprecated with pointer messages. Domain stays `designwithclaude.com` (serves as long-form brand explainer, IBM pattern). All V2 internal identifiers migrated (env vars DWC_* → DWIC_*, CSS `.dwc-*` → `.dwic-*`, `DwcIcon` → `DwicIcon`, `web/lib/dwc/` → `web/lib/dwic/`, logger prefix, binary name). Earlier same day: audit-rollout batch 2 shipped accessibility-specialist + form-designer + navigation-specialist as `designwithclaude@2.0.0-alpha.5` — 7 of 11 V2 tools now audit server-side. Hero positioning is "dwic — the design auditor, inside Claude Code"; interactive AuditDemo on `/` runs the real audit helpers client-side (web/lib/audit/{color,accessibility,form}.ts) with staged reveal + rendered production-view cards + numbered pins. Evidence + plan: `FIELD_NOTES_COGNITION.md` and `ROADMAP_FROM_COGNITION.md` at repo root. Shareable URL: https://www.designwithclaude.com/start

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

## Rename to dwic — April 21, 2026 (afternoon)

Product rename from "dwc" to **dwic** (d + wi + c = design with claude, pronounced "dwick"). The construction preserves the *wi* from "with", carrying the partnership frame (Claude as partner, not agent). Triggered by user framing: "we don't have any users, so switching cost is zero — do the full rename."

Strategy: **Option 1 from the naming plan** — keep the domain `designwithclaude.com` as the long-form brand explainer (IBM pattern), rename everything else. This avoids domain migration / SEO hit while giving the product a distinctive spoken/written brand name. Every time someone shares the URL, they learn "dwic = design with claude".

- [x] **Layer 1 — npm + config + server.** Package name `designwithclaude` → `@imrandwc/dwic` (unscoped `dwic` was rejected by npm: "too similar to swig/twig"). Version reset: `2.0.0-alpha.5` → `1.0.0-alpha.1` (fresh name, fresh story). Binaries `designwithclaude` / `dwc-mcp-server` → `dwic` / `dwic-mcp-server`. Env vars DWC_* → DWIC_* (token, project_id, api_url, events, gating, commands_dir, debug, onboarding_gate, memory_context, supabase_url, supabase_service_role_key, allow_implicit_project). Type `DwcConfig` → `DwicConfig`. Logger prefix `[dwc ...]` → `[dwic ...]`. User-Agent `designwithclaude-mcp/2.0` → `dwic-mcp/1.0`. MCP entry key `designwithclaude` → `dwic` (or `dwic-<slug>` for user scope).
- [x] **Layer 2 — CSS classes.** ~150 `.dwc-*` prefixes → `.dwic-*` across `web/app/skills.css` + every component referencing those classNames (AuditDemo, InstallV2, SpecialistsList, Shell, MarkdownRenderer, AddProjectTile, CompanionView).
- [x] **Layer 3 — file + directory renames.** `web/components/DwcIcon.tsx` → `DwicIcon.tsx`; `web/lib/dwc/` → `web/lib/dwic/` (5 files: supabase, store, types, tokens, projects); `web/public/dwc-icon.svg` → `dwic-icon.svg`. All ~25 import paths updated. `X-Dwc-Project-Auto-Created` header → `X-Dwic-...`. Internal Symbol.for keys `"dwc.alpha.*"` → `"dwic.alpha.*"`. localStorage `"dwc.lastToken"` → `"dwic.lastToken"`.
- [x] **Layer 4 — user-facing copy + metadata.** Hero subtitle, AuditDemo eyebrow, InstallV2 (2 places + install command), account page, install page copy + setupCommand + uninstallCommand, layout.tsx metadata (title/description/OG alt/keywords), manifest.json (name/short_name/description), `/library` cross-link wording + metadata, README top-matter rewritten to introduce dwic + the free library as sibling products.
- [x] **Tests updated.** scripts/test-onboarding-gate.mjs, test-setup-dry-run.mjs, test-memory-context.mjs, test-e2e-roundtrip.mjs, test-phase2-flow.mjs, test-mcp-handshake.mjs, live-smoke.mjs, seed-local-tiles.mjs — DWC_* → DWIC_*. All 11 MCP test suites green + setup-dry-run + web production build clean.
- [x] **Published** `@imrandwc/dwic@1.0.0-alpha.1` on npm under `latest` tag. Deprecated `designwithclaude@{2.0.0-alpha.1, ..., 2.0.0-alpha.5}` with pointer message: *"Renamed to @imrandwc/dwic. Run: npx @imrandwc/dwic setup --token=imr_xxx --project=<slug>"*. First-time scope publish has a typical 5-15 min read-side propagation delay.
- [ ] Verify `npx @imrandwc/dwic@latest help` works from a clean tmp dir once propagation completes.
- [ ] Revoke the npm automation token used for this publish (previous pattern: rotate after each publish).

### What explicitly did NOT rename
- Domain `designwithclaude.com` — stays; serves as long-form brand explainer every time a URL is shared.
- GitHub repo `imsaif/design-with-claude` — developer-facing, low brand value, not worth the churn.
- Token prefix `imr_*` — unrelated to brand.
- `commands/*.md` — V1 library role prompts, not rebranded.

### Commits
- `60d1e48` — core rename (60 files)
- `e9f249f` — scope name fix after `dwic` was rejected (9 files)

Both pushed to `origin/main`. Vercel redeploying web with dwic branding.

## Audit-rollout batch 2 (alpha.5) — April 21, 2026 (morning)

Direct response to the "is dwic actually auditing?" honesty check. alpha.4 made the hero claim "design auditor, inside Claude Code", but only 4 of 9 V2 tools had real audit logic. alpha.5 adds 3 more, taking the count to 7 of 11 — the hero becomes substantively true.

- [x] **accessibility-specialist (new).** V2 MCP tool that parses HTML/JSX for: missing alt attributes, unlabeled form inputs (via `<label for>`, wrapping `<label>`, aria-label, aria-labelledby), skipped heading levels + multiple h1s, anchor-used-as-button (href=`#`, javascript:), buttons without accessible names, missing landmarks (`<main>`, `<nav>`), missing skip links. Optional server-computed color-pair contrast (reuses `color.ts` math). Generate mode returns a targeted a11y checklist. Test: `npm run test:audit-accessibility` (23 assertions).
- [x] **form-designer (new).** V2 MCP tool that parses form markup for: inputs outside `<form>`, implicit input types (`text` default), `*`-in-label without `required` attribute, password inputs without reveal toggle (heuristic), orphaned error/hint elements not wired via `aria-describedby`, radio/checkbox groups not wrapped in `<fieldset><legend>`, multiple submits without `name` for server disambiguation. Test: `npm run test:audit-form-designer` (17 assertions).
- [x] **navigation-specialist (new).** V2 MCP tool that parses nav markup for: missing `<nav>` landmarks around anchor lists, multiple navs without distinguishing `aria-label`, active-class-without-aria-current, missing skip link, nesting depth ≥4 levels deep, large navs (≥5 links) with no disclosure toggle for mobile. Test: `npm run test:audit-navigation-specialist` (15 assertions).
- [x] **test:explicit-asks extended.** Added fixtures for the 3 new specialists so C3 directive coverage stays complete across all 10 active tools.
- [ ] `designwithclaude@2.0.0-alpha.5` publish to npm (pending user sign-off)

### Next in the audit-rollout roadmap

- **Batch 3 (deferred):** copy (heuristic — passive voice, jargon, CTA verb strength, button-text length) + motion-designer (runtime-defined — `prefers-reduced-motion` support, duration bounds, easing sanity, animation property discipline)
- **Non-audit specialists:** empty-loading-states, icon-illustration, notification-designer, settings-designer — generate-only tools, roll out incrementally
- **Share-with-friends / V2 homepage** — still on the launch-gate list

## Cognition-roadmap alpha.4 — in working tree (April 20, 2026)

Response to Anthropic's Claude Design launch (`claude.ai/design`, April 20, 2026). Strategic read: Claude Design commoditizes ideation-on-canvas; dwc hardens as the design-engineering rigor layer for code-first designers — audit, drift detection, persistent project memory.

- [x] **C2 cont. — audit mode on typography-specialist.** New `mode: "generate" | "audit"` + `existingTypeScale` + `mandatedFontFamily`. Parses `--font-size-*` / `--line-height-*` / `--font-weight-*` / `--font-family-*` (with naming variants like `--text-*`, `--lh-*`, `--fw-*`). Flags sub-12px clamp minimums, body line-height outside 1.4–1.8, heading line-height > 1.3, non-standard weights, missing roles (h1/h2/body/body-sm/caption), and mandated-font drift. Test: `npm run test:audit-typography`.
- [x] **C2 cont. — audit mode on spacing-specialist.** New `mode` + `existingSpacingTokens`. Parses `--space-*` / `--spacing-*` / `--gap-*`, converts rem/em/px to px. Infers base unit via GCD, flags off-grid values, 3×+ step-jumps, missing common steps (xs/sm/md/lg/xl). Test: `npm run test:audit-spacing`.
- [x] **C2 cont. — audit mode on design-system-architect.** New `mode` + `existingSystem`. Parses ALL `--*` custom properties, splits primitive vs semantic, detects theming strategy (dark-scope selectors + overridden-token count), flags naming inconsistencies (e.g. `--space-*` and `--spacing-*` side-by-side), flags broken `var()` references where a semantic token points at a missing primitive. Test: `npm run test:audit-dsa`.
- [x] **C10 slice 1 — event-history memory injection.** `api.fetchRecentEvents` hits existing `GET /api/events/recent`; server refreshes with 10s TTL cache in the tool-handler pre-flight; `renderDesignerContext()` appends a "Recent design decisions" block (most-recent first, capped at 5) so every specialist prompt sees what the designer already ran in this project. Kill-switch `DWC_MEMORY_CONTEXT=off`. Exempt: `hello-world`, `set-project-profile`. Test: `npm run test:memory-context`.
- [x] **V1 hero repositioning.** `web/components/skills/Hero.tsx` now leads with "Design-engineering rigor inside Claude Code" + "Audit, preserve, and persist your design system while Claude Code ships" + canvas-neutral subtitle. Keeps the stat pills unchanged.
- [ ] `designwithclaude@2.0.0-alpha.4` publish to npm (pending user sign-off after live smoke)

### Next in the Cognition roadmap

- **C9 slice 2** — verify prompt-injection lights up post-onboarding in real sessions (mechanically free, needs qualitative check)
- **C9 slice 3** — auto-detect `package.json` / `tailwind.config.*` / `themes.css` to pre-fill answers, deferred
- **C1** — `design-next-step` tool (library → partner), deferred after Claude Design launch reprioritization
- **C10 slice 2** — richer event-summary shapes (not just tool name + count), once alpha.4 settles

## Cognition-roadmap P0 batch (alpha.3) — shipped April 17, 2026

Derived from `FIELD_NOTES_COGNITION.md` + `ROADMAP_FROM_COGNITION.md`. First batch of P0 items from the Cognition dogfood session.

- [x] **C3 — explicit-ask directive.** Every specialist's composed prompt now opens with a directive telling the LLM to extract explicit asks from the brief (questions, imperatives, numeric constraints, named constraints, existing-state refs) and answer them by name before the default output. Centralized in `composeRolePrompt`; applies to all 7 specialists. Qualitatively verified on Cognition before moving on. Test: `npm run test:explicit-asks`.
- [x] **C2 — audit mode + mandated-accent preservation + server-computed contrast on color-specialist.** New `mode: "generate" | "audit"` input + `existingTokensCss` + `surfaces`. Generate mode: primary-500 is pinned to the exact mandated accent hex (fixes the `#1F3B90 → #2d56d2` silent drift), every token carries server-computed contrast against `#FFFFFF` and `#121212`. Audit mode: parses `--color-*` tokens from the designer's CSS, computes a full contrast matrix, flags failing pairings, detects structural gaps, checks the mandated accent is actually present. No fresh seed in audit mode. Test: `npm run test:audit-mode`.
- [x] **C9 slice 1 — first-call-in-new-project onboarding gate + `set-project-profile` MCP tool.** Server-side gate in `registerTool` fires when a token is present but the project has no onboarding; returns a structured onboarding response telling the LLM to ask the designer 6 questions and call `set-project-profile`. Gate runs BEFORE gating check so onboarding doesn't burn free-tier slots. `hello-world` and `set-project-profile` are exempt. Kill-switch: `DWC_ONBOARDING_GATE=off`. Profile persistence + in-process cache update via `setDesignerProfile`. Slice 2 (prompt injection of profile into every tool call) already lands for free via `renderDesignerContext()`. Test: `npm run test:onboarding-gate`.
- [x] `designwithclaude@2.0.0-alpha.3` published to npm under `latest`

### Next in the Cognition roadmap
- **C9 slice 2** — verify prompt-injection actually lights up post-onboarding in real sessions (mechanically free, needs qualitative check)
- **C9 slice 3** — auto-detect `package.json` / `tailwind.config.*` / `themes.css` to pre-fill answers, deferred
- **C2 cont.** — roll audit mode to typography-specialist, spacing-specialist, design-system-architect
- **C1** — `design-next-step` tool (library → partner)
- **C10** — memory across calls (event history fed back into tool prompts)

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
