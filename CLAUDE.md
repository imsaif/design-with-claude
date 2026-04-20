# design-with-claude

## Project Overview
**V2 alpha live (April 2026):** subscription product that configures Claude Code for designers via an MCP server, paired with a browser companion that renders command outputs live.
- Live web: https://www.designwithclaude.com (start at `/start`)
- npm package: `designwithclaude@2.0.0-alpha.1`
- Persistence: Supabase (profiles + companion_events)
- See `PROGRESS.md` at the repo root for current state; `00-product-brief.md` + `0{1,2,3,4}-*.md` on Desktop for the canonical plan.

**V1 (still shipping):** 44 specialized design agents as Claude Code slash commands, available as a plugin or standalone. `commands/*.md` stays intact — the V2 MCP server reuses those files as role prompts.

## Architecture
- **V2 MCP server (root):** TypeScript, ESM, `@modelcontextprotocol/sdk` over stdio. Tools live in `src/tools/`. Shared types in `src/tools/types.ts`. Six structured output kinds: palette, type-scale, spacing, component-spec, copy, markdown.
- **V2 install flow:** `npx designwithclaude setup --token=imr_xxx [--scope=user|project]` writes the MCP entry. Uses `claude mcp add-json` when available, falls back to direct `~/.claude.json` edit with timestamped backup, or `.mcp.json` at the cwd for project scope.
- **V2 gating:** Pre-call `/api/gating/check`, post-call `/api/gating/consume`. Fails open when `DWC_GATING` is off (dev/alpha default).
- **V2 events:** Post-call emit to `/api/events`. Payload shape defined in `src/api-client.ts` → `EventPayload`. The browser companion (Phase 2) subscribes via Supabase Realtime.
- **V1 plugin (unchanged):** `.claude-plugin/plugin.json` manifest; `commands/*.md` are the knowledge base for both V1 slash commands and V2 MCP tool role prompts. `/design-brief` is the master command.

## Key Files
- `package.json` (root) — npm package `designwithclaude`, bins: `designwithclaude` (setup CLI) + `dwc-mcp-server` (server entry)
- `src/server.ts` — MCP server main; registers all tools; wraps handlers with gating + event emission
- `src/tools/index.ts` — tool registry
- `src/tools/types.ts` — `ToolDefinition`, `ToolResult`, output payload types
- `src/tools/loadPrompt.ts` — reads and caches `commands/*.md` role prompts
- `src/bin/setup.ts` — `npx designwithclaude setup` install flow
- `scripts/test-mcp-handshake.mjs` — stdio round-trip against `dist/server.js` (`npm run test:mcp`)
- `scripts/test-setup-dry-run.mjs` — install/uninstall against a tmp project (`npm run test:setup`)
- `.claude-plugin/plugin.json` — V1 plugin manifest (unchanged)
- `.claude-plugin/marketplace.json` — V1 marketplace catalog (unchanged)
- `commands/*.md` — role prompts, shared by V1 slash commands and V2 MCP tools
- `README.md` — V1 install + command reference (still current for the plugin path)
- `web/` — landing page; will become the V2 browser companion (Phase 2)
- `web/lib/dwc/{types,tokens,store}.ts` — shared types + in-memory store (Symbol.for singleton survives HMR) that Phase 3 will port to Supabase
- `web/app/api/tokens/validate`, `web/app/api/gating/{check,consume}`, `web/app/api/events`, `web/app/api/events/recent` — dwc API stubs consumed by the MCP server and the Phase 2 companion
- `web/app/api/profile/route.ts` — POST mints `imr_` tokens + stores onboarding answers + returns generated CLAUDE.md; GET returns stored profile
- `web/app/{start,profile,install,companion,upgrade}/page.tsx` — V2 companion flow pages (5 screens)
- `web/components/companion/` — `Shell`, `CopyButton`, `StartWizard`, `CompanionView`, plus `renderers/{Palette,TypeScale,Spacing,ComponentSpec,Copy,Markdown}Renderer.tsx` + barrel `renderers/index.tsx`
- `web/lib/claude-md-generator.ts` — extended with `tone_preference` for the V2 flow
- `web/lib/dwc/supabase.ts` — lazy service_role Supabase client (server-side only; RLS blocks anon)
- `web/lib/dwc/store.ts` — async store; dispatches to Supabase when `DWC_SUPABASE_URL` + `DWC_SUPABASE_SERVICE_ROLE_KEY` are set, in-memory Map fallback otherwise
- `web/supabase/{schema.sql,SETUP.md}` — schema + 5-step user setup doc for Supabase project + Vercel env

