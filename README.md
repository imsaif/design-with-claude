# Design with Claude

37 specialist agents + 1 master command — 38 design experts as Claude Code commands. Bring senior design expertise into every coding session.

No runtime. No dependencies. No API keys. Just markdown files that give Claude deep design knowledge.

[designwithclaude.com](https://designwithclaude.com)

## What This Is

A collection of 37 design agent files — each one a specialist in a specific design domain (accessibility, motion design, color theory, checkout flows, etc). Install them as a Claude Code plugin, and you get expert-level design guidance directly in your coding workflow.

Each agent contains structured domain knowledge: WCAG specifics, token architecture patterns, motion timing curves, healthcare UX compliance rules, checkout conversion best practices. This isn't generic "help me design" prompting — it's deep, opinionated expertise.

## Install

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

The master command analyzes your brief, identifies the relevant design domains (out of 37), and returns structured guidance — token recommendations, component specs, layout decisions, and implementation notes.

When invoked inside a code project, commands are context-aware: they detect your stack, read your existing files, and generate output that matches your conventions.

### Example Output

```
## Brief Analysis
"SaaS analytics dashboard with dark mode and accessibility focus"
Product type: B2B SaaS dashboard
Key requirements: data visualization, dark theme, WCAG AA compliance

## Relevant Domains (7 of 37)
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
| `design-brief` | Takes a natural language brief → identifies relevant agents → outputs comprehensive design guidance |

### Core Design

| Command | Use when... |
|---|---|
| `visual-hierarchy-specialist` | Layout, hierarchy, spacing, focal points |
| `interaction-designer` | User flows, states, gestures, feedback |
| `design-system-architect` | Tokens, component APIs, theming |
| `accessibility-specialist` | WCAG compliance, ARIA, keyboard nav |

### Visual Design

| Command | Use when... |
|---|---|
| `typography-specialist` | Type scales, font pairing, vertical rhythm |
| `color-specialist` | Color systems, palettes, semantic colors |
| `spacing-layout-specialist` | Grid systems, spacing scales, density |
| `icon-illustration-specialist` | Icon grids, sizing, illustration style, SVG accessibility |

### Interaction Design

| Command | Use when... |
|---|---|
| `motion-designer` | Transitions, timing curves, micro-interactions |
| `form-designer` | Input layout, validation, multi-step forms |
| `navigation-specialist` | Nav patterns, wayfinding, menus |
| `notification-designer` | Push notifications, toasts, badges, notification center |
| `drag-drop-specialist` | Drag affordances, drop zones, reordering, canvas |

### Product Design

| Command | Use when... |
|---|---|
| `dashboard-designer` | Data display, charts, KPI cards |
| `mobile-specialist` | iOS/Android patterns, touch, thumb zones |
| `responsive-design-specialist` | Breakpoints, fluid layouts, adaptive patterns |
| `landing-page-specialist` | Hero sections, CTAs, conversion layout |
| `settings-designer` | Settings pages, preferences, toggle patterns |
| `auth-security-ux-specialist` | Login flows, 2FA/passkey, session management |

### Specialized

| Command | Use when... |
|---|---|
| `dark-mode-specialist` | Dark theme tokens, surface hierarchy |
| `error-handling-specialist` | Error states, empty states, recovery flows |
| `onboarding-specialist` | First-run experience, progressive onboarding |
| `performance-specialist` | Skeleton screens, loading states, perceived speed |
| `data-visualization-specialist` | Chart types, axis design, data-ink ratio |
| `table-designer` | Data tables, sorting, filtering, pagination |
| `search-specialist` | Search UX, filters, faceted navigation |
| `healthcare-ux-specialist` | Clinical workflows, HIPAA, medical UI |
| `b2b-saas-specialist` | Enterprise patterns, multi-tenant, admin UIs |
| `ecommerce-specialist` | Product pages, cart, checkout flows |
| `checkout-specialist` | Cart UX, payment forms, trust signals |
| `brand-designer` | Visual identity, brand systems |
| `content-strategist` | Microcopy, tone of voice, content hierarchy |
| `information-architect` | Navigation, taxonomy, content structure |
| `conversational-ui-designer` | Chat interfaces, voice UI |
| `empty-loading-states-specialist` | Skeleton screens, empty states, loading patterns |
| `i18n-designer` | RTL layouts, locale-aware UI, string expansion |
| `print-export-designer` | PDF generation, print stylesheets, export UX |

## Examples

```bash
# Get a full design brief for a new product
/design-brief Healthcare patient portal with HIPAA compliance and mobile support

# Deep-dive into a specific domain
/accessibility-specialist Audit this login form for WCAG AA compliance
/design-system-architect Create a token architecture for our React component library
/motion-designer Define transition specs for our modal and dropdown components
/dashboard-designer Design a KPI overview page for a logistics platform

# Combine agents for thorough coverage
/form-designer Multi-step onboarding form with file uploads
/color-specialist Define a semantic color system for light and dark themes
/checkout-specialist Guest checkout flow for a subscription product
```

## How It Works

Each command file is a markdown document containing a specialized design agent's complete knowledge. When you invoke a command, Claude loads that agent as context — giving it deep, structured expertise in that domain.

There's no code running, no API calls, no build step. The `commands/` directory IS the product. Claude's intelligence does the rest.

## Alternative: Project-Local Commands

Copy commands into a single project:

```bash
cp -r ~/.design-with-claude/commands/ your-project/.claude/commands/
```

## Submit to Official Marketplace

This plugin can be submitted to the official Anthropic marketplace at:
- [claude.ai/settings/plugins/submit](https://claude.ai/settings/plugins/submit)
- [platform.claude.com/plugins/submit](https://platform.claude.com/plugins/submit)

## Contributing

### Adding a new agent

1. Create `agents/your-agent-name.md` following the structure of existing agents
2. Convert to a command in `commands/` with YAML frontmatter, role statement using `$ARGUMENTS`, expertise sections, response format, and clarifying questions
3. Add to the command table in this README and to `commands/design-brief.md`

## License

MIT — [designwithclaude.com](https://designwithclaude.com)
