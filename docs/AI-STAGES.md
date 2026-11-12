# dwic commands by build step

The six steps come from Anthropic's *AI Fluency for Builders* course, "The Builder's Toolkit",
each with a rating for where AI stands. Draft mapping, 2026-11-11, for review.

| Step | Where AI stands | Commands | Count |
|---|---|---|---|
| Empathy | weak | design-empathy (added 2026-11-12) | 1 |
| Design | moderate | anti-slop-designer, auth-security-ux-specialist, b2b-saas-specialist, brand-designer, checkout-specialist, color-specialist, content-strategist, conversational-ui-designer, dark-mode-specialist, dashboard-designer, data-visualization-specialist, drag-drop-specialist, ecommerce-specialist, error-handling-specialist, form-designer, healthcare-ux-specialist, i18n-designer, interaction-designer, landing-page-specialist, mobile-specialist, motion-designer, navigation-specialist, onboarding-specialist, performance-specialist, print-export-designer, responsive-design-specialist, search-specialist, spacing-layout-specialist, table-designer, typography-specialist, ui-copywriter, visual-hierarchy-specialist | 32 |
| Architecture | moderate | design-brief, design-grill, design-system-architect, information-architect, briefing-claude | 5 |
| Implementation | strong | auth-implementation, code-explainer, database-setup, debug-helper, design-enforce, environment-setup, setup-guide | 7 |
| Judgment | weak | accessibility-specialist, design-critic, design-triage | 3 |
| Shipping | moderate | deploy-to-vercel, guide | 2 |

## What it shows

- The two steps where AI is weak held 3 of 49 commands, and Empathy had none. `design-empathy`
  (2026-11-12) fills that gap; design and research in `~/Desktop/dwic-design-empathy-design.md`.
- Two thirds of the library sits in Design, where AI is moderate.

## Calls worth a second look

- **accessibility-specialist** in Judgment, not Design: it checks whether a screen is good enough to ship.
- **design-grill** in Architecture: it fixes the shared vocabulary and decisions a system is built on. Arguably Empathy, but it interviews the designer, not users.
- **performance-specialist** in Design: it is about how fast a product *feels* (skeletons, optimistic updates), not code speed.
- **guide** in Shipping: it ends at a live URL, though it touches every step on the way.

## Pilot: building the step into the command

One command per AI rating:

- **design-critic** (Judgment, weak): Claude lists and ranks problems; the ship or don't-ship call goes back to the designer.
- **form-designer** (Design, moderate): Claude proposes patterns; the designer's context and taste decide.
- **debug-helper** (Implementation, strong): Claude acts freely, and stops only at destructive steps.

Each is run on a fixture before and after the change, and the outputs compared.

## Pilot result, 2026-11-11

Each command gained a `## Where AI stands` section. Two runs each, Sonnet, on fixtures in
`scripts/ai-stage-pilot/`.

| Command | Before | After |
|---|---|---|
| design-critic | 2/2 opened with "Verdict: don't ship this week" | 0/2 gave a verdict; 2/2 ended with `## Your call`, each blocker costed |
| form-designer | 2/2 cut six fields with no question; 1/2 invented "14-day trial, no credit card" | 2/2 kept every field and invented nothing; 2/2 listed the cuts under `## Your call` |
| debug-helper | 0/2 made the fix; 1/2 ended "Want me to make the change?" | 2/2 made the fix and reran the script to confirm it |

Two runs is enough to see the direction, not to claim a rate. The form test also shows the
trade-off: the "after" form is still ten fields long until the designer answers.
