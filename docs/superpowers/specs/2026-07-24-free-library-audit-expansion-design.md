# Free Library — Audit + Expansion + Level System

**Date:** 2026-07-24
**Branch:** `free-library-expansion` (off `origin/main`)
**Status:** Design — awaiting user review

## Context

The free library (`/library`, backed by `web/app/data/skills.ts` and `commands/*.md`) is
41 command files: the `design-brief` master router plus 40 design-domain specialists,
grouped into 8 domain categories. It is positioned as *"free Claude Code **design**
skills"* — deliberately separate from the paid **dwic** auditor.

Two audit passes (freshness + coverage) surfaced a small set of concrete defects and a
clear gap: the library has no "craft" skills (writing, critique, anti-slop, briefing) and
no way for users to sort by experience level. This spec covers three coordinated changes.

## Goals

1. **Fix** the concrete staleness/routing defects the audit found.
2. **Add** 4 new design-first craft skills as full peer skills, routed from `design-brief`.
3. **Add** a `level` (Beginner / Intermediate / Advanced) axis so users can sort skills by
   the design/product experience each assumes, cross-cutting the existing 8 categories.

## Non-goals (explicitly deferred to backlog)

Keeping this to one shippable batch. NOT in scope:

- Deepening the 5 thin files (`b2b-saas`, `ecommerce`, `brand-designer`,
  `information-architect`, `healthcare-ux`).
- Resolving the medium overlaps (e.g. `content-strategist`↔`error-handling`,
  `dashboard`↔`data-viz`, `responsive`↔`mobile`).
- The 6 additional coverage-gap skills (modals/overlays, notifications/toasts,
  email/transactional, design handoff, consent/privacy UI, iconography).
- A free "design review" skill — deliberately excluded because it would cannibalize the
  paid dwic auditor.

These are recorded in a **Backlog** section at the end for a future batch.

---

## Part A — Audit fixes

Grounded in the two audit passes. Each is a small, low-risk, high-confidence edit.

### A1. `design-brief.md` — fix the count and the broken routing (highest value)

- **Line 5** claims *"44 specialized design agents."* Wrong on every reading: directory
  has 41 files; the body catalog lists ~29. Rebuild the count from the actual files.
- The "Available Design Agents" catalog **omits 4 real command files** — so the master
  command cannot route to them: `auth-security-ux-specialist`, `drag-drop-specialist`,
  `i18n-designer`, `print-export-designer`.
- **Fix:** regenerate the full catalog from the real `commands/*.md` set, add the 4
  missing entries, add the 4 new skills (Part B), and correct the count to match. The
  count should be stated as a single source of truth (skill count), not a magic number.

### A2. `accessibility-specialist.md` — WCAG 2.1 → 2.2

- **Line 8** pins to *"WCAG 2.1 AA and AAA"*; 2.2 has been the recommendation since Oct
  2023 and the project's own `/accessibility` skill already says 2.2. Update to 2.2.
- Fix the touch-target contradiction: `accessibility-specialist.md:75` says `48x48
  (WCAG)`, `interaction-designer.md:34` says `44x44 (WCAG)`. Correct to WCAG 2.5.5 AAA =
  44×44 CSS px, and mention 2.2's new 24×24 minimum (2.5.8 AA). Make both files agree.

### A3. `setup-guide.md` — Node reference version

- **Line 20** validates against Node `v20.0.0`. Node 20 LTS is EOL as of April 2026.
  Bump the reference to current LTS (22 or 24), phrased so it does not re-rot quickly
  (e.g. "Node 22+ (any current LTS)").

### A4. Metadata normalization (trivial consistency)

- Lowercase `description:` frontmatter → capitalize first word in:
  `design-system-architect.md:2`, `interaction-designer.md:2`,
  `visual-hierarchy-specialist.md:2`.
- Normalize `## Your Expertise` → `## Expertise` in the 4 files that deviate
  (`accessibility-specialist`, `visual-hierarchy-specialist`, `interaction-designer`,
  `design-system-architect`), matching the template in CLAUDE.md.

**Out of scope for A:** `CLAUDE.md` also repeats "44 agents" — update it opportunistically
in the same batch since it is a one-line factual fix, but it is not a library file.

---

## Part B — 4 new craft skills

