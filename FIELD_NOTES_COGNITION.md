# Field Notes — dwc on Cognition

**Derived actions live in [`ROADMAP_FROM_COGNITION.md`](./ROADMAP_FROM_COGNITION.md)** — every challenge in this file is mapped there to a solution, size, priority, and dependency list.

**What this is:** A running product-research log captured while using dwc to help author a design system for Cognition (a NewGlobe-brand conversational AI at `/Users/imranmohammed/cognition`).

**Why it exists:** Cognition is a real project with an existing design system (already brand-manual-aligned in `themes.css`). That's different from dwc's default use case ("starting fresh from a brief"). Running dwc on a project-with-existing-system is a stress test — the friction it surfaces is roadmap signal.

**One entry per tool invocation.** Captured at the time of the call, not retrospectively. Patterns aggregated at the top of this file after all calls are in.

---

## Patterns across tools

### 1. dwc is a knowledge-injection tool, not a workflow engine
Across all 6 calls this session, every tool returned (a) its role prompt and (b) a deterministic seed. None returned synthesis, decisions, or next-step recommendations. **The calling LLM (Claude) did all the synthesis work.** Without an LLM with access to the brief, project state, and prior outputs, the raw tool output is a reference — not a deliverable.

**Roadmap implication:** If dwc wants to help designers decide what to do next, it needs a recommender surface — not another specialist. A `design-next-step` tool (or `/companion` enrichment) that reads recent events + a brief summary + optional project state and returns "your next highest-leverage action is X because Y" would close the loop the specialists don't.

