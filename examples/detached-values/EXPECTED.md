# Expected findings — `detached-values`

**Do not read this before running `/design-enforce` against this fixture.** It is the
answer key. It lived in a header comment inside `src/components/StatusCard.tsx` until
2026-08-15, which meant any agent scanning the fixture was handed the solution — the
fixture could not fail, so a passing run proved nothing.

Run the command first, then compare against this file.

## What this fixture is

A **sound** design system that the code ignores. `src/styles/tokens.css` is fine:
AA-passing colours, a clean 4px scale, standard weights. `npx dwic-audit` reports
Color clean, Spacing clean, 0 errors — correctly, because it checks whether token
*values* are sound. The violations are in the code that bypasses them.

That contrast is the point of the fixture. Its sibling `examples/broken-project` has
*broken tokens* and exercises the audit. Do not "fix" either one.

## Expected findings

Seven violations, all decidable from source alone — no rendering required.

| # | Class | Where | Detail |
|---|---|---|---|
| 1 | Detached value | `StatusCard.tsx:29` | `#f79009` raw; `--color-warning` holds exactly that |
| 2 | Detached value | `StatusCard.tsx:29` | `#027a48` raw; `--color-success` holds exactly that |
| 3 | Detached value | `StatusCard.tsx:24` | `#101828` raw; `--color-text` holds exactly that |
| 4 | Off-scale | `StatusCard.tsx:21` | `padding: 13px 21px` against a 4px scale |
| 5 | Off-scale | `StatusCard.tsx:22` | `border-radius: 5px`; system defines 4 and 8 |
| 6 | Bypassed syntax | `StatusCard.tsx:19` | Tailwind `text-[#1f3b90]`; `--color-primary` holds that value |
| 7 | Reinvented component | `StatusCard.tsx:33–42` | a bare styled `<button>` when `Button.tsx` exists |

## What a good run also gets right

These separate a correct run from one that merely found seven things.

- **#7 absorbs its own detached values.** The bare `<button>` hardcodes `8px`/`16px`
  (`--space-2`/`--space-4`), `8px` (`--radius-md`), `#1f3b90` (`--color-primary`) and
  `700` (`--font-weight-bold`). These are **not** five more findings — they exist only
  because the component was rebuilt. Report the root cause; the rest follow.
- **`w-[347px]` (`:19`) is a gap, not a violation.** No width token exists to bypass.
  Reporting it as a bypass is wrong; reporting it as a gap to raise is right.
- **Severity should not be flat.** #1 and #2 are the most severe: they detach *semantic*
  tokens, so status colours stop following the theme. #7 and #6/#3 are Major. #4 and #5
  are Minor.
- **Off-scale values get handed back, not fixed.** No token fits `13px`, `21px` or `5px`.
  Adding a scale step is the user's decision.

## Decoys — must NOT be flagged

- `zIndex: 10` (`:25`) — not a design-token value
- `transition: "opacity 200ms ease"` (`:26`) — no motion token exists to bypass; a gap
- Every raw value in `src/styles/tokens.css` — holding raw values is that file's job.
  Flagging the token definitions is the classic false positive.
- `Button.tsx` in its entirety — it is the correct reference implementation and uses
  `var(--…)` throughout.

## Known measurement note

While the answer key lived in `StatusCard.tsx`, `npx dwic-audit` reported Copy findings
caused entirely by that comment. Measured before and after removing it:

| | Copy findings | Total findings |
|---|---|---|
| With the answer key | 7 | 10 |
| Without it | 1 | 4 |
| After the copy-extractor fix | 0 (clean) | 3 |

The last row is a **separate bug the measurement exposed**, now fixed. The copy checks
were reading source comments and the code after them as user-facing prose — a 43-word
"sentence" stitched from `Button.tsx`'s comment and its `export function` line, and 88
words the same way in `examples/broken-project`. The prose path now reads only JSX text
nodes and user-facing attributes when the input is source. See
`scripts/test-audit-copy-source.mjs`.

Copy is expected to be **clean** on this fixture: its only user-facing strings are
"Needs attention", "All good" and "Dismiss", none of which trip a copy check. If Copy
ever reports a finding here again, suspect the extractor before the fixture.
