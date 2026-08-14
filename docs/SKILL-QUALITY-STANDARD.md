# dwc skill quality standard

Derived from hand-auditing `anti-slop-designer` and `design-critic` (2026-08-13/14),
which shared the same three defects. This is the bar every command in `commands/`
is held to.

A dwc command is a **procedure the agent executes**, not a reference document about
a design topic. The test: could a competent agent follow it step by step and know
when it was finished? If it only tells the agent *what to think*, it fails.

## The ten rules

**1. Never claim what you cannot verify.**
In a code project the agent reads source; it does not see a rendered screen. Source
determines which token was used, whether a library default was untouched, what copy
says. It does not determine visual balance, focal point, elevation coherence, or
"does this look generic". A command must either require rendering before such claims,
or require them marked `unverified — needs rendering`. Instructions that say "look at
the page" without a rendering step are defects.

**2. Ground in the audit where the audit applies.**
`npx dwic-audit` produces deterministic findings across color, typography, spacing,
accessibility, forms, navigation, motion and copy. A command touching any of those
should say to run it and build on the measured result, rather than judging by
impression. Deterministic evidence beats a confident opinion.

**3. Rank by severity and cap the output.**
Flat lists of equal-weight findings get nothing fixed. Rank, then cap (top 3 is the
default), and state how many were held back.

**4. Specify the exact output shape.**
Include a literal template. "Give structured guidance" is not a format. Sibling
commands producing different shapes for similar work is a defect.

**5. End in a falsifiable state.**
Close with conditions the agent can truthfully assert or not. "Confirm it reads as
intentional" is unfalsifiable. Listing what must be true, and stopping when it is,
is the bar.

**6. Say when to skip this command.**
Every command needs a "when NOT to use" that names the cheaper alternative. Commands
that never decline get invoked for work they are wrong for.

**7. Do not contradict yourself.**
Common failure: "gather full context first" plus "answer in one pass", with no rule
for the no-context case. Every branch a command opens must be closed.

**8. Separate durable judgment from perishable examples.**
Named trends, model tells, current library defaults and version-specific advice rot.
Put the durable test in the body and the dated examples in an appendix marked
perishable, so the examples can be replaced without rewriting the skill.

**9. No redundant sections.**
Expertise + Principles + Guidelines + Checklist + Anti-patterns + How to respond
frequently restate each other. Every section must do work no other section does.
A checklist that paraphrases the guidelines is bloat.

**10. Ask only what changes the answer.**
Trailing "what to ask if unclear" lists become five-question interrogations. Ask only
when the answer would change what you do, and otherwise state the assumption and
proceed.

## Severity for audit findings

- **Critical** — the command instructs the agent to do something impossible or wrong
  (unverifiable claims stated as fact, self-contradiction with no resolution).
- **Major** — missing output format, missing end condition, no severity/cap, no
  skip guidance, ignores the audit where it clearly applies.
- **Minor** — redundant sections, bloat, stale counts, inconsistent naming.

## Known-good reference

`commands/design-grill.md` was written to this standard and can be used as the shape
reference: step 0 precondition check, one-thing-at-a-time procedure, explicit filter
for what to record, literal output template, four-part falsifiable end condition,
"when to skip this" section.
