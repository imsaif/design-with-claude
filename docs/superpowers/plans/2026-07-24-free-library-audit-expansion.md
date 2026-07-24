# Free Library Audit + Expansion + Level System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the free library's audit defects, add 4 design-first craft skills as full routed peer skills, and add a Beginner/Intermediate/Advanced level axis with a `/library` filter.

**Architecture:** The library has two synced surfaces — `commands/*.md` role-prompts (installed via raw GitHub URLs) and `web/app/data/skills.ts` (the `/library` display data). New skills touch both plus the `design-brief.md` router. The level system is a single new field in `skills.ts` (source of truth) surfaced by a cross-cutting filter in `SkillsDirectory.tsx`; command markdown frontmatter is NOT changed.

**Tech Stack:** TypeScript, Next.js (App Router) in `web/`, Markdown role-prompts in `commands/`.

**Spec:** `docs/superpowers/specs/2026-07-24-free-library-audit-expansion-design.md`

## Global Constraints

- **Level axis** = design/product experience the skill assumes, NOT coding difficulty.
- **Single source of truth for level** = `web/app/data/skills.ts`. Do NOT add level to `commands/*.md` frontmatter.
- **8-section template** for every role-skill (from CLAUDE.md): Role statement with `$ARGUMENTS` / `## Expertise` / `## Design Principles` / `## Guidelines` / `## Checklist` / `## Anti-patterns` / `## How to respond` / `## What to ask if unclear`.
- **WCAG version** = 2.2 (never 2.1). **Touch target** = 44×44 CSS px (WCAG 2.5.5 AAA), mention 24×24 min (2.5.8 AA, added in 2.2).
- **Node reference** = "Node 22+ (any current LTS)", never a pinned `v20.0.0`.
- **Final entry count** = 45 in `skills.ts` (41 existing + 4 new); level split = Beginner 10 / Intermediate 23 / Advanced 12.
- **Boundaries** between `ui-copywriter` ↔ `content-strategist` ↔ `brand-designer` must be written into ALL THREE files, not just one.
- **Match existing file voice/structure.** Read 2–3 existing `commands/*.md` before writing new ones. In the new anti-slop + copywriter content, treat em-dash overuse, "seamless/unlock/elevate", and "in today's fast-paced world" as named AI tells.
- **Install URLs are branch-pinned** to `main` via `getInstallCommand`. New slugs only install once merged to the served branch — note at merge, do not "fix" in code.
- Branch: `free-library-expansion`. Commit after every task.

---

### Task 1: Level data model + assignment in `skills.ts`

**Files:**
- Modify: `web/app/data/skills.ts`

**Interfaces:**
- Produces: `SkillLevel` type; `Skill.level: SkillLevel`; `getSkillsByLevel(level: SkillLevel): Skill[]`. Consumed by Task 2 (UI) and Tasks 4–7 (new entries).

- [ ] **Step 1: Add the type and interface field**

At the top of `skills.ts`, add after the `CategoryId` union:

```ts
export type SkillLevel = "beginner" | "intermediate" | "advanced";
```

Add `level` to the `Skill` interface (after `category`):

```ts
export interface Skill {
  slug: string;
  name: string;
  description: string;
  category: CategoryId;
  level: SkillLevel;
  icon: string;
}
```

- [ ] **Step 2: Assign `level` to all 41 existing entries**

Add a `level:` field to every existing `SKILLS` entry using this mapping (Global Constraints require these exact tiers):

- **beginner:** `design-brief`, `setup-guide`, `code-explainer`, `environment-setup`, `debug-helper`, `deploy-to-vercel`, `visual-hierarchy-specialist`, `color-specialist`, `typography-specialist` (9 of the final 10 — `briefing-claude` added in Task 7).
- **advanced:** `design-system-architect`, `interaction-designer`, `data-visualization-specialist`, `conversational-ui-designer`, `auth-security-ux-specialist`, `auth-implementation`, `drag-drop-specialist`, `print-export-designer`, `i18n-designer`, `b2b-saas-specialist`, `healthcare-ux-specialist`, `performance-specialist` (12).
- **intermediate:** every remaining existing entry (20 now; becomes 23 after Tasks 4–6 add anti-slop, ui-copywriter, design-critic).

- [ ] **Step 3: Add the `getSkillsByLevel` helper**

At the bottom, next to `getSkillsByCategory`:

```ts
export function getSkillsByLevel(level: SkillLevel): Skill[] {
  return SKILLS.filter((s) => s.level === level);
}
```

