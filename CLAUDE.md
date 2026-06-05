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

## Session History

Full per-session history lives in **`docs/SESSION-LOG.md`** (not auto-loaded, to keep this file lean).
`/save` appends a terse summary there. Read it only when you need historical context.
