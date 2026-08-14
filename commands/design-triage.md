---
description: Turn a dwic audit report into a ranked fix plan, then fix the findings in order
---

You take an audit report full of findings and turn it into an ordered plan someone can actually work through — then you work through it. When invoked with $ARGUMENTS, you read the most recent `.dwic/audit-*.md`, rank what it found by what genuinely ships worst, and fix in that order.

`npx dwic-audit` tells the user what is wrong and stops. Nothing carries them from finding to fix, so a 40-finding report gets read once and abandoned. You are that missing step.

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

## Skip this command when

- There is no `.dwic/audit-*.md` and the user does not want one generated. Run `npx dwic-audit` first, or use `/design-brief` if they want guidance rather than a fix pass.
- The audit came back clean. Say so and stop; do not hunt for work.
- The user has one specific known problem. Go straight to that specialist — triage is for a pile of findings, not a single one.

## Step 0: get a report

```
ls -t .dwic/audit-*.md | head -1
```

- **Found one** — read it, and note its date. If it is more than a few days old, say so and offer to re-run `npx dwic-audit`, since findings may be stale.
- **None found** — offer to run `npx dwic-audit` now. It needs no token and nothing leaves the machine.
- **User passed a path or pasted a report** in $ARGUMENTS — use that instead.

Never invent findings. Everything you triage must come from the report or from source you have read.

## What the report gives you

The audit writes three bands, and you should not blindly trust their order — they are severity bands, not a fix order.

- `## Fix before you ship — accessibility & contrast` — WCAG AA failures, compliance risk, fails CI
- `## Then clean up` — everything else with findings
- `## Clean` — categories that passed

Within each, findings appear under `#### ✗ ERROR`, `#### ⚠ WARN`, `#### · INFO`, as `- \`token\` — message`.

## How to rank

The audit ranks by severity. You rank by **what it costs to leave it broken**, which is not the same thing. Order by, in this priority:

1. **Ships broken and blocks people.** WCAG AA failures on interactive elements, unlabelled inputs, keyboard traps. Legal exposure under the EU Accessibility Act, and real users locked out.
2. **One fix clears many findings.** A wrong token definition producing 14 contrast failures outranks 14 unrelated one-line fixes. Look for the shared root: findings citing the same token, the same component, or the same file are usually one fix.
3. **Cheap and permanent.** A token added to the scale prevents every future off-scale value. Prefer fixes that stop the class of problem, not the instance.
4. **Everything else**, by count.

Explicitly **de-prioritise**: single info-level findings, anything in a category the audit marked clean, and any finding whose fix would need a design decision the user has not made. Those last ones go on a separate list — you do not guess them.

## Output format

```
## Triage — <n> findings from .dwic/audit-<date>.md

### Fix order

1. <fix> — clears <n> findings
   Why first: <blocks people / one root cause / prevents recurrence>
   Root: <the token, file, or component they share>
   Specialist: /<command>

2. ...

### Needs your decision first
- <finding> — <the choice only the user can make>

### Deferred
<n> info-level findings in <categories>, listed in the report.

Starting with 1 unless you say otherwise.
```

Cap the fix order at **5 items**. More than that and nothing gets done — state how many findings the 5 cover and how many remain.

## Then fix, in order

Work one item at a time. For each:

1. Read the actual source the finding points at. The report names a token or element; find where it lives.
2. Make the fix, or invoke the specialist that owns it (see routing below).
3. State what changed and which findings it cleared.
4. Move to the next item. Do not batch all five and report at the end.

After the run, recommend `npx dwic-audit` again to confirm the count dropped. **Do not claim findings are cleared without re-running it** — you fixed source, you did not re-measure.

## Routing: audit category → specialist

| Audit category | Slash command | MCP tool |
|---|---|---|
| Color | `/color-specialist` | `color-specialist` |
| Typography | `/typography-specialist` | `typography-specialist` |
| Spacing | `/spacing-layout-specialist` | `spacing-specialist` |
| Accessibility | `/accessibility-specialist` | `accessibility-specialist` |
| Forms | `/form-designer` | `form-designer` |
| Navigation | `/navigation-specialist` | `navigation-specialist` |
| Motion | `/motion-designer` | `motion-designer` |
| Copy | `/content-strategist` | `content-strategist` |

The slash command and the MCP tool names differ for spacing. The report's "Next steps" section names the **MCP tool**, which does not exist as a slash command — if the user only installed the free library, route them to `/spacing-layout-specialist` and say why the report's name did not match.

## Done when

Stop when you can truthfully state all four:

- Every item in the fix order was either fixed, or handed back as a decision the user must make.
- Every fix cites the file it changed.
- No finding was reported as cleared without `npx dwic-audit` being re-run.
- Findings you did not address are listed, not silently dropped.

Then say which of the four hold and stop.

## Anti-patterns

- Presenting the audit's own severity order as a fix order. Severity is not cost.
- Fixing 14 findings one at a time when they share one root token.
- Claiming the audit is clean without re-running it.
- Inventing findings not in the report or in source you read.
- Guessing a fix that needs a design decision — brand colour, type scale, tone. Hand those back.
- Triaging more than 5 items. A long plan is an unexecuted plan.
