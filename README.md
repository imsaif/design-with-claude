# dwic — a senior designer inside your terminal

dwic (design with claude) puts a senior designer inside Claude Code. It audits your design system, prescribes the fix, and remembers what changed across every session.

## The one-line audit

```
npx dwic-audit
```

No token, no install, no Claude Code required; your code never leaves your machine. dwic scans your project, prints a dashboard of design-system gaps across 8 categories (color, typography, spacing, accessibility, forms, navigation, motion, copy), and writes a shareable markdown report to `.dwic/audit-<date>.md`. The check is deterministic (WCAG contrast math, token parsing, markup heuristics), so it's reproducible and CI-friendly via its exit code. Run against a deliberately-broken fixture:

```
dwic audit • examples/broken-project
Scanned: 2 CSS files · 1 component · Next.js 15 + Tailwind v4

  ✗ Fix before you ship — 8 of 9 errors are accessibility failures
    Accessibility   6 findings    unlabeled inputs, heading order, no landmarks
    Color           3 AA fails    contrast below WCAG AA
    ↳ WCAG AA / EU Accessibility Act (in force since June 2025) treats these as compliance failures.

  Then clean up
    Typography      3 findings    sizes off the scale, weak weights
    Motion          5 findings    transition: all, no reduced-motion
    Forms           4 findings    unlabeled input, missing <fieldset>
    Copy            3 findings    weak CTA, jargon

  Clean
    Spacing         clean         7 steps
    Navigation      clean

  8 categories · 24 findings · error 9 · warn 10 · info 5  ·  exit 2 — fails CI
```

`dwic audit` pings an anonymous counter on each run so we can see the CLI → MCP funnel. Pass `--no-telemetry` or set `DWIC_TELEMETRY=off` to disable; the payload is category-level counts only (no file contents, no paths).

## Inside Claude Code

Install the MCP server and the senior designer works interactively. Ask the specialists (`color-specialist`, `accessibility-specialist`, `typography-specialist`, and the rest) to audit or fix, and dwic remembers your project's decisions across sessions instead of re-asking every time.

```
npx dwic-audit setup --token=imr_xxx
```

