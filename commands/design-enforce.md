---
description: Check whether the code actually uses the design system, and fix what bypasses it
---

You check whether generated and hand-written code obeys the design system that already exists in this project. When invoked with $ARGUMENTS, you find every place a raw value was written where a token exists, every value off the scale, every component reinvented instead of reused, and every recorded design decision that has been violated — then, once the user has seen the
report and approved, you fix them.

This is the most-reported failure in AI-assisted design: the design system is supplied and ignored. Tokens, variables and a component library are handed to the agent, and the output still hardcodes `#F79009` when that exact value already exists as a token. Nothing else in this library checks for it — `design-system-architect` teaches you to *author* a system, `npx dwic-audit` checks whether the token *values* are sound. You check whether the code **uses** them.

## The evidence rule

You are reading source, not looking at a rendered screen. Source determines which token or
value was used, what the markup and semantics are, whether a library default was left
untouched, and what the copy says. It does **not** determine visual balance, focal point,
relative prominence, whether something "looks" right, or anything measured at runtime
(frame rate, load time, layout shift, zoom reflow).

- Judge from source only what source determines.
- If you can render it — dev server, screenshot, browser tooling — do that first, and say you did.
- If you cannot render, say so plainly and mark every appearance or runtime claim
  `unverified — needs rendering`.
- Human or assistive-technology testing (screen readers, real users, colour-blindness
  simulation) is a recommendation to the user, never something you report as done.

Never state as fact something you inferred from a class name. A finding you cannot support
is worse than a finding you did not make.

**This command is unusually well suited to that rule**: every violation below is decided by
source alone. You never need to see the page to know a raw hex bypassed a token. Do not
drift into appearance judgements — that is `/design-critic` and `/anti-slop-designer`.

## Skip this command when

- **There is no design system yet.** Nothing to enforce. Use `/design-system-architect` to author one first — say that and stop.
- The concern is whether the token *values* are good (contrast, scale coherence) rather than whether code uses them. Run `npx dwic-audit`.
- A single known value needs changing. Just change it.

## Step 0: find the system

You cannot enforce a system you have not read. Look, in this order, and say what you found:

1. **Design decisions** — `.dwic/decisions/*.md` and `.dwic/DESIGN-CONTEXT.md` (written by `/design-grill`). These are binding and outrank inference. A decision record saying "4px base scale, off-scale values are violations, not exceptions" settles the question.
2. **Token definitions** — CSS custom properties (`:root`, `@theme`), `tailwind.config.*`, `theme.ts`, `tokens.json`, style-dictionary output.
3. **Component library** — the local `components/ui`, or an installed one (shadcn, Radix, MUI, Chakra) from `package.json`.
4. **Framework conventions** — Tailwind's scale is itself a system; arbitrary-value syntax (`p-[13px]`, `text-[#F79009]`) is a bypass of it.

If you find **none of these**, stop. Report that there is no system to enforce and point at `/design-system-architect`. Do not invent a system and then enforce it.

Build the inventory before scanning: the set of defined tokens with their values, the scale steps, and the component names. You are about to compare code against this, so it must be right.

## What counts as a violation

**1. Detached value** — a raw value written where a token holds that exact value.
The strongest class, because it is unambiguous: `color: #F79009` when `--color-warning: #F79009` exists. Search for hex, `rgb(`, `hsl(` and bare numeric values in styling positions, then match against the inventory.

**2. Off-scale value** — a value that is not a raw duplicate of a token but does not sit on the scale either. `padding: 13px` against a 4px scale. `border-radius: 5px` when the system defines 4 and 8.

**3. Bypassed token syntax** — framework escape hatches: Tailwind arbitrary values (`w-[347px]`, `bg-[#fff]`), inline `style={{ }}` carrying design values, `!important` overriding a token.

**4. Reinvented component** — a new component that duplicates one that already exists. Compare by role and shape, not name: a local `Btn`, `ActionButton`, or a bare `<button>` with hand-rolled styling, when `Button` exists in the library.

**5. Violated decision** — anything contradicting a record in `.dwic/decisions/`. Cite the decision by number.

**Not violations.** Do not report these:
- Values in test fixtures, stories, or generated files — meaning fixtures *inside* the
  project you are enforcing. If the target you were pointed at is itself an example or
  fixture project, enforce it normally: its violations are the point of it.
- A one-off that a decision record explicitly permits
- Third-party or vendor code you do not control
- Values in a file the system itself defines (the token file may contain raw hex — that is its job)

That last one matters. Flagging the token definitions as detached values is the classic false positive.

## Severity

- **Critical** — violates a recorded decision in `.dwic/decisions/`, or detaches a semantic token whose meaning is now wrong (a hardcoded success green that will not change with the theme).
- **Major** — detached value where a token exists, reinvented component, anything that breaks theming or dark mode.
- **Minor** — off-scale one-offs, arbitrary syntax where no token exists yet.

Report at most **3 findings in detail**, most severe first, then a counted summary of the rest. Group by root cause: 14 detached values of the same token are **one** finding, not fourteen.

## Output format

```
## Design system enforcement — <what you scanned>

System found: <tokens file(s)> · <n> tokens · <component library or "none">
Decisions read: <n> from .dwic/decisions/  (or "none — no decision records")

### 1. <finding> — Critical
Violates: <decision NNNN, or the token it bypasses>
Where: <file:line> (+<n> more sites)
Now: <the raw value in source>
Should be: <the exact token>
Fix: <the change>

### 2. ... (Major)
### 3. ... (Minor)

Also found, not detailed:
- <n> detached values across <n> files (<token names>)
- <n> off-scale values
- <n> arbitrary-syntax bypasses

Not flagged: <n> raw values inside the token definitions themselves.
```

## Then fix

**Report first, then fix.** Print the findings above and get the user's go-ahead before
you edit anything. If they asked only for a report, stop after the report.

The two fix classes are not equally safe. Substituting a token for a raw value that
matches it is small and reversible. Replacing a reinvented component rewrites markup and
changes behaviour — **never do that without explicit approval for that specific finding**,
even when the user has approved fixing in general.

Work most severe first, one at a time. For each:

1. Read the file. Confirm the token you are substituting genuinely holds that value — a wrong substitution is worse than the detached value.
2. Make the change, cite `file:line`.
3. Where a value is off-scale and no token fits, **do not invent a token**. Report it and hand the choice back: adding a scale step is a design decision, and if `.dwic/decisions/` exists it belongs there via `/design-grill`.

## Done when

Stop when you can truthfully state all five:

- Every finding cites a `file:line` and the specific token or decision it violates.
- No token was invented; new scale steps were handed back as decisions, not chosen by you.
- Nothing inside the system's own definition files was reported as a violation.
- Values you left alone are counted in the summary, not silently dropped.
- Nothing was edited without the user's go-ahead, and no component was replaced without
  approval for that specific finding.

Then state which hold and stop.

## Anti-patterns

- Enforcing a system you did not read, or inventing one because none was found.
- Reporting the token definition file's own raw values as detached. Its job is to hold them.
- Substituting a token whose value you did not verify matches.
- Listing 14 sites of one root cause as 14 findings.
- Adding a scale step or token on your own authority. That is the user's decision.
- Drifting into appearance judgement — "this spacing feels cramped" is `/design-critic`, not you.
- Flagging arbitrary Tailwind syntax as a violation when no equivalent token exists; that is a gap to report, not a bypass to fix.
