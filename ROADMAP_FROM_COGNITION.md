# Roadmap from Cognition

**Last updated:** 2026-04-17
**Derived from:** [`FIELD_NOTES_COGNITION.md`](./FIELD_NOTES_COGNITION.md) — the evidence base for every claim here.

---

## Preamble

On 2026-04-17 the author dogfooded dwc on Cognition — a real Next.js project with an existing NewGlobe-brand design system. The session produced the field notes linked above: six patterns, seven per-invocation entries, four appendices.

This file is the *derived roadmap*. Each challenge from the session is paired with the solution thesis we discussed, sized for effort, prioritized, and annotated with dependencies. A skimmable action queue lives at the bottom. A concrete before/after replay of the Cognition session lives in the middle so the roadmap's value is obvious, not abstract.

Implementation plans for any single item should be written separately when the item is picked up — this file is the bridge from "what we learned" to "what to build next," not the build itself.

---

## 1. Challenges → Solutions

### C1. dwc is a knowledge-injection tool, not a workflow engine

**The challenge.** Across all seven calls in the Cognition session, every tool returned a role prompt and a deterministic seed. None returned synthesis, next-step recommendations, or even awareness that the caller was mid-project. The calling LLM (Claude) did every piece of decision work.

**What we saw.** After calling `design-brief`, `design-system-architect`, `color-specialist`, `typography-specialist`, and `spacing-specialist`, the author's literal words were: *"Why isn't dwc helping me decide what needs to be done next?"* (See FIELD_NOTES Pattern 1, Appendix D.)

**Proposed solution.** Ship a `design-next-step` tool. It takes (a) the token's recent event history and (b) an optional state summary, and returns **one paragraph** naming the next highest-leverage action and the reasoning. This is the first dwc thing that would feel like a partner, not a library.

**Size:** M (~1–2 weeks)
**Priority:** P0
**Dependencies:** None for a v0 (uses existing event history). Becomes stronger after C9 and C10 ship (project profile + memory).

---

### C2. Every specialist assumes fresh-start, not audit-existing

**The challenge.** Cognition has a working themes.css with 60+ tokens aligned to a brand manual. Every specialist returned a fresh seed anyway. For any project past day one, ~70% of each tool's output is a parallel system the caller has already decided against.