## Command File Structure
Each command follows this format:
```
---
description: Short description for Claude Code's command picker
---

Role statement with $ARGUMENTS placeholder

## Expertise
## Design Principles
## Guidelines
## Checklist
## Anti-patterns
## How to respond
## What to ask if unclear
```

## Naming Convention
Commands use pure role-based names (e.g., `accessibility-specialist`, `motion-designer`, `form-designer`). No `design-` prefix except for `design-brief` (the master command) and `design-system-architect`.

## Recent Sessions

### Session 2026-04-17 22:10 (MacBook)
- **Pattern:** Cognition-roadmap P0 batch — C3 explicit-ask directive + C2 audit mode + C9 onboarding gate, shipped as alpha.3
- **Status:** Complete — `designwithclaude@2.0.0-alpha.3` published to npm under `latest`; commit `abcc1e6` pushed to main
- **Files Changed:** 14 (+1871 / -28) — 8 modified (package.json, src/api-client.ts, src/bin/setup.ts, src/server.ts, src/tools/{color,color-specialist,loadPrompt}.ts, PROGRESS.md), 6 new (FIELD_NOTES_COGNITION.md, ROADMAP_FROM_COGNITION.md, src/tools/set-project-profile.ts, scripts/test-{explicit-asks,audit-mode,onboarding-gate}.mjs)
- **Tests Added/Modified:** 3 new fixture-based test scripts totaling 38 assertions: `test:explicit-asks` (9), `test:audit-mode` (19), `test:onboarding-gate` (10). All prior tests (`test:mcp`) still green.
- **Notes:** Drove the first four items of `ROADMAP_FROM_COGNITION.md` in a single batch. **C3:** every specialist prompt now opens with an explicit-ask directive (centralized in `composeRolePrompt`); Cognition qualitative replay confirmed Claude leads with "Explicit asks from the brief", computes contrast ratios by name, answers before the default output. **C2:** `color-specialist` gained `mode: "generate" | "audit"` + `existingTokensCss` + `surfaces`; generate mode pins primary-500 to the exact mandated accent hex (fixes the silent `#1F3B90 → #2d56d2` drift from field notes), ships server-computed WCAG contrast on every token against `#FFFFFF` and `#121212`; audit mode parses `--color-*` declarations from CSS, computes a contrast matrix, flags failing pairings, detects structural gaps, confirms mandated-accent presence — no fresh seed emitted in audit mode. **C9 slice 1:** onboarding gate in `src/server.ts` fires when a token is present but the project has no onboarding answers; returns a structured response with 6 questions; new `set-project-profile` factory-pattern MCP tool persists answers via `POST /api/profile` and updates the in-process cache via `setDesignerProfile` so the same session releases the gate without restart. Gate runs BEFORE `gatingCheck` so onboarding doesn't burn free-tier slots. Exempts `hello-world` + `set-project-profile`. Kill-switch `DWC_ONBOARDING_GATE=off`; auto-disabled when no token. Slice 2 (prompt injection) lands for free via existing `renderDesignerContext()`. **Publish dance:** npm login via passkey worked, but CLI publish still demanded OTP; granular token failed under account's current 2FA mode; Classic Automation token succeeded (matches April 14 notes exactly). Decision to batch C3+C2+C9 into one alpha was driven by the "no users" framing — saved to memory as `feedback_dwc_batch_ships_no_users.md`.

