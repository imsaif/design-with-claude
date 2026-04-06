# design-with-claude

## Project Overview
29 specialized design agents packaged as Claude Code custom slash commands. Available as a Claude Code plugin or standalone commands — no runtime, no dependencies, no build step.

## Architecture
- **No code. Just markdown.** Each agent is a `.md` file with YAML frontmatter + structured design knowledge.
- Distributed as a Claude Code plugin via `.claude-plugin/plugin.json` manifest.
- Also installable standalone by copying `commands/` to `~/.claude/commands/`.
- `/design-brief` is the master command that routes a natural language brief to the relevant agents.

## Key Files
- `.claude-plugin/plugin.json` — Plugin manifest (name, version, metadata)
- `.claude-plugin/marketplace.json` — Marketplace catalog for plugin distribution
- `commands/*.md` — 29 agent commands + 1 master command (design-brief)
- `README.md` — Install instructions, command reference, examples
- `web/` — Landing page (designwithclaude.com)

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
