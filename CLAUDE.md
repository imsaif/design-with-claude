# design-with-claude

## Project Overview
**V2 alpha live (April 2026):** subscription product that configures Claude Code for designers via an MCP server, paired with a browser companion that renders command outputs live.
- Live web: https://www.designwithclaude.com (start at `/start`)
- npm package: `dwic-audit` (run: `npx dwic-audit`). Older names `@imrandwc/dwic` + `designwithclaude` are deprecated pointers to it — still owned, do not unpublish. Bare `dwic` unscoped is unpublishable (npm typosquat filter vs swig/twig).
- Persistence: Supabase (profiles + companion_events)
- See `PROGRESS.md` at the repo root for current state; `00-product-brief.md` + `0{1,2,3,4}-*.md` on Desktop for the canonical plan.

**V1 (still shipping):** 40+ specialized design skills as Claude Code slash commands, available as a plugin or standalone. `commands/*.md` stays intact — the V2 MCP server reuses those files as role prompts.

## Architecture
- **V2 MCP server (root):** TypeScript, ESM, `@modelcontextprotocol/sdk` over stdio. Tools live in `src/tools/`. Shared types in `src/tools/types.ts`. Six structured output kinds: palette, type-scale, spacing, component-spec, copy, markdown.
- **V2 install flow:** `npx dwic-audit setup --token=imr_xxx [--scope=user|project]` writes the MCP entry. Uses `claude mcp add-json` when available, falls back to direct `~/.claude.json` edit with timestamped backup, or `.mcp.json` at the cwd for project scope.
- **V2 gating:** Pre-call `/api/gating/check`, post-call `/api/gating/consume`. Fails open when `DWC_GATING` is off (dev/alpha default).
- **V2 events:** Post-call emit to `/api/events`. Payload shape defined in `src/api-client.ts` → `EventPayload`. The browser companion (Phase 2) subscribes via Supabase Realtime.
- **V1 plugin (unchanged):** `.claude-plugin/plugin.json` manifest; `commands/*.md` are the knowledge base for both V1 slash commands and V2 MCP tool role prompts. `/design-brief` is the master command.

## Key Files
- `package.json` (root) — npm package `dwic-audit`, bins: `dwic-audit` → `dist/bin/setup.js` (the `npx dwic-audit` entry — a dispatcher: bare/flag-first runs an audit, `setup`/`uninstall`/`help`/`version` route explicitly) + `dwic-mcp-server` → `dist/server.js` (MCP server, launched by the installed `.mcp.json` via `npx -p dwic-audit@<v> dwic-mcp-server`)
- `src/server.ts` — MCP server main; registers all tools; wraps handlers with gating + event emission
- `src/tools/index.ts` — tool registry
- `src/tools/types.ts` — `ToolDefinition`, `ToolResult`, output payload types
- `src/tools/loadPrompt.ts` — reads and caches `commands/*.md` role prompts
- `src/bin/setup.ts` — `npx dwic-audit setup` install flow
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

**Read `docs/SKILL-QUALITY-STANDARD.md` before writing or editing a command.** It is the
bar every command is held to, and it doubles as the build spec for new ones.

New commands follow the shape of `commands/design-grill.md` or `commands/design-triage.md`:
an evidence rule, a "skip this command when" block, a step-by-step procedure, a literal
output template, and a falsifiable "done when" condition.

The **legacy six-section template** below is what ~35 older commands still use. A
2026-08-14 audit of all 46 found it violates seven of the ten quality rules by
construction — no output format, no end condition, no skip rule, no severity cap, and it
states every rule three times (Guidelines, then Checklist, then Anti-patterns), which is
what let numeric thresholds drift apart inside a single file. **Do not use it for new
commands.**

```
## Expertise / ## Design Principles / ## Guidelines
## Checklist / ## Anti-patterns / ## How to respond / ## What to ask if unclear
```

Do NOT bulk-delete those sections from existing files: several use the Checklist as their
only stop condition, and some Anti-patterns (e.g. `motion-designer`'s `transition: all`)
are more actionable than the prose they appear to duplicate.

## Counts are generated, never typed

Skill counts appear in seven places and had drifted to four different numbers. Run
`npm run sync-counts` after adding or removing a command; `npm run build` fails on stale
counts. Never hand-edit a count.

## Naming Convention
Specialists use pure role-based names (`accessibility-specialist`, `motion-designer`).
The `design-` prefix marks commands that act on the design *process* rather than a domain:
`design-brief`, `design-system-architect`, `design-critic`, `design-grill`, `design-triage`.

## Known Issues & Learnings

- **The agent cannot see.** Commands must never instruct it to judge rendered appearance
  or runtime metrics from source. Every design command carries `## The evidence rule`;
  keep it when editing, and mark unrenderable claims `unverified — needs rendering`.
- **MCP tool names and slash command names differ for spacing.** The MCP tool is
  `spacing-specialist`; the slash command is `/spacing-layout-specialist`. The audit
  report's "Next steps" names the MCP tool, which free-library users do not have.
- **`commands/*.md` backs both products.** The same file powers the free slash command
  and the paid MCP specialist, so a command edit changes both.
- **Anything under `commands/` ships as a user-visible command.** Shared partials cannot
  live there — `commands/_shared/x.md` would appear as `/design-with-claude:_shared:x`.
- **Run the thing before believing it.** A 25-agent read of all 46 command files found no
  runtime bugs. The first end-to-end CLI run found one in 20 minutes (`dwic audit <path>`
  silently auditing the cwd). Reading prompts is not testing behaviour.
- **A command's mutating tail is where defects hide.** The reporting half gets the
  scrutiny; the "then fix" step appended after it inherits none of it. `/design-enforce`
  shipped able to replace a whole component with no checkpoint, and its "not violations"
  list contradicted the fixture it was built against — both in the tail, both missed by
  reading, both found in one run. When auditing a command, read its last section first.
- **Two fixtures, two jobs.** `examples/broken-project` has *broken tokens* and exercises
  `dwic audit`. `examples/detached-values` has *sound tokens the code ignores* and
  exercises `/design-enforce`. The audit reports the second one clean — that contrast is
  the point, so don't "fix" its tokens.

## Session History

Full per-session history lives in **`docs/SESSION-LOG.md`** (not auto-loaded, to keep this file lean).
`/save` appends a terse summary there. Read it only when you need historical context.