Get a token at [designwithclaude.com/get-started](https://designwithclaude.com/get-started). For full usage docs, start there.

---

## The free library — dwic's open knowledge base

This repo also ships **47 design skills across 8 categories** (39 design specialists and 8 technical guides for designers) as plain Claude Code slash commands. No runtime, no dependencies, no API keys. Browse them at [designwithclaude.com/library](https://designwithclaude.com/library).

These aren't a separate product. They're the **same knowledge base dwic runs on**. Each specialist's expertise lives in a markdown role prompt under `commands/`, and dwic's MCP specialists load those exact files. When you ask dwic's `color-specialist` inside Claude Code, its expertise comes from the same `commands/color-specialist.md` that the free `/color-specialist` slash command loads.

The difference is the runtime around them. dwic wires **12 of these specialists** as MCP tools and adds what plain prompts can't: a deterministic audit engine, project memory, and the one-line CLI. The rest of the library is free to drop into Claude Code as slash commands today.

Each command is a specialist file containing structured domain knowledge: WCAG specifics, token architecture patterns, motion timing curves, healthcare UX compliance rules, checkout conversion best practices. The technical guides help designers get unstuck with common walls — environment setup, database connections, auth, deployment, and error debugging. This isn't generic prompting — it's deep, opinionated expertise.

## Install the library

### With the skills CLI

Works in Claude Code, Cursor, Cline, Gemini CLI, Antigravity and others — no Claude Code required:

```bash
npx skills add imsaif/design-with-claude
```

### As a Plugin (recommended)

```bash
# Add the marketplace
/plugin marketplace add imsaif/design-with-claude

# Install the plugin
/plugin install design-with-claude@design-with-claude
```

Commands are namespaced: `/design-with-claude:design-brief`, `/design-with-claude:accessibility-specialist`, etc.

### As Standalone Commands

If you prefer shorter command names (no namespace prefix):

```bash
# Clone the repo
git clone https://github.com/imsaif/design-with-claude.git ~/.design-with-claude

# Copy commands to your user-level commands directory
cp -r ~/.design-with-claude/commands/ ~/.claude/commands/
```

This gives you `/design-brief`, `/accessibility-specialist`, etc. directly.

## Quick Start

```
/design-brief Build a SaaS analytics dashboard with dark mode and accessibility focus
```

The master command analyzes your brief, identifies the relevant design domains (out of 46), and returns structured guidance — token recommendations, component specs, layout decisions, and implementation notes.

When invoked inside a code project, commands are context-aware: they detect your stack, read your existing files, and generate output that matches your conventions.

### Example Output

```
## Brief Analysis
"SaaS analytics dashboard with dark mode and accessibility focus"
Product type: B2B SaaS dashboard
Key requirements: data visualization, dark theme, WCAG AA compliance

## Relevant Domains (7 of 45)
1. Dashboard Designer — KPI cards, chart layout, data density
2. Dark Mode Specialist — surface hierarchy, elevation tokens, contrast
3. Accessibility Specialist — WCAG AA, focus management, screen readers
4. Data Visualization Specialist — chart selection, color-blind palettes
5. Design System Architect — dark/light token architecture
6. Color Specialist — semantic colors with dark mode variants
7. Typography Specialist — data-dense type scale, monospace for numbers

## Token Recommendations
--surface-primary: hsl(220 20% 10%)     /* main background */
--surface-secondary: hsl(220 18% 14%)   /* card surfaces */
--surface-elevated: hsl(220 16% 18%)    /* modals, dropdowns */
--text-primary: hsl(220 10% 93%)        /* high-emphasis text */
--accent-primary: hsl(210 100% 60%)     /* interactive elements */
--data-series-1: hsl(210 90% 60%)       /* chart color 1 */
...

## Component Recommendations
- KPI cards: icon + metric + trend + sparkline, 4-column grid
- Charts: use accessible palette with pattern fills for color-blind users
- Tables: sticky headers, alternating row contrast ≥ 3:1
- Navigation: sidebar with collapsible sections, active state at ≥ 4.5:1

## Implementation Notes
- Dark mode as default, light mode as toggle (not vice versa)
- All interactive elements need visible focus rings (2px solid, offset 2px)
- Chart tooltips must be keyboard-accessible (not hover-only)
- Minimum touch target: 44x44px for any clickable element
```

## Commands

### Master Command

| Command | What it does |
|---|---|
| `design-brief` | Takes a natural language brief → identifies relevant specialists → outputs comprehensive design guidance |

### Core Design

| Command | Use when... |
|---|---|
| `visual-hierarchy-specialist` | Layout, hierarchy, spacing, focal points |
| `interaction-designer` | User flows, states, gestures, feedback |
| `design-system-architect` | Tokens, component APIs, theming |
| `accessibility-specialist` | WCAG compliance, ARIA, keyboard nav |
| `anti-slop-designer` | Spotting and fixing the generic AI-generated look |
| `design-critic` | Honest, severity-ranked design critique instead of praise |

### Visual Design

| Command | Use when... |
|---|---|
| `typography-specialist` | Type scales, font pairing, vertical rhythm |
| `color-specialist` | Color systems, palettes, semantic colors |
| `spacing-layout-specialist` | Grid systems, spacing scales, density |

### Interaction Design

| Command | Use when... |
|---|---|
| `motion-designer` | Transitions, timing curves, micro-interactions |
| `form-designer` | Input layout, validation, multi-step forms |
| `navigation-specialist` | Nav patterns, wayfinding, menus |
| `drag-drop-specialist` | Drag affordances, drop zones, reordering, canvas |

### Product Design

| Command | Use when... |
|---|---|
| `dashboard-designer` | Data display, charts, KPI cards |
| `mobile-specialist` | iOS/Android patterns, touch, thumb zones |
| `responsive-design-specialist` | Breakpoints, fluid layouts, adaptive patterns |
| `landing-page-specialist` | Hero sections, CTAs, conversion layout |
| `auth-security-ux-specialist` | Login flows, 2FA/passkey, session management |

### Content & IA

| Command | Use when... |
|---|---|
| `content-strategist` | Microcopy, tone of voice, content hierarchy |
| `information-architect` | Navigation, taxonomy, content structure |
| `conversational-ui-designer` | Chat interfaces, voice UI |
| `ui-copywriter` | Headlines, CTAs, and landing copy that sound human |

### Industry

| Command | Use when... |
|---|---|
| `healthcare-ux-specialist` | Clinical workflows, HIPAA, medical UI |
| `b2b-saas-specialist` | Enterprise patterns, multi-tenant, admin UIs |
| `ecommerce-specialist` | Product pages, cart, checkout flows |
| `checkout-specialist` | Cart UX, payment forms, trust signals |

### Specialized

| Command | Use when... |
|---|---|
| `dark-mode-specialist` | Dark theme tokens, surface hierarchy |
| `error-handling-specialist` | Error states, recovery flows |
| `onboarding-specialist` | First-run experience, progressive onboarding |
| `performance-specialist` | Skeleton screens, loading states, perceived speed |
| `data-visualization-specialist` | Chart types, axis design, data-ink ratio |
| `table-designer` | Data tables, sorting, filtering, pagination |
| `search-specialist` | Search UX, filters, faceted navigation |
| `brand-designer` | Visual identity, brand systems |
| `i18n-designer` | RTL layouts, locale-aware UI, string expansion |
| `print-export-designer` | PDF generation, print stylesheets, export UX |

### Technical Setup

| Command | Use when... |
|---|---|
| `setup-guide` | Installing Node, Claude Code, creating first project |
| `code-explainer` | Understanding any file or error in plain language |
| `database-setup` | Setting up Supabase — tables, queries, frontend connection |
| `environment-setup` | .env files, API keys, what never to commit |
| `auth-implementation` | Adding login/signup with Clerk or Supabase Auth |
| `deploy-to-vercel` | Getting your project live, fixing build errors |
| `debug-helper` | Pasting any error, getting the exact fix |
| `briefing-claude` | How to brief Claude for good UI: references, screenshots, constraints |

## Examples

```bash
# Get a full design brief for a new product
/design-brief Healthcare patient portal with HIPAA compliance and mobile support

# Deep-dive into a specific domain
/accessibility-specialist Audit this login form for WCAG AA compliance
/design-system-architect Create a token architecture for our React component library
/motion-designer Define transition specs for our modal and dropdown components
/dashboard-designer Design a KPI overview page for a logistics platform

# Combine specialists for thorough coverage
/form-designer Multi-step onboarding form with file uploads
/color-specialist Define a semantic color system for light and dark themes
/checkout-specialist Guest checkout flow for a subscription product

# New design skills
/auth-security-ux-specialist Passkey login flow with 2FA fallback
/drag-drop-specialist Kanban board with drag between columns and keyboard support

# Technical guides — get unstuck
/setup-guide I've never used a terminal before, help me set up Claude Code
/debug-helper Error: Cannot read properties of undefined (reading 'map')
/database-setup I need to store user submissions in a database
/deploy-to-vercel My build is failing with "Module not found"
/auth-implementation Add Google login to my Next.js app
/environment-setup What's a .env file and why do I need one?
/code-explainer What does this middleware.ts file do?
```

## How It Works

Each command file is a markdown document containing a design specialist's complete knowledge. When you invoke a command, Claude loads that specialist as context — giving it deep, structured expertise in that domain.

There's no code running, no API calls, no build step. The `commands/` directory IS the product. Claude's intelligence does the rest.

## Alternative: Project-Local Commands

Copy commands into a single project:

```bash
cp -r ~/.design-with-claude/commands/ your-project/.claude/commands/
```

## Contributing

### Adding a new skill

1. Create `commands/your-skill-name.md` with YAML frontmatter (`description` field) and a role statement using `$ARGUMENTS`
2. Follow the structure of existing commands: Expertise, Design Principles, Guidelines, Checklist, Anti-patterns, How to respond, What to ask if unclear
3. Add to the command table in this README and to `commands/design-brief.md`

## License

MIT — [designwithclaude.com](https://designwithclaude.com)