### 2. Every specialist assumes fresh-start, not audit-existing
`color-specialist`, `typography-specialist`, `spacing-specialist`, and `design-system-architect` all returned seed systems despite briefs that explicitly described an existing system. None accepted "here's what we have, audit it" as a valid mode. For a project past day 1, every specialist output was ~70% noise (a parallel system we'd already decided against) and ~30% signal (the structural ideas or a11y checks).

**Roadmap implication:** Add an `audit` mode (or `existingTokens` input) to every specialist. When the caller passes current state, the tool should return a diff + gap list, not a fresh seed. This is the single highest-value feature I'd add.

### 3. Tools don't honor explicit asks in the brief
`color-specialist` was asked to "flag any accessibility issues with the mandated brand palette — especially turquoise on white" and didn't address it at all. The brief's literal ask was skipped in favour of the role-prompt default flow. Contrast math had to be done by hand in the caller.

**Roadmap implication:** Specialists should parse the brief for explicit asks and prioritize them over the default output shape. Probably a pre-processing step in each tool's prompt: "extract explicit constraints and questions from the brief; respond to them first."

### 4. Tools don't cross-reference each other's output
`color-specialist` doesn't know `typography-specialist` was called in the same session. Each output is isolated. For a system where color + type + spacing are supposed to form a coherent whole, this is a compositional gap.

**Roadmap implication:** Either emit cross-references automatically ("given your ratio choice, here's the max heading weight that stays readable at small sizes"), or add a `design-synthesize` tool that reads recent tool outputs from the event history and produces a unified recommendation.

### 5. Framework awareness is missing
`spacing-specialist` was told "Tailwind CSS v4 compatible (4px base)" and returned a parallel 12-step CSS-var scale as if Tailwind's own scale didn't exist. For a framework-constrained project, the right answer is often "use the framework default; add these extra tokens on top" — not "here's a new scale."

**Roadmap implication:** When `stack` or framework hint is provided, specialists should prefer framework-native tokens and only recommend additions, not parallel systems.

### 6. The role prompt is front-loaded and dominates the token budget
Every tool's output leads with ~1,500–2,500 tokens of role/expertise/guidelines before the brief is restated. For the calling LLM, that context is useful; for a designer reading raw output in the companion, it's noise. In a 10-call free tier, the role prompt is repeated 10x.

**Roadmap implication:** Consider stripping the role prompt from the tool return and keeping it server-side as the system prompt. The tool output becomes the *response* (seed values + analysis), not the *instructions + response*.

---

_(Each point above is a concrete dwc roadmap candidate, derived from one real session, not hypotheticals.)_

---

## Appendix A — Technical trace of a single call

What actually happens when a caller invokes `color-specialist` (any specialist follows the same shape). Captured here so the dwc team has a concrete mental model of the round-trip.

```
1. Claude Code sends an MCP tool-call over stdio
   → server at .npm/_npx/91cae5.../node_modules/designwithclaude/dist/server.js

2. The server:
   a. Gating check          → POST https://designwithclaude.com/api/gating/check
   b. Loads role prompt     ← commands/color-specialist.md (~1.8k tokens)
   c. Derives seed values   (deterministic — accent #1F3B90 → primary-500 #2d56d2 ramp)
   d. Emits structured event → POST /api/events
   e. Increments gating     → POST /api/gating/consume
   f. Returns MCP tool result = role prompt + brief restated + seed palette

3. Claude Code renders the ~2,000-token tool result inline in the conversation.

4. The calling LLM (Claude) reads it as context and does the real work:
   - Parses the brief's explicit asks (e.g. "flag turquoise on white")
   - Computes anything dwc didn't (e.g. contrast ratios by hand)
   - Reconciles seed values against project state (existing themes.css)
   - Produces the usable answer

5. The companion page at /companion?token=... shows an event row
   ("color-specialist ran at 14:32") — visible to anyone holding the token,
   including a designer with no Claude access.
```

## Appendix B — Developer-experience observations

- **The MCP call is a role-prompt fetch + seed generator + event emitter.** It is not a design expert. The "design expert" illusion is produced by the calling LLM interpreting the role prompt.
- **Raw tool output without an LLM in front of it is low-value.** A designer running `npx designwithclaude color-specialist "..."` in a terminal would get text dumped to stdout — mostly role prompt. To extract value they'd have to parse it by eye.
- **Token consumption is invisible to the caller.** Gating is server-side; Claude Code has no readout for "you've used 6/10 free calls this session." The first time a caller learns they're gated is when a call fails.
- **No feedback loop.** If the seed palette isn't quite right, the tool doesn't know how to refine — the caller has to re-brief and re-call, paying another gating slot.
- **No awareness of prior calls.** Each invocation is stateless from the server's perspective even though the caller is on a clear journey (color → type → spacing → audit → next).

## Appendix C — Two product modes hiding in one surface

dwc currently tries to serve two audiences with the same output shape:

| Mode | Audience | What they need | What dwc delivers |
|---|---|---|---|
| **Claude-in-the-loop** | Developer calling MCP tools from Claude Code | Expert context Claude can synthesize against | ✓ Works — the role prompt + seed is exactly the right shape for Claude to reason over |
| **Designer-direct** | Designer watching the companion page | Usable deliverables + next-step guidance | ✗ Underserved — the companion shows events ("something happened") but not synthesized output and not recommendations |

**The positioning says "design *with* Claude"** — which is accurate for mode 1. Mode 2 needs either a separate surface or enrichment on the companion page that actually synthesizes what the events add up to.

## Appendix D — The minimum "partner" feature

A `design-next-step` tool that accepts:
- `token` (or infers from context) — to look up recent events from the gated event history
- `state` (optional) — a brief dump of current project state (existing tokens, recent decisions)

And returns:
- **One paragraph.** "Given you've just run color + type + spacing against a brief that mandates turquoise #00B7BD, your next highest-leverage action is `accessibility-specialist` on the palette — the turquoise-on-white pairing fails WCAG AA at 2.46:1 and neither color-specialist nor the role prompt flagged it. After that, run `design-synthesize` to reconcile the three specialists' outputs into one coherent token file."

That tool would be the first thing in dwc that feels like a **partner** instead of a **library call.** It's also the first thing that would make the companion URL feel like a destination rather than an event log.

---

_Appendices logged 2026-04-17 during the Cognition session, alongside the per-tool entries above. If future sessions reveal more trace details (e.g. what happens under a gating block, what events look like in the event store), append here rather than in per-tool entries._

---

## Per-invocation log

<!-- Template for each entry:

### [tool-name] — YYYY-MM-DD HH:MM

**Context:** What we were trying to do in Cognition when we reached for this tool.

**Brief passed:**
```
(exact input, reproducible)
```

**Output summary:** 2–3 lines on shape, usefulness, quality.

**What dwc did well:**
- concrete observation

**What dwc missed / got wrong:**
- concrete observation

**Gap surfaced:** Capability we wanted but the tool didn't support.

**Decision:** Adopted / adapted / discarded — and why.

---

-->

### hello-world — 2026-04-17

**Context:** Sanity check before committing to a full specialist pass. Wanted to confirm dwc MCP was actually connected to Claude Code for this session, not assume.

**Brief passed:** _(no args)_

**Output summary:** `Hello, designer — designwithclaude MCP server is alive.` One-line confirmation.

**What dwc did well:**
- Exactly the right surface for a ping — no ceremony, round-trips in under a second
- Doesn't attempt to be clever; fills its "is the server up?" slot cleanly

**What dwc missed / got wrong:**
- None — this tool is scoped correctly

**Gap surfaced:** Minor — `hello-world` could optionally return the authenticated user / token suffix so the caller knows *whose* server they're talking to. Right now you have to grep `~/.claude.json` for the token. Not a blocker.

**Decision:** Adopted — used as pre-flight check before paid calls.

---

### design-brief — 2026-04-17

**Context:** Master orchestrator call. Wanted to see what a "whole-project brief" run produces before drilling into specialists.

**Brief passed:** Full Cognition brief with NewGlobe brand constraints (navy/turquoise/Arial/US English/no-dark-no-sad tone), two-mode UI (Lite/Pro), existing design system aligned to brand manual, asked for full-system recommendation to compare against what's shipped.

**Output summary:** Returned the role prompt for "Design with Claude Master" — a catalog of 44 specialist agents with domain descriptions, an instruction template ("1. Brief Analysis / 2. Relevant Design Domains / 3. Key Design Decisions / 4. Token Recommendations / 5. Component Recommendations / 6. Implementation Notes"), and the designer's brief restated at the bottom. **No actual synthesis of the brief.** The tool delegates synthesis to the calling LLM.

**What dwc did well:**
- The agent catalog is genuinely useful — 44 specialists with clear scope descriptions is a good map of the problem space
- Forces the caller to think in terms of WHICH specialists apply, not a grab-bag of generic advice
- Reaffirms naming conventions the specialists use (e.g. semantic variants like `primary/secondary/ghost` not color names)

**What dwc missed / got wrong:**
- **No synthesis of the brief.** The tool name suggests "give me a design brief" but the return value is the system prompt for the synthesis, not the synthesis itself. A caller who expects usable output gets a role spec.
- The output is ~2,000 tokens of role prompt before the brief even appears. Most of it is `## Role:` `## Expertise` `## Guidelines`. If the intent is "Claude reads this role and acts on the brief," that's fine — but it's not labelled that way.

**Gap surfaced:** The friction is labelling, not capability. `design-brief` should either (a) be renamed `design-brief-orchestrator` / `design-specialist-router` to signal "this tool picks specialists for you" rather than "this tool produces a brief", or (b) have a mode that actually runs the synthesis end-to-end instead of returning the instructions for it.

**Decision:** Adapted — treated the role prompt as my system context for the Cognition work, then called each specialist directly. Didn't quote design-brief's output in `DESIGN_COMPARISON.md` — nothing to quote.

---

### design-system-architect — 2026-04-17

**Context:** Wanted structural advice on token architecture, naming conventions, and theming strategy for Cognition. Brief noted existing 60+ CSS variables with light/dark overrides via `html[data-theme="dark"]`.

**Brief passed:** Cognition — existing 60+ CSS variables in themes.css with light/dark overrides. Semantic naming in use. Want take on soundness + gaps.

**Output summary:** Returned the Design System Architect role prompt — token architecture theory (3-layer primitive/semantic/component), component API design rules, variant naming conventions, theming/versioning/governance principles. Then the brief restated. **Same pattern as design-brief: role spec, no synthesis.**

**What dwc did well:**
- The 3-layer token architecture (primitive → semantic → component) is genuinely useful as a mental model. Cognition currently has only the middle layer (semantic). The architect's "tokens should layer" guidance points at a concrete gap.
- Clear anti-patterns list (hardcoded hex, mega-components with 15+ props, color-name variants) that I can apply as a lint-checklist in DESIGN.md.
- "Convention over documentation" principle resonates — a system that's intuitive needs fewer docs, which informs how I scope DESIGN.md.

**What dwc missed / got wrong:**
- **Same role-prompt pattern as design-brief.** Didn't actually assess Cognition's existing structure, despite the brief describing it. A caller expecting "you reviewed my themes.css and here's what's missing" gets a general reference instead.
- No awareness of the requested framework output (`css-vars`). The response is framework-agnostic.

**Gap surfaced:** Architect should be able to take an existing token file path or pasted content and assess it specifically. Right now it returns principles; the caller has to do the audit. A `currentTokens` input would close the loop.

**Decision:** Adopted the 3-layer architecture recommendation as a "follow-up" in DESIGN.md (not a blocker for MVP — Cognition's semantic-only approach works for a project this size). Adopted the anti-patterns list as Do/Don't material.

---

### color-specialist — 2026-04-17

**Context:** Wanted a WCAG audit of NewGlobe's brand palette, specifically to verify my suspicion that turquoise `#00B7BD` on white fails contrast for text.

**Brief passed:** Cognition — NewGlobe brand mandates navy #1F3B90 + turquoise #00B7BD. Tone: clean/clear/bright/inclusive. WCAG AA min, AAA where feasible. Audience makes policy decisions from the output. Asked to flag a11y concerns, especially turquoise on white.

**Output summary:** Role prompt (OKLCH theory, 10-step scale generation, dark-mode mapping strategy), brief restated, and then **a concrete deterministic seed palette** — primary ramp (50–900 based on a derived blue `#2d56d2`, NOT the brand navy), neutral ramp, and semantic feedback colors. Plus an instruction at the end: "Respond with a refined palette."

**What dwc did well:**
- **First tool in the pass that produced actual values, not just guidance.** The 10-step primary + neutral + semantic seeds are usable starting points.
- The "respond with a refined palette" coda is honest about its role — it's a seed, not a final.
- OKLCH-based scale generation philosophy is sound; the neutral ramp (`#fafafa → #18191b`) reads as a thoughtful system, not eyeballed values.

**What dwc missed / got wrong:**
- **Didn't compute or flag the turquoise-on-white contrast issue even though the brief asked for it explicitly.** The brief says "especially turquoise on white, which I suspect may fail contrast" and the tool simply doesn't address it. The seed palette doesn't include turquoise at all.
- **Derived a different primary (#2d56d2) from the `#1F3B90` accent input, instead of using #1F3B90 directly.** For a brand where the hex is *mandated*, this is a quiet divergence that the caller has to catch.
- No WCAG contrast ratios in the output. The role prompt talks about 4.5:1 and 3:1 thresholds but the seed palette doesn't ship computed ratios per pairing.

**Gap surfaced:** Two distinct gaps:
1. **Audit mode.** When `accent` is provided as a brand-mandate, `color-specialist` should treat it as the final primary-500 (not a seed to derive from) and compute a ramp around it. An explicit `mode: "audit" | "generate"` flag would solve this.
2. **Contrast ratios shipped with every token.** The output should include per-pairing contrast (token-on-white, token-on-primary, token-on-surface) so the caller can adopt safely. Right now the caller (me) has to compute them by hand.

**Decision:** Adopted only the *structural* shape of the seed (10-step ramp idea, neutral-hue intent). Discarded the generated primary ramp (wrong root hue) and computed my own contrast ratios:
- `#1F3B90` (navy) on `#FFFFFF` → **10.04:1** (AAA ✓)
- `#00B7BD` (turquoise) on `#FFFFFF` → **2.46:1** (FAIL, even for 3:1 large-text)
- `#00B7BD` with white text on it → **2.46:1** (FAIL, same ratio inverted)
- `#231F20` (brand black) on `#FFFFFF` → **18.12:1** (AAA ✓)

**Action for Cognition:** Turquoise cannot be used for text or for backgrounds with white text. Revoke those usages and swap to navy. Document in `DESIGN_COMPARISON.md` as an a11y override of the brand manual.

---

### typography-specialist — 2026-04-17

**Context:** Wanted a type scale recommendation. Brand mandates Arial; I wanted to see whether dwc would respect that or recommend a webfont.

**Brief passed:** Arial-only (mandated), editorial/considered tone, de-bubbled AI prose at 68ch, user pills right-aligned, base 15px, no heading weight bloom (no 700/800).

**Output summary:** Role prompt (type theory, scale ratios, line-height bands, measure guidance), brief restated, then **a concrete clamp()-based scale** (display through caption, ratio 1.2 as requested).

**What dwc did well:**
- Seed scale is well-formed: fluid clamp() values, sensible line-heights per size band (1.05 display, 1.5–1.55 body), pre-labelled with semantic names.
- Respected the ratio input (1.2).
- Role prompt explicitly says "body line-height 1.5–1.65 for readability unless the brief overrides" — which matches Cognition's 1.65 body leading.

**What dwc missed / got wrong:**
- **Didn't honor the "no 700/800" constraint.** Display and h1 weights come back at 700 despite the brief explicitly asking to avoid that. The caller has to post-process.
- **Didn't address the Arial mandate.** The scale is font-agnostic, which is fine, but the role prompt suggests font pairings (Inter, IBM Plex, etc.) as if webfonts were on the table. For Arial-constrained briefs, pairing guidance is irrelevant — the tool should detect that and skip.
- Seed includes `display` (~51px) which Cognition doesn't need (utility product, no marketing hero). Not wrong, but noise for this brief.

**Gap surfaced:** Type-scale generator should honor explicit weight ceilings and font-family mandates from the brief. A `maxWeight` param and a `fontFamily: "Arial" | "system" | "Inter"` hint would close this.

**Decision:** Adopted the semantic size names (h1 through caption) and the clamp() technique. Cap all heading weights at 600. Skip `display` — Cognition doesn't need it.

---

### spacing-specialist — 2026-04-17

**Context:** Chat interface with sidebar + content area. Wanted to validate Cognition's existing rhythm (mb-10 AI, mb-8 user, 4px Tailwind base) against a fresh recommendation.

**Brief passed:** Chat interface, 260px sidebar + main, de-bubbled AI at 68ch, generous rhythm (mb-10/mb-8), desktop-first with mobile drawer, generous density intent.

**Output summary:** Role prompt (4px/8px grid theory, padding-vs-margin conventions, density modes, clamp() for responsive), then **a concrete 12-step non-linear spacing scale** (0, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px) with rem values.

**What dwc did well:**
- Non-linear scale is the right call for a generous-density product — steps grow faster at the top (16 → 24 → 32 → 48) which matches section-separation needs.
- Role prompt includes specific component patterns (button padding, card padding, form spacing) that I can cite verbatim in DESIGN.md.
- Density-mode discussion (compact/comfortable/spacious multipliers) is a good future hook.

**What dwc missed / got wrong:**
- **Didn't reference Tailwind CSS v4.** Brief said "Tailwind CSS v4 compatible (4px base)" and the output is framework-agnostic CSS vars. Tailwind v4 ships its own spacing scale; the question isn't "what scale should Cognition have" but "does Cognition need additional tokens on top of Tailwind's, or should it rely on Tailwind?"
- **Didn't address the 68ch measure cap** even though the brief called it out as a constraint. Would have been a good spot to recommend a `--measure-prose: 68ch` token.

**Gap surfaced:** Spacing specialist should detect and defer to framework defaults when a framework is specified. In Tailwind projects, the answer is often "use Tailwind's scale, add prose-measure + layout-width tokens on top," not "ship a parallel 12-step scale."

**Decision:** Discarded the parallel scale (Tailwind's default is sufficient). Adopted only the prose-measure token idea and the density-mode hook as a future roadmap item for Cognition.

---
