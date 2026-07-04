# dwic — Launch Distribution Kit

Positioning: **dwic — a senior designer inside your terminal.** Auditing is the lead capability the senior designer performs; it is not the headline noun. The audit leads with an **accessibility-first priority order** (WCAG contrast + markup before anything else) and treats **WCAG AA contrast failures as build-blocking errors** (EU Accessibility Act framing). All numbers below match the live `npx @imrandwc/dwic audit` output against `examples/broken-project` (alpha.7): **8 categories · 24 findings · 9 errors · 10 warns · 5 info · exit 2** — of which **8 of 9 errors are accessibility failures**. Re-verify before recording if the fixture or audit logic changes.

Plan: one channel at a time, measure between. Start with Discord `#showcase` (warmest, lowest spam-risk) → r/ClaudeAI → X.

---

## 🎬 Screencast shot-list (~60s, against `examples/broken-project`)

Record in a clean terminal, large font, ANSI colors on (don't set `NO_COLOR`). Use the fixture for reproducibility.

| # | Time | Beat | On screen |
|---|------|------|-----------|
| 1 | 0–3s | **Cold open** | Empty terminal at project root. No title card — just the prompt. |
| 2 | 3–7s | **The one command** | Type `npx @imrandwc/dwic audit` slowly, hit enter. |
| 3 | 7–13s | **Auto-detect** | Linger on `Scanned: 2 CSS files · 1 component · Next.js 15, React, TypeScript, Tailwind v4` — it understands the stack with zero config. |
| 4 | 13–30s | **The verdict** | Category table renders in priority bands. Hold on the `✗ Fix before you ship — 8 of 9 errors are accessibility failures` header, then the red rows `✗ Accessibility (6)` + `✗ Color (3 AA fails)` and the `↳ WCAG AA / EU Accessibility Act` line. Hero shot. |
| 5 | 30–36s | **Totals** | `8 categories · 24 findings · error 9 · warn 10 · info 5  ·  exit 2 — fails CI`. Brief pause on red `error 9`. |
| 6 | 36–45s | **Reviewable & CI-ready** | `What to do next:` block + `Report written to .dwic/audit-<date>.md`. Show the report opens as real markdown, and note the `exit 2` (fails CI on errors). Actionable, not just red. |
| 7 | 45–52s | **No linter does this** | One line: linters check your code, nothing checks your *design system* — contrast, type scale, spacing grid, drift. That's the gap dwic fills. |
| 8 | 52–60s | **Inside Claude Code** | Cut to Claude Code: `npx @imrandwc/dwic setup`, ask `accessibility-specialist` to fix the unlabeled inputs → specific markup fixes back, and it remembers the project. End on wordmark + `Free during alpha · designwithclaude.com`. |

**30s cut:** beats 2 → 4 → 6 → 8 (the command, the verdict, the report/CI, the senior designer in Claude Code).

**Pinned caption:** *"A senior designer inside your terminal. One command reads your CSS + components and reviews your whole design system — deterministic, runs anywhere, fails CI on errors. Then the specialists fix what it finds inside Claude Code, and remember your decisions next session."*

---

## 📣 Post 1 — Anthropic Discord `#showcase`

> **I put a senior designer inside my terminal 🎨**
>
> I'm a designer who kept shipping CSS with contrast fails and a type scale that had quietly drifted. So I built **dwic** — a senior designer that lives inside Claude Code. The fastest way to meet it, no install, no token:
>
> ```
> npx @imrandwc/dwic audit
> ```
>
> It reads your CSS + components, auto-detects your stack, and hands back a senior designer's review — accessibility first. On my test project: **24 findings across 8 categories — 9 errors, 10 warnings**, and **8 of the 9 errors were accessibility failures** (missing labels, heading order, WCAG contrast). It's fully deterministic and runs on your machine — no LLM, no upload — so you can drop it in CI (it exits non-zero on errors).
>
> Then install the MCP and it works interactively — ask `accessibility-specialist` or `color-specialist` to fix what it found, and it *remembers your project's decisions across sessions* instead of re-asking.
>
> Free during alpha. Would love feedback on whether the review matches what you'd flag by hand 🙏
> 60s demo 👇 · designwithclaude.com

---

## 📣 Post 2 — r/ClaudeAI

> **Title:** I built an MCP that gives Claude Code a senior designer — it audits your design system and remembers your decisions (free, alpha)
>
> **Body:**
>
> I'm a designer-who-codes and I kept catching the same things too late — contrast that fails AA, a type scale three sizes off, inputs with no labels. Linters don't catch design-system problems. So I built **dwic**: a senior designer that lives inside Claude Code.
>
> Meet it in one line, zero commitment:
> ```
> npx @imrandwc/dwic audit
> ```
> It walks your CSS + components, auto-detects the stack, and returns a senior designer's triage — accessibility first. On my test fixture: **24 findings across 8 categories — 9 errors, 10 warnings**, and **8 of the 9 errors were accessibility failures** (WCAG contrast + markup). It's fully deterministic (WCAG contrast math, token parsing, markup heuristics) and runs locally — no LLM in the loop — so it's reproducible and a markdown report lands in `.dwic/` for review in a PR. It exits non-zero on errors, so it works in CI.
>
> The part I actually use daily: install the MCP server and the specialists work interactively inside Claude Code —
> ```
> npx @imrandwc/dwic setup
> ```
> e.g. *"accessibility-specialist: fix the unlabeled inputs and heading order"* → specific markup changes back. And it remembers your project's design decisions across sessions instead of re-interrogating you every time.
>
> It's alpha and free. I'd genuinely value feedback on whether the findings match what you'd flag by hand. Repo + demo: designwithclaude.com

---

## 📣 Post 3 — X / #ClaudeCode

> A senior designer, inside your terminal.
>
> `npx @imrandwc/dwic audit` →
> reads your CSS + components, no config, and reviews your design system: contrast fails, type drift, a11y gaps. Deterministic, runs locally, fails CI on errors.
>
> Install the MCP and it fixes them inside Claude Code, and remembers your decisions next session.
>
> Free, alpha 👇 #ClaudeCode
>
> [attach 60s demo]

---

## Pre-post checklist

- [ ] npm publish token rotated (done 2026-05-29)
- [ ] Homepage demo numbers match live audit (`24 · 9 · 10 · 5`, accessibility-first bands) — updated in `GetStartedPreview.tsx`
- [ ] README leads with the product + numbers/commands accurate — done 2026-05-29
- [ ] 60s screencast recorded against `examples/broken-project`
- [ ] Supabase confirmed unpaused + keep-alive cron live (`/api/health`, every 3 days) — more eyes = real traffic
- [ ] Post to Discord `#showcase` first; wait, measure, then Reddit, then X
