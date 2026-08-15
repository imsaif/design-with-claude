---
name: design-with-claude
description: Use when design work needs a senior eye — auditing a codebase for design-system gaps, fixing WCAG contrast and unlabeled inputs, choosing type scales or spacing steps, reviewing UI that looks generic or AI-generated, or designing forms, tables, dashboards, navigation, checkout, onboarding, dark mode, and motion. Routes to 48 domain specialists. Pure markdown, no runtime dependencies.
---

# design with claude

A senior designer inside your terminal. Start by measuring, then route to the specialist who fixes what you measured.

## Start here: measure before you design

```bash
npx dwic-audit
```

Deterministic scan of the current project across 8 categories — color, typography, spacing, accessibility, forms, navigation, motion, copy. WCAG contrast math, token parsing, markup heuristics. Writes `.dwic/audit-<date>.md` and exits non-zero on errors, so it works in CI. Nothing leaves the machine.

Run this first when the request is vague ("improve our design", "is this any good?"). The findings tell you which specialist to invoke instead of guessing.

**Audit finding → specialist:**

| Audit category | Invoke |
|---|---|
| Color / contrast AA fails | `/color-specialist` |
| Typography off-scale | `/typography-specialist` |
| Spacing inconsistency | `/spacing-layout-specialist` |
| Accessibility failures | `/accessibility-specialist` |
| Unlabeled inputs, no fieldset | `/form-designer` |
| Navigation gaps | `/navigation-specialist` |
| `transition: all`, no reduced-motion | `/motion-designer` |
| Weak CTA, jargon | `/content-strategist` |

Or hand the whole report to `/design-triage` — it reads the newest `.dwic/audit-*.md`, ranks the findings by what costs most to leave broken (not by the audit's own severity order), and works the fix list in order. Use it when the audit returns a pile rather than one obvious problem.

## Not sure which specialist?

`/design-brief` takes a plain-language brief, routes to the right expertise, and returns structured guidance. Use it when the problem spans more than one domain.

## Review an existing UI

- `/design-critic` — severity-ranked critique, not reflexive praise. Use before shipping, or when feedback so far has been "looks great!"
- `/anti-slop-designer` — detects the generic AI-generated look in UI and copy. Use when a screen feels templated but you can't name why.
- `/accessibility-specialist` — WCAG 2.2, ARIA, keyboard nav, screen readers.

## Shape it before you build it

- `/design-grill` — interviews you until the design is pinned down, writing the shared vocabulary and the binding decisions into the repo as it goes. Use when decisions are being made that later sessions must obey; it is what stops session 4 reinventing session 1's button.
- `/information-architect` — navigation structure, taxonomy, labeling, wayfinding
- `/interaction-designer` — user flows, states, gestures, feedback, keyboard patterns
- `/content-strategist` — microcopy, error messages, empty states, tone
- `/brand-designer` — visual identity, logo usage, brand color, type as brand
- `/design-system-architect` — tokens, component APIs, variants, theming, governance

## Already have a design system?

`/design-enforce` checks whether the code actually **uses** it — raw values written where a token holds that exact value, numbers off the scale, components reinvented instead of reused, decisions in `.dwic/decisions/` that have been violated. The audit checks whether your token values are sound; this checks whether anything obeys them. Every finding is decided from source, so it needs no rendering.

## Foundations

`/visual-hierarchy-specialist` · `/typography-specialist` · `/color-specialist` · `/spacing-layout-specialist` · `/motion-designer` · `/responsive-design-specialist` · `/dark-mode-specialist`

## Components and patterns

`/form-designer` · `/table-designer` · `/navigation-specialist` · `/search-specialist` · `/dashboard-designer` · `/data-visualization-specialist` · `/drag-drop-specialist` · `/conversational-ui-designer` · `/error-handling-specialist` · `/onboarding-specialist` · `/performance-specialist` (perceived speed, skeletons, optimistic updates)

## Surfaces

`/landing-page-specialist` · `/checkout-specialist` · `/mobile-specialist` · `/print-export-designer` · `/i18n-designer`

## Domains

`/b2b-saas-specialist` · `/ecommerce-specialist` · `/healthcare-ux-specialist` · `/auth-security-ux-specialist`

## Copy

- `/ui-copywriter` — marketing and landing voice: headlines, hero, CTAs, value props, without AI tells
- `/content-strategist` — in-product microcopy and error messages

## For designers new to the terminal

- `/setup-guide` — install Node, Claude Code, first project
- `/environment-setup` — what `.env` is, what never goes to GitHub
- `/briefing-claude` — how to brief for good UI: references, screenshots, constraints, iterating instead of re-rolling
- `/code-explainer` — paste a file or error, get plain language back
- `/debug-helper` — paste an error, get the exact fix
- `/database-setup` · `/auth-implementation` · `/deploy-to-vercel` — working code, not just guidance

## When NOT to use

- Backend logic, data modelling, or infra with no interface
- A one-line CSS tweak you already know how to make
- When `npx dwic-audit` already reported clean and there is no specific design question

## Install

```bash
npx skills add imsaif/design-with-claude
```

Claude Code plugin: `/plugin marketplace add imsaif/design-with-claude`

MIT. Source: https://github.com/imsaif/design-with-claude