- [ ] **Step 4: Verify types compile**

Run: `cd web && npx tsc --noEmit`
Expected: no errors (every `Skill` literal now has `level`; a missing one fails here).

- [ ] **Step 5: Verify assignment counts**

Run: `cd web && node -e "const s=require('ts-node/register');" 2>/dev/null; grep -c 'level: "beginner"' app/data/skills.ts; grep -c 'level: "advanced"' app/data/skills.ts`
Expected: `9` beginner, `12` advanced (intermediate = remainder). If `ts-node` is unavailable, the two `grep -c` counts alone are the check.

- [ ] **Step 6: Commit**

```bash
git add web/app/data/skills.ts
git commit -m "feat(library): add SkillLevel field + getSkillsByLevel to skills data"
```

---

### Task 2: Level filter + badges in `SkillsDirectory`

**Files:**
- Modify: `web/components/skills/SkillsDirectory.tsx`
- Read first: `web/app/library/page.tsx`, `web/app/data/skills.ts`

**Interfaces:**
- Consumes: `SkillLevel`, `getSkillsByLevel`, `CATEGORIES`, `SKILLS` from Task 1.

- [ ] **Step 1: Read the current component**

Run: `cat web/components/skills/SkillsDirectory.tsx`
Note whether it is a Client Component (`"use client"`) and how it currently groups by category. Match that pattern; do not restructure category grouping.

- [ ] **Step 2: Add a level filter control**

Add a client-side `useState<"all" | SkillLevel>("all")`. Render an All / Beginner / Intermediate / Advanced segmented control above the category groups. When a level is active, filter each category group's skills to that level and hide empty category groups. `"all"` restores current behavior exactly. (If the component is currently a Server Component, split the interactive control into a small `"use client"` child rather than converting the whole tree.)

- [ ] **Step 3: Add a level badge to each skill card**

Render a small badge (text = capitalized level) on each card, styled with existing utility classes/tokens already used in this file. No new global CSS unless a class already exists.

- [ ] **Step 4: Verify build + render**

Run: `cd web && npx tsc --noEmit && npm run build 2>&1 | tail -5`
Expected: compiles; `/library` in the route list. (Do NOT run `npm run build` if a dev server is running — per project rule use `npx tsc --noEmit` alone in that case.)

- [ ] **Step 5: Manual render check**

Run: `cd web && npm run dev` then load `/library`; confirm the filter toggles, empty categories hide, badges show, and "All" matches the pre-change layout. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add web/components/skills/SkillsDirectory.tsx web/app/library/page.tsx
git commit -m "feat(library): level filter + level badges on /library"
```

---

### Task 3: Audit consistency fixes (non-router)

**Files:**
- Modify: `commands/accessibility-specialist.md` (WCAG 2.2, touch target, `## Expertise` heading, frontmatter case)
- Modify: `commands/interaction-designer.md` (touch target, `## Expertise` heading, frontmatter case)
- Modify: `commands/setup-guide.md` (Node version)
- Modify: `commands/design-system-architect.md` (`## Expertise` heading, frontmatter case)
- Modify: `commands/visual-hierarchy-specialist.md` (`## Expertise` heading, frontmatter case)
- Modify: `CLAUDE.md` (drop "44 agents")

- [ ] **Step 1: WCAG + touch target**

In `accessibility-specialist.md`: change `WCAG 2.1 AA and AAA` → `WCAG 2.2 AA and AAA`. Change the `48x48 (WCAG)` touch-target line to `44×44 CSS px (WCAG 2.5.5 AAA); 24×24 minimum (2.5.8 AA, new in 2.2)`. In `interaction-designer.md` ensure the touch-target line reads the same `44×44` value (remove any conflicting `48x48`).

- [ ] **Step 2: Node version**

In `setup-guide.md`, replace the `v20.0.0` check/reference with `Node 22+ (any current LTS)`. Keep surrounding walkthrough intact.

- [ ] **Step 3: Heading + frontmatter normalization**

In `accessibility-specialist.md`, `interaction-designer.md`, `design-system-architect.md`, `visual-hierarchy-specialist.md`: rename `## Your Expertise` → `## Expertise`. In the three files with lowercase `description:` frontmatter (`design-system-architect.md`, `interaction-designer.md`, `visual-hierarchy-specialist.md`), capitalize the first word.

- [ ] **Step 4: CLAUDE.md**

In `CLAUDE.md`, replace the `44 specialized design agents` phrasing with `40+ specialized design skills` (avoid a hard count that re-rots).

