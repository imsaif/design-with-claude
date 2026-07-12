# Study #2 — The agentic terminal workflow, by the numbers

**Status:** methodology spec (locked design; pilot numbers to be firmed up)
**Date:** 2026-07-11
**Working title:** *"Two years ago, nobody worked this way. Now hundreds of thousands do."*
(alt: "Building in the terminal, by the numbers" · "The agentic terminal workflow, measured")
(Note: ~770K is the *file* union — files ≠ repos ≠ people. Headline must not claim a repo/people count.)

---

## 1. The question

How large, how new, and how UI-heavy is the **config-driven agentic coding workflow** —
people directing an AI agent from the terminal via a committed instruction file
(`CLAUDE.md`, `AGENTS.md`, Cursor/Windsurf/Cline/Aider rules)?

It answers the reader's gut question — *"am I the only one building this way?"* — with data,
and sizes the slice that matters to dwic: **the people building UI this way.**

## 2. The claim we make — and the claims we DON'T

**We claim (defensible):**
- The *committed agent-config* convention is **new** — effectively nonexistent before 2024, exploding 2025–26.
- It is **large** — hundreds of thousands of repos carry one.
- A **meaningful minority (~1 in 4)** of these repos are building UI/frontends.

**We explicitly DO NOT claim:**
- ❌ A precise headcount of *people* (fingerprints are files, not humans).
- ❌ That this is *all* AI-assisted work. It is a **lower bound** — see the ceiling below.
- ❌ Precise multipliers. All magnitudes are **directional** ("~", ranges), never "X.Y×".
- ❌ Anything about *designers vs developers* as roles — we measure **what repos build**, not job titles.

## 3. The honest ceiling (must be stated prominently)

Repo fingerprints only see the workflow **once someone commits an agent-config file**.
AI-assisted shipping that predates the convention — **Copilot (2021), ChatGPT (late 2022),
Cursor autocomplete (2023)** — leaves **zero repo trace**. So:
> Every number here is a **floor**. The real movement is older and larger than the fingerprints
> can show; we measure the part that leaves evidence.

This limitation is a feature, not a bug: stating it up front is what makes the rest credible.

## 4. Method (reproducible — this IS the brand promise)

**Denominator — pick ONE and stick to it:** *repos containing at least one agent-config file*,
where an agent-config file is any of:
`CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.cursor/rules/*`, `.windsurfrules`, `.clinerules`, `.aider.conf.yml`.
(Do NOT mix in `.claude/` file counts — that counts files-per-repo and inflates.)

**Counts (scale):** GitHub code-search `total_count` per fingerprint. Report as *approximate* —
`total_count` is volatile (observed `CLAUDE.md` at 589,824 and 593,920 on different runs) and
counts *files on indexed default branches*, not unique repos. Present as "hundreds of thousands," not a false-precision figure.

**Adoption curve (the hero):** for a sample of repos per fingerprint, take the **first-commit date
of the config file** (`git log`, oldest commit touching the path) — NOT repo creation date.
Bucket by quarter. (Repo-creation date is invalid — a 2021 repo that added `CLAUDE.md` last month
lands in 2021 and GitHub's rising baseline inflates recent years.)

**Frontend slice:** for a sample of unique repos, classify UI vs not:
- `package.json` deps include `react`/`react-dom`/`next`/`vue`/`svelte`/`@angular/core`/`astro`/`nuxt`/`solid-js`/`tailwindcss`/`@radix-ui`/`vite` → **frontend**
- primary language `HTML`/`CSS`/`Vue`/`Svelte`/`Astro` (static sites, no package.json) → **frontend**
- else → non-frontend
Report as a **range with an error bar and n**, method stated. (Pilot: 12% at n=90 → 24% at n=260,
counting static sites — the instability itself is disclosed.)

**Sampling caveat (state it):** GitHub code search is relevance-ranked and caps at 1,000 results —
NOT a random sample. Numbers are directional; a larger, multi-fingerprint sample tightens them.

## 5. Findings (firmed — 2026-07-12 pass; raw in `agentic-terminal-sample.csv`)

**Scale — config-file footprint (GitHub code-search `total_count`, approximate/volatile):**

| Fingerprint (files) | Count | Share |
|---|---|---|
| `CLAUDE.md` | ~590K | ~76% |
| `AGENTS.md` | ~150K | ~19% |
| `.cursor/rules` ~15K · `.cursorrules` ~6K · `.windsurfrules` ~4K · `.clinerules` ~3K · `.aider.conf.yml` ~1K | ~29K | ~4% |
| **Union** | **~770K files** (≈96% Claude Code + AGENTS.md) | — |

**Frontend slice (n=278 classified, union sample):**
- **63 / 278 = 23% build UI** (±5pp, 95% CI ≈ **18–28%**). Held steady across passes (12%@n90 → 24%@n260 → 23%@n278). This is the firmed "**~1 in 4**".

**Adoption curve — first-commit of the config file, by quarter (n=278):**
```
2025Q2   9      2025Q4  29      2026Q2  109
2025Q3   23     2026Q1  103     2026Q3   5 (July, partial)
```
Near-zero before 2025Q2; the takeoff is **2025Q4→2026Q1 (29→103, ~3.5×)**; 2026 half-over already ≈3.5× all of 2025.

**Sampling note (honest):** the classified sample skewed **CLAUDE.md (237) + AGENTS.md (41)** — the Cursor/Windsurf/Cline repos sat at the pool tail and were cut by the 360-cap. So the curve represents the **dominant conventions' adoption** (which *is* ~96% of the footprint, so representative). Pilot data shows a small earlier **Cursor tail from 2024** — state it as pre-history, don't erase it. The curve reflects the config-file conventions, which are themselves a 2024→2026 phenomenon; per §3, real AI-assisted work predates all fingerprints.

## 6. Findings structure (what the page presents)

1. **Hero: the adoption curve** — union agent-config first-commit dates by quarter, 2023→now. The takeoff-from-nothing.
2. **Scale stat tiles** — total footprint (hundreds of thousands), tool composition, frontend share (range).
3. **The UI slice** — ~1 in 4 build interfaces → the underserved cohort dwic is for.
4. **Method + limits box** — reproducible queries, the lower-bound ceiling, sampling caveat, denominator definition.

## 7. Page implementation

Mirror the existing study (`web/app/design-research/ai-generated-frontends/`):
- New route `web/app/design-research/agentic-terminal/page.tsx` (+ a `corpus`/data module for the sampled repos).
- Reuse `research.module.css` (aiux type scale, full-width prose, brand navy — already built).
- Add a hub card in `web/app/design-research/page.tsx`; add the route to `sitemap.ts`.
- Same a11y bar as study #1 (single h1, landmarks, chart `role="img"`+`aria-label`, AA contrast).

## 8. Open items before build (the clean firm-up pass)

- [ ] Union-fingerprint sample of a few hundred **unique** repos (dedup across fingerprints).
- [ ] First-commit-date adoption curve on the union, bucketed by quarter, with n stated.
- [ ] Frontend % on the union with an error bar (target n ≥ 300).
- [ ] Lock the exact headline number(s) once firmed.
- [ ] Final advisor review on the drafted page (numbers + claims + framing in context).