Each is a **full peer skill**: a `commands/<slug>.md` following the 8-section template
(Role / ## Expertise / ## Design Principles / ## Guidelines / ## Checklist /
## Anti-patterns / ## How to respond / ## What to ask if unclear), an entry in
`web/app/data/skills.ts`, and an entry in the `design-brief.md` routing catalog.

### B1. Anti-Slop Designer — `anti-slop-designer` (flagship)

- **Category:** `core` · **Level:** intermediate
- **Purpose:** Detect and fix the generic "AI-generated" look — the tells that make a UI
  read as machine-made. Both **visual** (purple/indigo gradients, glassmorphism
  everywhere, centered-hero-+-3-feature-cards, emoji bullet lists, identical rounded
  cards, default shadow stacks, unmodified component-library look) and **copy** (em-dashes,
  "seamless", "unlock", "elevate", "in today's fast-paced world", "we've got you covered").
- **Why it's the flagship:** most on-thesis with "a senior designer inside your terminal,"
  most shareable, best SEO ("avoid AI slop design"). Should be the strongest-written file.
- **Boundary:** it is a *taste/distinctiveness* skill, not a review tool — it teaches the
  designer + Claude to avoid the tells while building, it does not audit a finished product
  (that's the paid dwic auditor).

### B2. UI Copywriter — `ui-copywriter`

- **Category:** `content-ia` · **Level:** intermediate
- **Purpose:** Write human-sounding UI + marketing/landing copy — headlines, CTAs, value
  props, section copy — without the AI-copy tells.
- **Boundary vs neighbors (resolves an audit overlap):**
  - `content-strategist` = **in-product microcopy**: buttons, labels, errors, empty states,
    tooltips. (unchanged)
  - `ui-copywriter` = **marketing/landing voice**: headlines, hero copy, value props, plus
    the anti-AI-tells copy rules.
  - `brand-designer` = **visual identity** only. **Action:** strip its duplicated
    "Tone of Voice" section and cross-link to `content-strategist` + `ui-copywriter`.
  - Each file gets a one-line "for X, see Y" cross-reference so the boundary is explicit.

### B3. Design Critic — `design-critic`

- **Category:** `core` · **Level:** intermediate
- **Purpose:** An "honest critique, not praise" mode. Given a design/screenshot/description,
  respond with a real critique: rank problems by severity, say what's actually wrong and
  why, resist the agreeable default. Also: how to *receive* critique.
- **Boundary:** critique *method and posture* (how to push back well) — not a scored audit
  of a specific product (paid dwic).

### B4. Briefing Claude for Design — `briefing-claude`

- **Category:** `technical` · **Level:** beginner
- **Purpose:** The "reading/prompting" skill. How to brief Claude to get good UI:
  references, screenshots, constraints, what to paste, how to iterate, how to spot when
  Claude is guessing. Onboarding-adjacent — gets beginners to value fast.
- **Boundary vs `setup-guide`:** setup-guide = install the tools; briefing-claude = use
  them well once installed.

---

## Part C — Level system

### C1. Data model

Add a required field to the `Skill` interface in `web/app/data/skills.ts`:

```ts
export type SkillLevel = "beginner" | "intermediate" | "advanced";
export interface Skill {
  slug: string;
  name: string;
  description: string;
  category: CategoryId;
  level: SkillLevel;   // NEW — design/product experience the skill assumes
  icon: string;
}
```

- **Axis:** design/product experience assumed, **not** coding difficulty.
- **Single source of truth:** `skills.ts`. The `commands/*.md` frontmatter is NOT changed
  (avoids a second place to keep in sync). If level is ever needed server-side, derive it
  from `skills.ts`.
- The `design-brief` master is the entry point / router and is shown separately from the
  level filter ("Start here"), so it is not forced into a single tier. It still gets a
  `level` value for type-completeness (`beginner`) but the UI surfaces it as the router.

### C2. UI

- Add a level filter/toggle to `/library` alongside the existing category grouping —
  `SkillsDirectory` (`web/components/skills/SkillsDirectory.tsx`) gains an
  All / Beginner / Intermediate / Advanced control; each skill card shows a small level
  badge. Category grouping stays; level is an additional cross-cutting filter, not a
  replacement.
- Add a helper `getSkillsByLevel(level)` mirroring `getSkillsByCategory`.
- Update `/library` hero copy/stat row if it helps ("Sort by level" affordance).

### C3. Starting level assignment (user-overridable in review)

Heuristic: **Beginner** = getting-started + plain-language help + foundational visual
basics; **Intermediate** = domain craft most designers reach for; **Advanced** =
deep/systemic/niche/industry-specific.

**Beginner (10):** `design-brief` (router/start-here), `setup-guide`, `code-explainer`,
`environment-setup`, `debug-helper`, `deploy-to-vercel`, `briefing-claude` (new),
`visual-hierarchy-specialist`, `color-specialist`, `typography-specialist`.

**Intermediate (23):** `spacing-layout-specialist`, `form-designer`,
`navigation-specialist`, `motion-designer`, `content-strategist`,
`landing-page-specialist`, `dashboard-designer`, `mobile-specialist`,
`responsive-design-specialist`, `error-handling-specialist`, `onboarding-specialist`,
`table-designer`, `search-specialist`, `dark-mode-specialist`, `brand-designer`,
`accessibility-specialist`, `information-architect`, `checkout-specialist`,
`ecommerce-specialist`, `database-setup`, `anti-slop-designer` (new),
`ui-copywriter` (new), `design-critic` (new).

**Advanced (12):** `design-system-architect`, `interaction-designer`,
`data-visualization-specialist`, `conversational-ui-designer`,
`auth-security-ux-specialist`, `auth-implementation`, `drag-drop-specialist`,
`print-export-designer`, `i18n-designer`, `b2b-saas-specialist`,
`healthcare-ux-specialist`, `performance-specialist`.

Total = 45 entries (41 existing + 4 new). Counts: 10 / 23 / 12.

---

## Files touched

**New (`commands/`):** `anti-slop-designer.md`, `ui-copywriter.md`, `design-critic.md`,
`briefing-claude.md`.

**Edited (`commands/`):** `design-brief.md` (catalog + count + 4 missing + 4 new),
`accessibility-specialist.md` (WCAG 2.2, touch target, heading), `interaction-designer.md`
(touch target, heading, frontmatter case), `setup-guide.md` (Node), `brand-designer.md`
(strip tone section + cross-links), `content-strategist.md` (cross-link),
`design-system-architect.md` + `visual-hierarchy-specialist.md` (heading + frontmatter case).

**Edited (web):** `web/app/data/skills.ts` (level field + 4 new entries + `SkillLevel` +
`getSkillsByLevel`), `web/components/skills/SkillsDirectory.tsx` (level filter + badges),
possibly `web/app/library/page.tsx` (copy).

**Edited (root):** `CLAUDE.md` (drop "44 agents"), `PROGRESS.md` (session note at ship).

## Testing / verification

- `npx tsc --noEmit` in `web/` — the `Skill` interface change must not break consumers.
- `/library` renders; category grouping unchanged; level filter shows correct counts
  (10 / 23 / 12) and badges.
- `design-brief.md` catalog lists every real command file (44 skills + master) with no
  omissions and no phantom entries; count statement matches.
- Each new `commands/*.md` has all 8 template sections.
- Grep the tree for stale "44": no library-facing file still claims it.
- `getInstallCommand(slug)` produces valid raw-GitHub URLs for the 4 new slugs (they must
  be pushed to `main`/the served branch for install to work — note the branch dependency).

## Risks / open questions

- **Level assignment is subjective.** Mitigated: it's one data field, fully reversible,
  and the user reviews the table. Beginner/Intermediate/Advanced chosen over a custom
  taxonomy precisely because there are zero users yet to justify a bet.
- **Install URLs are branch-pinned.** `getInstallCommand` points at `main`. The 4 new
  files must land on the served branch before their install commands work — call this out
  at merge time.
- **`ui-copywriter` vs `content-strategist` boundary** must be enforced in the copy of both
  files, or the audit's existing overlap gets worse instead of better.

---

## Backlog (deferred, for a future batch)

- **Thin files to deepen:** `b2b-saas`, `ecommerce`, `brand-designer` (after tone strip),
  `information-architect`, `healthcare-ux`.
- **Overlaps to resolve:** `color`↔`dark-mode` (HIGH — color has a full dark-mode section),
  `content-strategist`↔`error-handling`, `dashboard`↔`data-viz`, `responsive`↔`mobile`,
  `navigation`↔`information-architect`.
- **New coverage gaps:** modals/overlays, notifications/toasts, email/transactional design,
  design handoff (Figma→code / token export), consent/privacy UI, iconography/imagery
  direction.
- **Explicitly rejected:** free generic "design review" skill (cannibalizes paid dwic).
