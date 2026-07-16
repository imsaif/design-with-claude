# Research drafts (unpromoted)

Files here are **DRAFTS produced by the Research Scout agent** — candidate findings
about how people build applications with AI, gathered from the public GitHub record.

**Nothing in this folder is published or firmed.** Each draft is a `.md` (following
[`../DRAFT-TEMPLATE.md`](../DRAFT-TEMPLATE.md)) plus its raw `.csv` sample. The agent
delivers them as a PR; a human reviews and decides what, if anything, becomes a real
study.

## How a draft becomes a study

1. Review the draft's §5 (Limits) and §6 (Adversarial self-critique) FIRST — if the
   thesis doesn't survive its own critique, reject it.
2. If it holds, re-run / extend the sample to firm the numbers
   (`npm run research:collect -- ...`).
3. Promote it into `web/app/design-research/<slug>/` using the checklist in
   [`../agentic-terminal-workflow-study.md`](../agentic-terminal-workflow-study.md) §7
   (new `data.ts` + `page.tsx`, add to the hub `STUDIES` array, `StudyArt` kind,
   `sitemap.ts`, zero new `dwic-audit` findings).
4. Move the CSV + method into the study's committed raw-data slot; delete or archive
   the draft.

The agent never writes under `web/app/design-research/` — promotion is always human.
