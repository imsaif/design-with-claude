# DRAFT — <thesis in one line>

> **Status: DRAFT. Not published. Not firmed.** Produced by the Research Scout agent
> on <date>. A human must review and promote this via the study checklist
> (`agentic-terminal-workflow-study.md` §7) before any of it goes live.

**Slug:** `<kebab-slug>`
**Raw data:** [`<date>-<slug>-sample.csv`](./<date>-<slug>-sample.csv) — N=<n> rows
**Reproduce:** `npm run research:collect -- --fingerprint=<...> --sample=<n>`

---

## 1. The question
What this study asks, in one or two sentences. Must be answerable from the public
GitHub record and NOT already answered by an existing study.

## 2. The claim — and the claims we do NOT make
- **We claim:** <the specific, bounded finding>.
- **We do NOT claim:** <the tempting overreach this data cannot support>.

## 3. Findings (directional — raw in the CSV)
The numbers. Every quantitative claim MUST carry one of:
- **N + 95% CI** (e.g. "23% ±5pp, 95% CI ≈ 18–28%, n=278"), or
- an explicit **directional-floor** label for volatile GitHub counts
  (e.g. "~hundreds of thousands; total_count volatile, counts files not repos").

No bare percentages. No false precision on code-search counts.

## 4. Method (reproducible — this is the brand promise)
- **Denominator:** <what population, one definition, stuck to>.
- **Scale counts:** GitHub code-search `total_count` per fingerprint — approximate/volatile.
- **Adoption/dates:** config-file FIRST-COMMIT date (`git log` oldest touching the path),
  NOT repo-creation date.
- **Classification:** how UI-vs-not (or whatever the axis is) was decided — cite the
  collector rule in `scripts/research/collect/classify.mjs`.
- **Exact command(s)** used, so the CSV regenerates.

## 5. Limits & what would falsify this  *(MANDATORY — do not delete)*
- **Sampling bias:** GitHub code search is relevance-ranked and caps at 1,000 results —
  the sample is NOT random. State the skew (which fingerprints dominated the sample).
- **Small-n / instability:** show how the headline number moved across sample sizes if it did.
- **What would falsify the thesis:** the concrete observation that would overturn this finding.
- **Other honest weak spots:** anything the agent is unsure about.

## 6. Adversarial self-critique  *(MANDATORY — do not delete)*
The strongest case AGAINST this thesis, argued in good faith, and why the finding
survives it (or where it only partially survives). Surviving objections stay disclosed
in §5 — they are not smoothed away.

## 7. If promoted — suggested study shape
Hero stat, the 2–3 supporting tiles, the one-line takeaway. (Advisory only; the human
does the real page per the checklist. The agent does NOT scaffold `web/app/design-research/`.)
