# Field Notes — dwc on Imran AI Portfolio

**Derived actions:** Roadmap entries should be added to `ROADMAP_AUDIT_CLI.md` (or a new `ROADMAP_FROM_PORTFOLIO.md` if signal warrants).

**What this is:** A running product-research log captured while using `npx @imrandwc/dwic audit` to drive a design-system migration on the Imran AI Portfolio (`/Users/imranmohammed/imranaiportfolio`).

**Project context:** Next.js 13 + TS + Tailwind v3 portfolio. Migrating off a legacy purple `--accent: #7075e0` palette to the aiex navy `#162036` system to match the products being advertised (aiex, dwc, llmsgist). Multi-phase work — the audit was used to identify what to fix in Phase 1 and to verify after.

**Why it exists:** This is the audit-cli surface specifically (not MCP specialists). Cognition's notes covered specialist UX. This file covers `dwic audit` as a CLI used in a real migration.

**One entry per tool invocation.** Captured live during the session. Patterns aggregated at the top.

---

## Patterns across runs

### 1. Headline number can move the wrong way after a real fix
After porting from a 7-variable purple palette to a WCAG-considered aiex navy palette, the audit went from **29 → 30 color findings**. A user not paying close attention would conclude they made it worse. Two reasons:

- I added `--text-disabled #94a3b8` which legitimately fails AA on white (this is the *point* of disabled state — it shouldn't read as active). The audit can't tell intent.
- The legacy palette is still on disk, scoped under a `.legacy-tokens` class for case study pages (`/casestudy/*` had to keep the old look). The audit reads those vars at face value as if they're global.

**Roadmap implication:** Either (a) group findings by **scope** in the summary line ("29 fails: 5 in `:root`, 24 inside scoped classes"), or (b) accept ignore annotations (`/* dwic-ignore: scoped-legacy */`) so the count reflects intentional architectural choices.

### 2. No way to declare scoped tokens
The `.legacy-tokens` selector is a real, common pattern: legacy-system migration windows, theme variants, design-system layering, branded sections. The auditor reads any CSS variable as global and applies the same WCAG rules everywhere. There's no syntax to say "these vars only apply when this class is on an ancestor."

**Roadmap implication:** Parse the selector context of each var declaration. A var inside `.legacy-tokens { ... }` should be flagged separately ("28 of these are in scoped classes — likely intentional"). At minimum, group them visually.

### 3. Surface tokens flagged as text-contrast failures
Findings like `--card-bg #ffffff fails on #ffffff (ratio 1.00)` and `--white #ffffff fails on #ffffff` are structurally meaningless — these are surface tokens, not text-on-bg pairs. Including them inflates the count and trains users to skim past findings, which means real failures get missed.

**Roadmap implication:** Either (a) heuristic-classify token names (`bg`, `surface`, `border`, `divider`, `panel` → surface, skip text-contrast check), or (b) require an explicit `text-` / `bg-` prefix convention and only check pairs that make semantic sense. A coarse heuristic on naming is good enough for a 90% solution.

### 4. Same finding repeated per file inflates the count
`--optum-orange #ff6900` was flagged 3 times in the report — once per case-study CSS file that re-declares it. From the user's perspective it's one bad token in one design decision; the audit treats each occurrence as a separate finding. Across 8 CSS files this adds up fast.

**Roadmap implication:** First-occurrence-wins dedup on `(varname, value, bg)`. Show a count + file list per finding instead of one row per file. Closer to how a linter handles a violation that appears in 50 places.

### 5. The "What to do next" pointer assumes MCP setup
Audit output ends with: *"In Claude Code, ask color-specialist to: ..."*. But `color-specialist` requires the MCP install (`npx @imrandwc/dwic setup --token=...`). A first-time CLI-only user has no path from the suggestion to the action. Footer pitches setup but doesn't explicitly say "the suggestion above won't work without this."

**Roadmap implication:** Detect MCP install state at audit time. If not installed, change the next-step pointer to text-only actionable output ("Here's the smallest set of token edits that would clear the top 5 AA fails: ..."). If installed, link directly. Either way, never present a CTA the user can't execute.

### 6. Motion findings lack file:line locations
Color findings give the var name and the failing pair (great). Motion findings say `"23 animation/transition(s) longer than 1000ms"` — no path, no line. To act on it, I'd grep myself. Color is one level more actionable than motion.

**Roadmap implication:** Motion findings should include the same `file:line` attribution as color does for var names. The static analyser already has the location — surface it.

### 7. Borderline-noise warnings dilute the high-signal ones
`Typography: "no clamp() / fluid values detected — Fine for internal tools; consider fluid for marketing"` — the hedge means it shouldn't be a warning. Either it matters or it doesn't. Mixing "fine, but consider..." advice with real WCAG fails on the same severity tier teaches users to dismiss the whole report.

**Roadmap implication:** Three-tier severity is already there (error / warn / info). Re-classify hedge-language findings as info, reserve warn for "this is actually wrong." Or gate behind `--type=marketing` flag.

### 8. No "what changed" diff against baseline
The tool stores `baseline.json` and the summary says `↑ 1 new · → 26 unchanged`, which is great in principle. But a pure count diff doesn't tell me **which** finding is new. After my Phase 1 work I needed to read both reports side-by-side to understand whether things got better. A `dwic audit --diff` mode that lists added/removed/unchanged findings inline would close this loop.

**Roadmap implication:** First-class diff output. Should be the default after the second run. Could even drive a "regression detected" exit code for CI.

### 9. The summary undersells the real win
After my fix, the visible site looks substantially better — navy palette, proper Satoshi loading, tighter typography. The audit summary doesn't capture that. The first-run baseline doesn't include "% of color tokens passing AA in the main scope" or "% of fonts using `next/font`" or any positive-direction metric. Only failures.

**Roadmap implication:** Summary should include a **passing percentage**, not just a failing count. "27/35 color tokens pass AA (77%)" is a more honest framing than "29 fails." Same for typography (% with explicit line-height, % with fluid sizing if marketing).

### 10. CLI-first run quality is high
None of the above should obscure: `npx @imrandwc/dwic audit` ran with zero config, detected stack correctly, produced a useful markdown report, saved a baseline, and gave a clear next step. The 0-to-output time was well under 10 seconds. That's a high bar most audit tools miss. The friction is in the *interpretation* layer, not the *execution* layer.

---

## Entry log

### Entry 1 — 2026-05-05 — `dwic audit` (first run, baseline)

**Context:** Pre-migration. Portfolio still on legacy purple palette. Goal: get a snapshot of where we are before adopting aiex tokens.

**Command:** `npx @imrandwc/dwic audit`

**Output summary:**
- 8 CSS files / 177 components scanned
- Color: 29 AA fails (warn)
- Typography: 1 finding (no clamp(), warn)
- Motion: 4 findings (warn) — 23 animations >1000ms, 27 `transition: all`, 20 infinite
- Navigation: 1 finding (no `<nav>` landmark)
- Copy: 1 finding (longest "sentence" 1028 words — false positive, picked up a Next.js boilerplate code block)
- Accessibility: 2 info (no nav, no skip link)
- Spacing/Forms: clean
- Total: 38 findings, 0 errors, 35 warns, 3 info

**What I used it for:** Identifying which legacy variables to drop in Phase 1. Top offenders: `--accent-light`, `--accent-50/100/200/300`, `--button-secondary-hover`, `--optum-orange`, `--card-bg`, `--white`. All confirmed-removable (or scoped to case studies).

**What was useful:**
- Variable-name + failing-pair output was directly actionable for color.
- Knowing scope of motion debt (23 long animations, 20 infinite) gave me a sense of what a future Phase would tackle.

**What was friction:**
- Copy finding flagged a "1028-word sentence" — actually a code block from `app/page.tsx` (Next.js boilerplate). False positive, lost trust in the Copy category immediately.
- The "What to do next" pointed at `color-specialist` (MCP) without checking if I had it installed. → **Pattern 5.**

**Time to value:** ~15 seconds from `npx` to actionable list.

---

### Entry 2 — 2026-05-05 — `dwic audit` (post-migration)

**Context:** After porting aiex tokens, swapping featured projects, scoping legacy palette to case studies. Re-running to verify Phase 1 worked.

**Command:** `npx @imrandwc/dwic audit`

**Output summary:**
- 8 CSS files / 177 components scanned
- `Since last run: ↑ 1 new · → 26 unchanged · last run 18 minutes ago` ← **Most useful line in the whole report**
- Color: **30 AA fails** (was 29) — went up
- Typography, Motion, Navigation, Copy, A11y: unchanged from baseline
- Total: 39 findings (was 38)

**What I used it for:** Verifying the migration. Got back a confusing answer.

**What was useful:**
- The `↑ 1 new · → 26 unchanged` diff line. This is the moat — drift tracking. If a future commit introduces a new failing color token, this line will catch it.

**What was friction:**
- Headline went from 29 → 30 despite genuine improvement. → **Pattern 1.**
- Couldn't tell from the summary which finding is new (`↑ 1 new`). Had to manually compare both markdown reports. → **Pattern 8.**
- All my new aiex-token failures (`--text-disabled`, `--card-bg`, `--surface-primary`) flagged at the same severity as the legacy-palette failures I'd just gotten rid of. Audit can't distinguish "intentional design tradeoff" from "bug." → **Pattern 1, 3.**
- Most legacy `--accent-*` and `--optum-*` failures still flagged — they're now scoped under `.legacy-tokens`, but the audit doesn't know that. → **Pattern 2.**

**The honest user reaction:** "Did I just make it worse?" — followed by re-reading both reports for 5 minutes to confirm I hadn't. That's a UX bug. The user shouldn't have to do forensic comparison to know if a fix landed.

**Time to value:** ~15 seconds from command to output, but ~5 minutes of human time to *interpret* whether the change was good.

---

## Severity ranking — top 3 things to fix in dwic

If only 3 items make the roadmap from this session, in priority order:

1. **Diff output** (Pattern 8). After the second run, the user wants to know "what changed since last time." The summary's count diff is not enough. List added/removed/persisted findings inline. This is the single change that would make the second-run experience feel transformative.

2. **Scope-aware findings** (Patterns 1, 2). When a var is declared inside `.foo` instead of `:root`, label it differently in the report. Even just a `[scoped]` tag would help the user distinguish architectural tradeoffs from real bugs. Bonus: support an explicit `dwic-ignore` annotation for the disabled-state-on-white class of intentional tradeoffs.

3. **Surface vs text token classification** (Pattern 3). A naive heuristic on token names (`bg`, `surface`, `border`, `divider`, `panel`, `shadow` → surface) would eliminate the noisiest false-positives without any user input. ~5 lines of code, big payoff.

Lower priority but worth doing:

4. **Dedup findings across files** (Pattern 4) — count + file list per (var, value), not one row per file.
5. **Detect MCP install state and adapt next-step pointer** (Pattern 5) — never pitch a CTA the user can't execute.
6. **File:line for motion findings** (Pattern 6) — parity with color.
7. **Re-tier hedge-language warnings as info** (Pattern 7).
8. **Passing-percentage in summary** (Pattern 9).