### Session 2026-04-14 18:00 (MacBook)
- **Pattern:** Multi-project alpha.2 — schema + API + MCP + CLI + Web UX + ship
- **Status:** Complete — `designwithclaude@2.0.0-alpha.2` published; prod smoke test confirms two projects under one token with isolated profiles and events
- **Files Changed:** ~50 across schema migration, web API + store, MCP server + setup CLI, Web UX (new `/account`, new components: `AddProjectTile`, `SampleProjectCard`, `WelcomeBackBanner`)
- **Tests Added/Modified:** `test:phase2` assertions updated for new account/scoped API shapes; `test:setup` exercises `--project=<slug>` path
- **Notes:** Introduced projects as first-class under a single token (Option B from the design discussion). New `projects` + `project_profiles` tables via `web/supabase/migrations/001_projects.sql`; `companion_events` gained a `project_id` FK. `increment_command_count(text, uuid)` RPC bumps per-designer (canonical gate) AND per-project (informational) counters atomically. MCP server reads `DWC_PROJECT_ID`; setup CLI adds required `--project=<slug>` flag and defaults `--scope=project`. Web adds `/account` dashboard with sample/orientation card, inline `+` add-project tile, and demoted summary bar. StartWizard step-1 Back exits to `/account` instead of dying. `WelcomeBackBanner` saves the token in localStorage and nudges returning designers back to their account. Free-tier gating is per-designer (10 total) — simple upgrade story. `DWC_ALLOW_IMPLICIT_PROJECT` flag defaults on for alpha grace period; flip off once all alpha.1 installs upgrade. Plain-language `TESTING.md` written for future session handoff.