**What we saw.** `color-specialist` was given `accent: "#1F3B90"` (Cognition's mandated navy) and returned a 10-step ramp derived around `#2d56d2` — a different primary. `design-system-architect` was told about the existing 60+ CSS variables and returned generic 3-layer token theory with no reference to the actual tokens. (See FIELD_NOTES Pattern 2, color-specialist entry, design-system-architect entry.)

**Proposed solution.** Add an explicit `audit` mode (or `existingTokens` / `currentConfig` input) to every specialist. When the caller passes current state, the tool returns a **diff + gap list + specific recommendations**, not a fresh seed. Tool internally branches: if `audit` mode, skip generation, do diagnosis.

**Size:** M per specialist (~1 week each). Start with `color-specialist` because a11y is the loudest failure case.
**Priority:** P0
**Dependencies:** None. Self-contained per tool.

---

### C3. Tools don't honor explicit asks in the brief

**The challenge.** The brief for `color-specialist` literally said *"flag any accessibility issues with the mandated brand palette — especially turquoise on white, which I suspect may fail contrast."* The tool returned a seed palette, no turquoise analysis, no contrast ratios. The caller computed 2.46:1 by hand.

**What we saw.** The contrast failure (turquoise `#00B7BD` on white → 2.46:1, fails WCAG AA at 4.5:1 for normal text and even the 3:1 large-text threshold) was only surfaced because the calling LLM did the math. dwc itself was silent. (See FIELD_NOTES color-specialist entry, Pattern 3.)

**Proposed solution.** Add a pre-processing step inside every tool's wrapper that parses the brief for **literal asks** — questions, imperatives, "especially X" phrases — and answers them first, before the default output shape. Essentially: each tool's prompt gains a preamble that says *"first, extract explicit questions and constraints from the brief and address them. Then continue with the standard output."*

**Size:** S (~2–3 days to prototype, a week to roll across every tool).
**Priority:** P0
**Dependencies:** None. Pure prompt-engineering change in `commands/*.md`.

---

### C4. Tools don't cross-reference each other's output

**The challenge.** `color-specialist` doesn't know `typography-specialist` was called five minutes earlier in the same session. Each tool is a silo. For a system where color + type + spacing are supposed to form a coherent whole, this is a compositional gap.

**What we saw.** Five specialists ran in parallel on the Cognition brief. Each returned its scale in isolation. The caller (Claude) had to do the reconciliation manually in what would have become `DESIGN_COMPARISON.md`. No specialist output said "given your choice of ratio 1.2 in typography, these are the spacing values that maintain vertical rhythm." (See FIELD_NOTES Pattern 4.)

**Proposed solution.** Two paths, pick one:
- **Lightweight:** each specialist's output ends with "next related calls: X, Y" generated from the caller's recent event history.
- **Stronger:** ship a `design-synthesize` tool that reads the last N events for the token and returns one unified token set reconciling color + type + spacing.

The stronger path is better but bigger. Lightweight is shippable in a day and unblocks the feel-improvement.

**Size:** S (lightweight) / L (synthesize tool) — ~3 days / ~2–3 weeks
**Priority:** P1
**Dependencies:** Lightweight: needs event-history read access inside the tool (already exists server-side). Stronger: needs C10 (memory) to be robust.

---

### C5. Framework awareness is missing

**The challenge.** `spacing-specialist` was told *"Tailwind CSS v4 compatible (4px base)"* in the brief and returned a parallel 12-step CSS-var scale ignoring Tailwind entirely. For a Tailwind project, the right answer is "use Tailwind's default scale; add a `--measure-prose: 68ch` token on top," not a new scale.

**What we saw.** The output shipped `--space-0` through `--space-10` (0–128px) as if no spacing tokens existed. A caller trying to adopt it would either end up with two parallel scales or have to manually reconcile. (See FIELD_NOTES spacing-specialist entry, Pattern 5.)

**Proposed solution.** When `stack` or a framework hint is passed (React + Tailwind v4, Next.js + shadcn, etc.), the tool should **prefer framework-native tokens** and recommend only additions, not parallel systems. For each supported framework, keep a small map of "what's already provided" so the tool can scope its output to "what's missing."

**Size:** M (~1 week to build the framework registry + wire it into all specialists).
**Priority:** P1
**Dependencies:** None. Pure content change to the specialist prompts + a small registry table.

---

### C6. Role prompt dominates the token budget

**The challenge.** Every tool's return leads with ~1,500–2,500 tokens of role/expertise/guidelines before the brief is even restated. That's ~2k tokens of boilerplate per call; in a 10-call free tier, the role prompt is transmitted 10 times to the same caller.

**What we saw.** Each MCP tool result in the session was dominated by `## Role:`, `## Expertise`, `## Guidelines`, `## Design Principles`, `## Anti-patterns`, `## Checklist`. Tasty to read once; wasteful at every call. (See FIELD_NOTES Pattern 6.)

**Proposed solution.** Move the role prompt **server-side as system context** for an LLM call inside the tool. The tool's return to Claude becomes the *result* (seed values + analysis + next-step), not the instructions that produce it. Two side-benefits: (a) the companion can display the clean output without noise, (b) gating-per-call becomes cheaper and more honest.

**Size:** M (~1 week) — but invasive; coordinate with C7 (output shape changes) to avoid double-work.
**Priority:** P1
**Dependencies:** None technically. Benefits from being bundled with C7.

---

### C7. Raw MCP output is low-value without Claude

**The challenge.** The MCP tool output is shaped for an LLM to read and synthesize. A designer running `npx designwithclaude color-specialist "..."` from a terminal with no Claude in front of them gets ~2k tokens of text dumped to stdout, mostly role prompt. Without Claude, the output isn't a deliverable — it's reference material.

**What we saw.** During the session, every call was valuable because Claude read it and did the synthesis. Pulled out of that context, the raw output is only useful to another LLM. The companion mitigates this *in theory* (human-readable event log) but the companion shows events not synthesized output.

**Proposed solution.** **Pick a product mode and design for it explicitly:**
- **Mode A: Claude-in-the-loop.** Double down on the role-prompts-as-context approach. Make the tool outputs even richer for Claude. The companion becomes a lightweight history, not a destination. Positioning: "dwc makes Claude a better designer."
- **Mode B: Designer-direct.** Invest in the companion as the primary surface. MCP tools become thin pipes that emit rich events. Renderers (`PaletteRenderer`, etc.) do the heavy lifting on the companion. Positioning: "dwc is where your design system gets built."

Right now dwc is halfway between and serving neither well. The choice isn't a one-week ship; it's a direction that should inform P0–P2 priorities across the board. (See FIELD_NOTES Appendix B, Appendix C.)

**Size:** The decision is S (a day of thinking + writing). The consequences of the decision are months of work.
**Priority:** P0 **as a decision**, even though implementation is spread.
**Dependencies:** None — but everything else inherits from this decision.

---

### C8. Companion is a log viewer, not a workspace

**The challenge.** When the author opened `designwithclaude.com/companion?token=...` mid-session, the page showed a feed of events ("color-specialist ran at 14:32") with no synthesized output, no usable artifact, no next-step recommendation. The literal reaction: *"I have no other way to go from there. Are they even of any value?"*

**What we saw.** The renderers exist in the codebase (per PROGRESS.md Phase 2 Done: `PaletteRenderer`, `TypeScaleRenderer`, `SpacingRenderer`, `ComponentSpecRenderer`, `CopyRenderer`, `MarkdownRenderer`) but aren't wired to the event stream in a way that produces a reviewable artifact. The companion is plumbing that doesn't plumb through to a destination.

**Proposed solution.** Three sequential moves:
1. **Render the synthesized output, not event metadata.** When `color-specialist` runs, the companion shows the palette via `PaletteRenderer` with contrast ratios computed live, not a timestamped row.
2. **Chain forward.** Under the rendered output, show the next-step recommendation from C1 as a sticky card. Companion becomes a guided workspace.
3. **Export something.** "Copy as CSS variables" / "Download tokens.json" / "Open in Tailwind config." Give the designer a takeaway artifact.

**Size:** M–L (~2–3 weeks for all three). First move alone is ~1 week and unblocks the rest.
**Priority:** P1 (if Mode B is chosen in C7) / P2 (if Mode A is chosen — in which case simplify the companion instead of investing)
**Dependencies:** C7 decision first. C1 feeds move #2. C2 feeds move #1 (audit results need to render well).

---

### C9. No onboarding when calling from a new project

**The challenge.** The author opened Claude Code in the Cognition project, called a dwc tool, and had to re-state the entire project context in every tool brief because dwc had no concept of "this is a project I'm working on." The lived experience: *"As a vibecoder... when I started working for Cognition, I called dwc and I was lost."*

**What we saw.** dwc was installed at user scope (visible in `~/.claude.json`) but had no profile for `/Users/imranmohammed/cognition`. The `/start` wizard flow is web-based and happens once per token — there's no per-project onboarding when a vibecoder opens a new repo.

**Proposed solution.** First-call-in-new-project detection:
- The MCP server keys some state to the caller's `cwd` (hash it for privacy) or a project-scoped token minted on first call.
- First call in an unrecognized cwd returns an **onboarding response**: "I don't have a profile for this project yet. Quick questions — what is this, who's it for, brand constraints, stack, existing tokens?" Claude can ask the user and re-submit with answers.
- Subsequent calls inherit the stored context. No re-briefing.
- Optional: auto-detect `package.json`, `tailwind.config.*`, `themes.css` with permission so fewer questions need asking.

**Size:** M (~1–2 weeks including schema + API + prompt changes). Benefits from Supabase already being in place (per PROGRESS.md Phase 3).
**Priority:** P0 — this is the specific "I was lost" moment the author named.
**Dependencies:** None. Foundation for C10.

---

### C10. No memory across calls in the same session

**The challenge.** Even within one session, each tool call is stateless from the server's perspective. The event history exists but isn't read by the specialists themselves. Decisions made five minutes ago don't inform decisions being made now.

**What we saw.** After calling `color-specialist`, the next call to `typography-specialist` had no awareness of the previous call. If the author had said "pair the type with the palette we just generated," the tool wouldn't know what palette. (See FIELD_NOTES Appendix B.)

**Proposed solution.** Tools read the last N events for the caller's token (or project profile after C9 ships) and factor them into their response. The server already emits events — it just doesn't read them back for context. A small API method (`getRecentEvents(token, projectId, limit)`) feeds the tool prompt with recent decisions.

**Size:** S–M (~3–5 days for core read path + specialist prompt updates).
**Priority:** P1
**Dependencies:** C9 helps (project profile gives a scope for "recent"), but not strictly required for a session-scoped MVP.

---

## 2. The Cognition replay — before/after

Five turns from the actual Cognition session, shown as they happened vs how they should happen after the P0 items ship.

### Turn 1 — First call on a new project

**Today:**
> Author opens Claude Code in `/Users/imranmohammed/cognition`, calls `hello-world`.
> dwc returns: `"Hello, designer — designwithclaude MCP server is alive."`
> No awareness that this is a new project.

**After P0 (C9 shipped):**
> Author calls any dwc tool first time in this cwd.
> dwc detects no project profile, returns:
> *"I don't have a profile for Cognition yet — quick questions:
>  1. What is it (one sentence)?
>  2. Who uses it?
>  3. Any brand constraints (palette, font, tone)?
>  4. Stack?
>  5. Any existing tokens or brand manual I should read? Drop a file path.*
>  *I'll remember the answers for every future call in this directory."*

---

### Turn 2 — Asking about existing tokens

**Today:**
> Author calls `design-system-architect` with a brief describing 60+ CSS variables.
> dwc returns 2,500 tokens of generic 3-layer token theory with no reference to Cognition's actual tokens.

**After P0 (C2 + C9 shipped):**
> dwc detects `/Users/imranmohammed/cognition/src/styles/themes.css` from the project profile.
> Returns:
> *"I read your themes.css. 60+ CSS variables, semantic naming, light/dark overrides via `html[data-theme="dark"]`.*
> *Three things worth flagging:*
> *1. 🔴 Turquoise #00B7BD on white = 2.46:1 — fails WCAG AA. You're using it for secondary labels.*
> *2. 🟡 No primitive token layer. Fine for project size; add if you need multi-theme later.*
> *3. 🟢 Type scale isn't fluid. Low priority.*
> *Fix #1 first?"*

---

### Turn 3 — Explicit contrast-flag ask

**Today:**
> Author calls `color-specialist` with brief: "especially turquoise on white, which I suspect may fail contrast."
> dwc returns seed palette derived from a different primary; no contrast analysis; no mention of turquoise.

**After P0 (C3 shipped):**
> `color-specialist`'s pre-processor parses the brief, finds the explicit ask, answers it first.
> Returns:
> *"Addressing your explicit ask first: turquoise #00B7BD on white = 2.46:1. Fails WCAG AA (needs 4.5:1) even for large text (needs 3:1). Do not use for text or as a background with white text.*
> *Alternatives:*
> *(a) Swap to navy for these pairings — 10:1 AAA.*
> *(b) Introduce a darker turquoise `#007378` = 4.52:1 AA, preserves brand echo.*
> *Generated palette below follows your accent."*

---

### Turn 4 — Opening the companion

**Today:**
> Author opens `/companion?token=...`. Sees a list of events: *"color-specialist ran at 14:32 / typography-specialist ran at 14:33..."* Nothing actionable.

**After P1 (C8 shipped, assuming Mode B):**
> Companion shows:
> - **Top banner:** "Next step: fix contrast failure on turquoise — 2 files affected. [Generate diff]"
> - **Palette section:** Live `PaletteRenderer` with computed contrast ratios per pairing. Failing ones highlighted.
> - **Type scale section:** `TypeScaleRenderer` showing the scale with live preview.
> - **Export strip:** [Copy as CSS variables] [Download tokens.json]

---

### Turn 5 — Deciding what to do next

**Today:**
> Author has run 6 tools, has a pile of role prompts and seed values, and asks: *"Why isn't dwc helping me decide what needs to be done next?"*

**After P0 (C1 shipped):**
> Every tool's return ends with:
> *"**Next:** Based on your recent calls and Cognition's state, your highest-leverage action is `color-specialist` in audit mode on your secondary-label pairings. Reason: the contrast issue blocks ship. Run it or say 'skip' to move on."*

---

## 3. Prioritized action queue

Pulled from the size/priority annotations in Section 1, reorganized by sequence.

### Decide first
- **C7. Product-mode decision** (Claude-in-the-loop vs designer-direct). This informs everything. Day of thinking, then write it down.

### Ship first (P0 — enables the "senior designer" feel)
1. **C3. Explicit-ask parser in every tool's wrapper** (~3 days). Smallest, highest-impact. Stops the turquoise-on-white class of silent failures immediately.
2. **C2. Audit mode on `color-specialist`** (~1 week). Ships the "I read your tokens" experience for the loudest failure case.
3. **C1. `design-next-step` tool** (~1–2 weeks). Turns dwc from library to partner. Use even a naive implementation at first — it's directional value, not precision.
4. **C9. First-call-in-new-project onboarding** (~1–2 weeks). Fixes the "I was lost" moment directly.

### Ship next (P1 — compounds on P0)
5. **C2 cont. Audit mode on typography, spacing, architect** (~1 week each).
6. **C10. Memory across calls within a session** (~3–5 days). Pairs with C9.
7. **C5. Framework awareness** (~1 week).
8. **C8. Companion renders synthesized output + next-step card + exports** (~2–3 weeks). Conditional on Mode B in C7.
9. **C4. Cross-tool references (lightweight version)** (~3 days).

### Revisit later (P2 — only if Mode B + we're ready for a bigger shift)
10. **C6. Move role prompts server-side** (~1 week, bundled with whatever output-shape change accompanies it).
11. **C4 stronger — `design-synthesize` tool** (~2–3 weeks).

---

## 4. What this file is NOT

This isn't a full dwc product strategy, a design spec, or implementation-ready code. It's a bridge between research (`FIELD_NOTES_COGNITION.md`) and shipping. When any item above is picked up for build, the implementation plan lives in a separate doc — tracing back here for the "why," and to the field notes for the evidence.

It's also not a complete list of everything dwc could become. It's specifically the list of gaps *this session surfaced*. Other gaps exist; they're not in scope here.
