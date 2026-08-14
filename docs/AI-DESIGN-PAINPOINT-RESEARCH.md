# What actually goes wrong when people design with AI

Research run: 2026-08-13. Method: 24 independent researchers across distinct sources
(practitioner blogs, HN, Reddit, arXiv, competing skill repos, skills.sh install ranks),
clustered into 20 distinct pain points, then adversarially verified — three lenses per
pain point (is it real and current, did a practitioner actually say it, is it already
covered by an existing dwc command), each defaulting to *refuted*.

The run was stopped after verification; the master-designer and critic passes did not
complete. Conclusions below come from the verified evidence, not from a synthesis agent.

## Verdict

| Pain point | Freq | Covered by | Build? |
|---|---|---|---|
| Design system supplied but not enforced | 24 | **none** | **Yes** |
| Agent cannot see what it renders | 13 | **none** | Contested |
| The homogenized default aesthetic | 26 | anti-slop-designer | No |
| Non-designers can't judge the output | 11 | design-critic | No |
| Accessibility cosmetic or absent | 7 | accessibility-specialist | No |

The highest-frequency pain point is already our best-covered one. The second-highest is
covered by nothing.

## Build: design system supplied, design system ignored

Survived all three verification lenses independently. `alreadyAddressedBy: none` from
every verifier that examined it.

The closest existing command is `design-system-architect`, and one verifier read it in
full to check: it is an **authoring** command — token layers, component APIs, theming,
governance. It tells you how to *build* a design system. Nothing in the pack checks
whether generated code actually *uses* one.

Primary evidence (designsystemscollective.com, 2026-04-24, "Tested Claude Design: it
failed to use tokens") — a first-party test against a production design system:

- ~20 detached hex occurrences
- ~15 off-scale values
- wrong radii, literal paddings
- `#F79009` written directly into a chart, when that exact value existed as a token

Corroborated independently by the Figma Make cluster: designers attach a published
component library and the output still rebuilds lookalike components from scratch.

This is the gap. It is concrete, checkable from source (no rendering required), and
nobody in the pack owns it.

## Contested: render blindness

Real gap in coverage — one verifier grepped all 45 commands for
`screenshot|playwright|puppeteer|devtools|browser|visual-regression` and found nothing,
then read `design-critic`, `briefing-claude` and the other plausible candidates in full
to confirm.

But it was refuted on three grounds worth taking seriously:

1. **Evidence inflation.** The verifier checked the HN Algolia API and found that five
   of the seventeen cited sources share `story_id 47499672` — one thread counted as five
   independent sources. The true frequency is lower than 13.
2. **Solved at the tooling layer.** Chrome DevTools MCP and Playwright already give
   agents rendering and screenshots. A markdown skill would be prescribing a loop the
   tooling already provides.
3. **Wrong moat.** Render verification is agent-infrastructure, not design expertise.

Counter-evidence is still strong (superdesign.dev, verbatim: *"Claude renders nothing.
It writes CSS it has never looked at"*). Verdict: real, but a weaker and less
differentiated bet than token enforcement.

## Do not build

**Homogenized default aesthetic** (freq 26). Verified real and current — Jim Nielsen's
2026 piece independently names the markers, and Anthropic ships corrective guidance for
it in `frontend-design`. But it is refuted on coverage: one verifier called it *"the most
directly and explicitly covered pain point in the entire dwc library."* `anti-slop-designer`
names nearly every artifact one by one. Improve that command; don't add another.

**Non-designers can't judge quality** (freq 11). Real and durable — the bottleneck is
human evaluation ability, which no model improvement removes. HN comment 47740061,
verbatim: *"I can't tell the difference between 'this is actually good' and 'this is
vibe-designed slop'."* Covered by `design-critic` plus `anti-slop-designer`.

**Accessibility cosmetic or absent** (freq 7). Sources check out, including arXiv 2510.13914
(A11YN) and 2502.10884 (CodeA11y). Practitioner framing is sharp: *"AI will slap an
aria-label on things"* without the semantics underneath. But `accessibility-specialist`
(127 lines) maps onto it 1:1, including the ARIA point.

## Method notes

- Clustering marked *"agent declares the UI fixed while it is visibly broken"* (freq 5) as
  generic and filtered it out, though it is plausibly the same failure as *"agent cannot
  see what it renders"* (freq 13). That split understates the true frequency.
- ~2.4 agent attempts per distinct call, from structured-output schema retries rather than
  API errors. Looser schemas would cut cost materially on a rerun.
- Three of the pain points I proposed from my own reasoning before this research
  (`/prove-it`, `/break-it`, `/pin-it`) did not survive contact with it. The strongest
  finding — token enforcement — was not among them.