### Session 2026-04-14 15:30 (MacBook)
- **Pattern:** Ship alpha — Supabase persistence + npm publish
- **Status:** Complete — alpha is live
- **Files Changed:** 14 (Supabase client + SQL schema + SETUP doc + store refactor + 8 callers awaited); commits c955906 (gitignore .clerk/), 4b23587 (Supabase persistence)
- **Tests Added/Modified:** 0 (existing test:phase2 still passes against in-memory fallback)
- **Notes:** Diagnosed serverless memory loss (POST /api/profile → immediate GET = not_found because Vercel instances don't share memory). Added `web/lib/dwc/supabase.ts` lazy client using service_role key. Rewrote `store.ts` to async Supabase calls with in-memory fallback when env vars are unset. User created Supabase project, ran `web/supabase/schema.sql`, set `DWC_SUPABASE_URL` + `DWC_SUPABASE_SERVICE_ROLE_KEY` on Vercel, redeployed. Smoke test confirms profiles + events persist across serverless instances; gating counter increments atomically via `increment_command_count` RPC. Published `designwithclaude@2.0.0-alpha.1` to npm under `latest` tag — first publish required automation token (2FA-bypass granular token) because passkey 2FA + CLI publish still demands OTP even with `auth-only` setting. Token revoked after publish. Shareable URL: https://www.designwithclaude.com/start.

### Session 2026-04-13 23:00 (MacBook)
- **Pattern:** V2 Phase 2 browser companion — end-to-end
- **Status:** Complete — full loop (onboarding → token → install → MCP tool call → live render) works
- **Files Changed:** 18 new files in web/ (5 routes, 1 new API route, Shell + CopyButton + StartWizard + CompanionView components, 6 renderer components), lib/claude-md-generator.ts extended with tone_preference, 3 lib/dwc/* extensions, 1 new test script
- **Tests Added/Modified:** 1 (test:phase2 — posts /api/profile, drives MCP with minted token, validates events match ToolOutputPayload shapes, curls all 5 routes for server-rendered content)
- **Notes:** Built `/start` as a 5-step wizard (chips + textarea, not chat), `/profile` with meta tile + CLAUDE.md preview + copy button, `/install` with prefilled npx command, `/companion` with 2.5s polling of /api/events/recent + waiting/ready/feed states + "built so far" sidebar, `/upgrade` with retention-thesis copy + plan cards. 6 render components — PaletteRenderer (color grid with group tags), TypeScaleRenderer (ramp with live preview text), SpacingRenderer (horizontal bars), ComponentSpecRenderer, CopyRenderer, MarkdownRenderer (react-markdown + remark-gfm). New `POST /api/profile` mints imr_ tokens via `crypto.randomBytes(9).toString('base64url')`, generates CLAUDE.md via existing generator, stores onboarding answers. Polling chosen over Supabase Realtime for alpha — swap is Phase 3 work. Existing `/` landing page + `(app)/` routes intentionally untouched.

### Session 2026-04-13 21:30 (MacBook)
- **Pattern:** V2 Phase 1 dwc API stubs + end-to-end round-trip
- **Status:** Complete — Phase 1 code-complete
- **Files Changed:** 7 new files in web/ (3 lib/dwc + 5 API routes), 1 new e2e test script, PROGRESS.md, CLAUDE.md
- **Tests Added/Modified:** 1 (test:e2e — boots Next dev on 3099, exercises 10-call free tier + block at 11)
- **Notes:** Stubbed `/api/tokens/validate`, `/api/gating/check`, `/api/gating/consume`, `/api/events`, and `/api/events/recent` (debug polling) in the existing web/ Next app. In-memory store using `Symbol.for` singleton survives Next HMR. All API routes pin `runtime = "nodejs"` for `node:crypto` token hashing. E2E test confirms: MCP server → gating API enforces 10/10 free tier → blocks 11th call with upgrade copy → events stored and readable via GET /api/events/recent. Phase 2 companion can now poll /api/events/recent during scaffolding before Supabase Realtime is wired.

### Session 2026-04-13 20:00 (MacBook)
- **Pattern:** V2 Phase 1 MCP server scaffold
- **Status:** Complete — alpha scaffold runs end-to-end
- **Files Changed:** package.json, tsconfig.json, .gitignore, CLAUDE.md, 15 new files in src/, 3 scripts
- **Tests Added/Modified:** 2 (test:mcp handshake, test:setup dry-run)
- **Notes:** Built the dwc V2 MCP server from scratch: hello-world + 7 real tools (design-brief, design-system-architect, color-specialist with HSL seed palette, typography-specialist with clamp scale, spacing-specialist, setup-guide, debug-helper). Wired gating/events stubs that fail-open until the dwc API lands. `npx designwithclaude setup|uninstall` supports user + project scope, prefers `claude mcp add-json`, falls back to direct config edits with backups. `claude mcp list` confirms designwithclaude: ✓ Connected. See PROGRESS.md for the next blocker (API stubs in web/).

### Session 2026-03-31 15:57 (MacBook)
### Session 2026-04-06 19:24 (MacBook)
- **Pattern:** Hero copy cleanup
- **Status:** Complete
- **Files Changed:** 1
- **Tests Added/Modified:** 0
- **Notes:** Removed technical guides sentence from hero subtitle, keeping copy focused on design expertise only.

### Session 2026-04-06 19:15 (MacBook)
- **Pattern:** Website and README updates
- **Status:** Complete
- **Files Changed:** 4
- **Tests Added/Modified:** 0
- **Notes:** Updated website with new "Technical Setup" category (8th category), 7 new skill cards with Heroicon mappings, and broadened hero subtitle copy. Updated README with new counts (37→44 agents, 45 total), Technical Setup command table, and technical guide usage examples.

### Session 2026-04-06 19:00 (MacBook)
- **Pattern:** Technical wall commands
- **Status:** Complete
- **Files Changed:** 8
- **Tests Added/Modified:** 0
- **Notes:** Added 7 new technical setup commands for designers getting unstuck while building: setup-guide, code-explainer, database-setup, environment-setup, auth-implementation, deploy-to-vercel, debug-helper. Updated design-brief.md with new Technical Setup section and bumped agent count to 44.

### Session 2026-04-01 19:10 (MacBook)
- **Pattern:** Newsletter, fonts, and learning CTA
- **Status:** Complete
- **Files Changed:** 16
- **Tests Added/Modified:** 0
- **Notes:** Added email capture newsletter section (proxies to aiuxdesign.guide subscriber list with new 'design-with-claude' source, Resend + Beehiiv dual-write). Swapped fonts from DM Serif/DM Sans to self-hosted Bevellier (titles) + Satoshi (body), kept DM Mono for code. Added Claude Code learning path CTA below install section linking to aiuxdesign.guide/guides/claude-code-learning-path. Cleaned up em dashes across all copy. Applied consistent letter-spacing and word-spacing to Bevellier headings.

- **Pattern:** General updates
- **Status:** Work in progress
- **Files Changed:** 22
- **Tests Added/Modified:** 4
- **Notes:** Added custom DWC icon (Claude hand + paint palette SVG) as favicon with prefers-color-scheme support and inline nav component. Added 8 new design skills: notification-designer, empty-loading-states-specialist, settings-designer, icon-illustration-specialist, i18n-designer, auth-security-ux-specialist, drag-drop-specialist, print-export-designer (29→37 specialists). Replaced unicode skill card icons with Heroicons (individual imports to avoid webpack issues). Fixed outdated website: install command (npx skills→curl), missing design-brief listing, stale SkillsMP copy, SKILL.md references. Updated README with new skill counts and tables.

### Session 2026-03-27 21:21 (MacBook)