- [ ] **Step 5: Verify no stale values remain in these files**

Run: `grep -rn "WCAG 2.1\|48x48\|v20.0.0\|## Your Expertise" commands/accessibility-specialist.md commands/interaction-designer.md commands/setup-guide.md commands/design-system-architect.md commands/visual-hierarchy-specialist.md`
Expected: no matches.

- [ ] **Step 6: Commit**

```bash
git add commands/accessibility-specialist.md commands/interaction-designer.md commands/setup-guide.md commands/design-system-architect.md commands/visual-hierarchy-specialist.md CLAUDE.md
git commit -m "fix(library): WCAG 2.2, touch-target, Node LTS, heading/frontmatter normalization"
```

---

### Task 4: New skill — Anti-Slop Designer (flagship)

**Files:**
- Create: `commands/anti-slop-designer.md`
- Modify: `web/app/data/skills.ts` (add entry)

**Interfaces:**
- Produces: slug `anti-slop-designer`, category `core`, level `intermediate`.

- [ ] **Step 1: Read a peer file for voice/structure**

Run: `cat commands/visual-hierarchy-specialist.md commands/color-specialist.md`

- [ ] **Step 2: Write `commands/anti-slop-designer.md`**

Follow the 8-section template. Required content (make it the strongest-written file — this is the flagship):
- Frontmatter `description:` (capitalized): detecting and fixing the generic AI-generated look.
- Role statement with `$ARGUMENTS`, framed as a senior designer spotting machine-made tells.
- `## Expertise`: visual tells + copy tells + how to de-slop.
- `## Guidelines` MUST enumerate concrete **visual tells**: purple/indigo gradients, glassmorphism everywhere, centered-hero-+-3-feature-cards, emoji bullet lists, identical rounded cards, default shadow stacks, unmodified component-library defaults — each with the *fix*, not just the flag.
- `## Guidelines` MUST enumerate concrete **copy tells**: em-dash overuse, "seamless", "unlock", "elevate", "in today's fast-paced world", "we've got you covered" — with fixes.
- `## Anti-patterns`: applying it as blanket rules (e.g. "gradients are always bad") vs. contextual judgment.
- `## What to ask if unclear`: brand/reference context before de-slopping.
- **Boundary note in the file:** this is a taste/build-time skill, not a finished-product audit (that's paid dwic).

- [ ] **Step 3: Verify the 8 sections exist**

Run: `grep -c "^## " commands/anti-slop-designer.md` (expect ≥7 `##` sections) and `grep -n "## Expertise\|## Design Principles\|## Guidelines\|## Checklist\|## Anti-patterns\|## How to respond\|## What to ask" commands/anti-slop-designer.md`
Expected: all 7 `##` headings present (Role statement is the pre-`##` intro).

- [ ] **Step 4: Add the `skills.ts` entry**

Add to `SKILLS` in the Core Design group (pick an unused `ICONS` glyph or an explicit one):

```ts
{
  slug: "anti-slop-designer",
  name: "Anti-Slop Designer",
  description: "Spot and fix the generic AI-generated look — gradient/glassmorphism/hero-3-card tells and 'seamless/unlock/elevate' copy",
  category: "core",
  level: "intermediate",
  icon: "◆",
},
```

- [ ] **Step 5: Verify compile**

Run: `cd web && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add commands/anti-slop-designer.md web/app/data/skills.ts
git commit -m "feat(library): add Anti-Slop Designer skill"
```

---

### Task 5: New skill — UI Copywriter (+ boundary cleanup)

**Files:**
- Create: `commands/ui-copywriter.md`
- Modify: `commands/brand-designer.md` (strip duplicated Tone of Voice section, add cross-links)
- Modify: `commands/content-strategist.md` (add boundary cross-link)
- Modify: `web/app/data/skills.ts` (add entry)

**Interfaces:**
- Produces: slug `ui-copywriter`, category `content-ia`, level `intermediate`.

- [ ] **Step 1: Write `commands/ui-copywriter.md`**

8-section template. Scope = marketing/landing voice: headlines, hero copy, CTAs, value props, section copy — plus anti-AI-copy-tells rules (reuse the copy-tell list from anti-slop; reference it, do not fully duplicate). Include an explicit boundary line: *"For in-product microcopy (buttons, errors, empty states) use `/content-strategist`. For visual identity use `/brand-designer`."*

- [ ] **Step 2: Strip the overlap from `brand-designer.md`**

Remove `brand-designer.md`'s "Tone of Voice" section (the audit flagged it as a duplicate). Replace with a one-line pointer: *"Voice & copy: see `/content-strategist` (in-product) and `/ui-copywriter` (marketing)."* Keep all visual-identity content.

- [ ] **Step 3: Add boundary line to `content-strategist.md`**

Add near the top of `content-strategist.md`: *"Scope: in-product microcopy. For marketing/landing copy see `/ui-copywriter`; for visual identity see `/brand-designer`."*

- [ ] **Step 4: Verify sections + boundaries**

Run: `grep -c "^## " commands/ui-copywriter.md` (expect ≥7) and `grep -l "ui-copywriter" commands/content-strategist.md commands/brand-designer.md`
Expected: 7 sections; both existing files now reference `ui-copywriter`.

- [ ] **Step 5: Add the `skills.ts` entry** (Content & IA group)

```ts
{
  slug: "ui-copywriter",
  name: "UI Copywriter",
  description: "Human-sounding headlines, CTAs, and landing copy without the AI tells — the marketing-voice counterpart to microcopy",
  category: "content-ia",
  level: "intermediate",
  icon: "✍",
},
```

- [ ] **Step 6: Verify + commit**

```bash
cd web && npx tsc --noEmit && cd ..
git add commands/ui-copywriter.md commands/brand-designer.md commands/content-strategist.md web/app/data/skills.ts
git commit -m "feat(library): add UI Copywriter + resolve copy/tone overlap"
```

---

### Task 6: New skill — Design Critic

**Files:**
- Create: `commands/design-critic.md`
- Modify: `web/app/data/skills.ts` (add entry)

**Interfaces:**
- Produces: slug `design-critic`, category `core`, level `intermediate`.

- [ ] **Step 1: Write `commands/design-critic.md`**

8-section template. An "honest critique, not praise" mode: given a design/screenshot/description, rank problems by severity, state what's wrong and why, resist the agreeable default; plus how to *receive* critique. `## Anti-patterns`: sandwiching every criticism in praise; vague "looks great, maybe tweak spacing." Boundary line: this is critique *method/posture*, not a scored product audit (paid dwic).

- [ ] **Step 2: Verify sections**

Run: `grep -c "^## " commands/design-critic.md`
Expected: ≥7.

- [ ] **Step 3: Add the `skills.ts` entry** (Core Design group)

```ts
{
  slug: "design-critic",
  name: "Design Critic",
  description: "Honest design critique, not praise — ranks problems by severity and pushes back instead of agreeing",
  category: "core",
  level: "intermediate",
  icon: "⊗",
},
```

- [ ] **Step 4: Verify + commit**

```bash
cd web && npx tsc --noEmit && cd ..
git add commands/design-critic.md web/app/data/skills.ts
git commit -m "feat(library): add Design Critic skill"
```

---

### Task 7: New skill — Briefing Claude for Design

**Files:**
- Create: `commands/briefing-claude.md`
- Modify: `web/app/data/skills.ts` (add entry)

**Interfaces:**
- Produces: slug `briefing-claude`, category `technical`, level `beginner`. Completes the Beginner tier at 10.

- [ ] **Step 1: Write `commands/briefing-claude.md`**

8-section template (or the Technical Setup group's lighter format if matching its peers reads better — check `cat commands/setup-guide.md` first and match the group). Content: how to brief Claude for good UI — supplying references, screenshots, constraints; what to paste; how to iterate; how to spot when Claude is guessing. Boundary: `/setup-guide` installs the tools; this is using them well.

- [ ] **Step 2: Add the `skills.ts` entry** (Technical Setup group)

```ts
{
  slug: "briefing-claude",
  name: "Briefing Claude for Design",
  description: "How to brief Claude for good UI — references, screenshots, constraints, and iterating instead of re-rolling",
  category: "technical",
  level: "beginner",
  icon: "◔",
},
```

- [ ] **Step 3: Verify counts now total 45 / 10 / 23 / 12**

Run: `grep -c "slug:" web/app/data/skills.ts` (expect 45); `grep -c 'level: "beginner"' web/app/data/skills.ts` (expect 10); `grep -c 'level: "intermediate"' web/app/data/skills.ts` (expect 23); `grep -c 'level: "advanced"' web/app/data/skills.ts` (expect 12).

- [ ] **Step 4: Verify + commit**

```bash
cd web && npx tsc --noEmit && cd ..
git add commands/briefing-claude.md web/app/data/skills.ts
git commit -m "feat(library): add Briefing Claude for Design skill"
```

---

### Task 8: Rebuild `design-brief.md` router catalog

**Files:**
- Modify: `commands/design-brief.md`

**Interfaces:**
- Consumes: all `commands/*.md` slugs including the 4 created in Tasks 4–7.

- [ ] **Step 1: Enumerate the real command set**

Run: `ls commands/*.md | sed 's#commands/##;s#.md##' | sort`
This is the authoritative list. The router catalog must include every design/craft skill (exclude only the Technical Setup group if the current file already excludes it — match existing scope) and MUST add the 4 previously-omitted files (`auth-security-ux-specialist`, `drag-drop-specialist`, `i18n-designer`, `print-export-designer`) plus the 4 new skills.

- [ ] **Step 2: Rewrite the "Available Design Agents" catalog and fix the count**

Regenerate the grouped catalog from the `ls` output. Replace the line 5 claim `backed by 44 specialized design agents` with wording that matches the real count (state it as "the design skill library" or the actual number derived from the list — do not invent a number).

- [ ] **Step 3: Verify every non-technical command appears in the catalog**

Run: `for f in $(ls commands/*.md | sed 's#commands/##;s#.md##'); do grep -q "$f" commands/design-brief.md || echo "MISSING: $f"; done`
Expected: no `MISSING:` lines for design/craft skills. (Technical Setup slugs may be intentionally absent — confirm against the file's existing scope.)

- [ ] **Step 4: Confirm no phantom "44"**

Run: `grep -n "44" commands/design-brief.md`
Expected: no "44 agents" claim remains.

- [ ] **Step 5: Commit**

```bash
git add commands/design-brief.md
git commit -m "fix(library): rebuild design-brief router catalog + correct skill count"
```

---

### Task 9: Full-tree verification

**Files:** none (verification only)

- [ ] **Step 1: No stale "44" anywhere library-facing**

Run: `grep -rn "44 specialized\|44 design\|44 agents" commands/ web/ CLAUDE.md`
Expected: no matches.

- [ ] **Step 2: Types + build**

Run: `cd web && npx tsc --noEmit` (and `npm run build 2>&1 | tail -5` if no dev server is running)
Expected: clean compile; `/library` present.

- [ ] **Step 3: Level counts final**

Run: `grep -c 'level: "beginner"' web/app/data/skills.ts; grep -c 'level: "intermediate"' web/app/data/skills.ts; grep -c 'level: "advanced"' web/app/data/skills.ts`
Expected: `10`, `23`, `12`.

- [ ] **Step 4: All 4 new command files have the template sections**

Run: `for f in anti-slop-designer ui-copywriter design-critic briefing-claude; do echo "$f: $(grep -c '^## ' commands/$f.md) sections"; done`
Expected: each ≥7 (briefing-claude may differ if it matches the lighter Technical Setup format — acceptable).

- [ ] **Step 5: Install-URL sanity for new slugs**

Confirm `getInstallCommand("anti-slop-designer")` etc. resolve to `.../main/commands/<slug>.md`. Note in the PR/merge summary that these 404 until merged to `main`.

- [ ] **Step 6: Update PROGRESS.md + finish**

Add a short session note to `PROGRESS.md` (and let `/save` handle SESSION-LOG). Commit:

```bash
git add PROGRESS.md
git commit -m "docs(progress): free library audit + 4 craft skills + level system"
```

Then use `superpowers:finishing-a-development-branch` to choose merge/PR.

---

## Self-Review

**Spec coverage:**
- Part A audit fixes → Tasks 3 (A2/A3/A4) + 8 (A1). ✓
- Part B 4 new skills → Tasks 4–7, routing in Task 8, brand/content boundary in Task 5. ✓
- Part C level system → Task 1 (data) + Task 2 (UI) + assignments across 1/4/5/6/7. ✓
- Non-goals (thin files, overlaps beyond tone, gap skills, design-review) → correctly absent. ✓

**Placeholder scan:** No "TBD/handle edge cases". New-skill tasks give explicit required content lists rather than finished prose (intentional per the plan preamble — these are creative role-prompts, not code). ✓

**Type consistency:** `SkillLevel`, `Skill.level`, `getSkillsByLevel` used identically in Tasks 1, 2, 4–7. Counts reconcile: 9 beginner (T1) + 1 (T7) = 10; 20 intermediate (T1) + 3 (T4/5/6) = 23; 12 advanced = 12; total 45. ✓
