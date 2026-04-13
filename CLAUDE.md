# design-with-claude

## Project Overview
**V2 (in progress, April 2026):** subscription product that configures Claude Code for designers via an MCP server, paired with a browser companion that renders command outputs live. See `/Users/imranmohammed/Desktop/00-product-brief.md` and `/Users/imranmohammed/Desktop/dwc-docs/PROGRESS.md` for the canonical plan.

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
- **Pattern:** Skills directory page
- **Status:** Complete
- **Files Changed:** 15
- **Tests Added/Modified:** 0
- **Notes:** Built browsable skills directory as the new homepage. 29 skill cards with category filtering (7 categories), expand/collapse install commands with click-to-copy, ecosystem cross-links to aiuxdesign.guide and gist.design. Replaced old terminal-themed landing page. DM Serif/Sans/Mono fonts, lime accent (#c8f07a) design system. Removed legacy components (GettingStarted, Header, StatsBanner). Added @/ path alias to tsconfig.

### Session 2026-03-09 17:45 (MacBook)
- **Pattern:** SEO and discoverability
- **Status:** Complete
- **Files Changed:** 4
- **Tests Added/Modified:** 0
- **Notes:** Added OG/Twitter meta tags, canonical URL, keywords, and JSON-LD structured data to layout.tsx. Created dynamic sitemap.ts and robots.ts. Fixed manifest.json agent count (28→29). Still needs OG image (1200x630px) at public/og-image.png.

### Session 2026-03-09 17:09 (MacBook)
- **Pattern:** Repo cleanup and marketplace submission
- **Status:** Complete
- **Files Changed:** 100
- **Tests Added/Modified:** 0
- **Notes:** Removed all old CLI/MCP-era artifacts (bin/, src/, docs/, agents/, tests, package.json — 27,639 lines deleted). Added MIT LICENSE file. Updated GitHub repo description and homepage. Investigated marketplace submission: PRs to anthropics/claude-plugins-official are auto-closed — must use official form at claude.ai/settings/plugins/submit or platform.claude.com/plugins/submit.

### Session 2026-03-05 16:19 (MacBook)
- **Pattern:** Landing page update
- **Status:** Complete
- **Files Changed:** 2
- **Tests Added/Modified:** 0
- **Notes:** Rewrote landing page to reflect CLI→Claude Code plugin pivot. Updated metadata, HomeView (slash command examples), InstallView (3 install methods: plugin/standalone/project-local), and HowItWorksView (what you get, /design-brief example output, all 29 specialists grouped). Removed obsolete Phase 1-4 roadmap.

### Session 2026-03-04 20:06 (MacBook)
- **Pattern:** Plugin packaging and README polish
- **Status:** Complete
- **Files Changed:** 34
- **Tests Added/Modified:** 19
- **Notes:** Added `.claude-plugin/plugin.json` and `marketplace.json` for Claude Code plugin distribution. Moved commands from `.claude/commands/` to `commands/` at repo root (plugin convention). Fixed invalid `claude config add commandDirs` install command — replaced with `cp -r` to `~/.claude/commands/`. Fixed 29 vs 30 count inconsistency. Added designwithclaude.com link and example output to README. Updated GitHub repo topics from old CLI-era tags to `claude-code`, `claude-code-plugin`, `design-agents`, etc.

### Session 2026-03-04 19:42 (MacBook)
- **Pattern:** Claude Code plugin pivot
- **Status:** Complete
- **Files Changed:** 118
- **Tests Added/Modified:** 57
- **Notes:** Pivoted from MCP server/CLI architecture to Claude Code custom slash commands. Converted all 29 design agents from old format to `.claude/commands/` markdown files with YAML frontmatter. Adopted pure role-based naming convention. Created `/design-brief` master command. Rewrote README and CLAUDE.md to reflect the new markdown-only, no-runtime approach.
