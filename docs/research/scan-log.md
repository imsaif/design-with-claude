# Research Scout — scan log (candidate board)

Cross-run memory. The agent's git checkout IS its state (no external store): each
run reads this file + existing studies to decide what's already covered, then appends
its own observations and candidate statuses.

**Status values:** `new` · `drafted` · `covered-by-study` · `rejected-thin`

## Candidate angles

| Angle | Status | Note |
|---|---|---|
| Union agent-config adoption curve (first-commit by quarter) | `covered-by-study` | Study #2 — `agentic-terminal` |
| Frontend vs non-frontend split (union) | `covered-by-study` | Study #2 — ~1 in 4 build UI |
| Tool composition (CLAUDE.md/AGENTS.md/other share) | `covered-by-study` | Study #2 scale tiles |
| AI-audited frontend quality scores | `covered-by-study` | Study #1 — `ai-generated-frontends` |
| Multi-fingerprint co-occurrence | `new` | PILOT n=40: ~18% of CLAUDE.md repos also carry AGENTS.md (95% CI 9–32%); others ~0%. Needs n≈250. |
| MCP (`.mcp.json`) adoption among agent-config repos | `new` | PILOT n=40: 0/40 among CLAUDE.md repos (95% CI 0–9%) — low; a different denominator may be needed. |
| Framework mix within the UI-building subset | `new` | Untouched; needs the frontend sub-sample |
| CLAUDE.md size / section conventions | `new` | Untouched |

## Run log

<!-- Newest first. Each run appends one block. -->

### 2026-07-16 — dry-run (local, human-driven validation of the loop)
- **Scanned:** multi-fingerprint co-occurrence among CLAUDE.md repos (n=40 pilot).
  Reused counts: CLAUDE.md ~47K, AGENTS.md ~152K, .cursorrules ~8K (REST floor).
- **Pilot findings (DIRECTIONAL, under-powered):**
  - ~18% of CLAUDE.md repos also carry `AGENTS.md` (95% CI 9–32%, n=40) — a real "hedging across agent tools" signal.
  - `.mcp.json` 0/40, `.cursorrules` 0/40, `.windsurfrules` 0/40 (each 95% CI 0–9%).
  - Pilot CSV: `drafts/2026-07-16-config-cooccurrence-sample.csv`.
- **Decision: NOT drafted.** n=40 is under the n≈250 novelty-gate bar; the AGENTS.md
  co-occurrence CI (9–32%) is too wide to frame a thesis. Logged as a strong `new`
  candidate — run the full sample before drafting. (Guardrail working: the loop
  declined to force a thin draft.)
- **Fix shipped this run:** the collector's Wald CI reported a bogus ±0 at p=0
  (0/40 → "0% ±0pp"). Replaced with the Wilson interval (`stats.mjs`); 0/40 now
  correctly reads 0–9%. Verified: `wilson95(63,278)` reproduces study #2's 18–28%.

### 2026-07-16 — seed
- Scanned: n/a (initial seed).
- Observation: two studies live (`agentic-terminal`, `ai-generated-frontends`); their
  axes marked `covered-by-study` above so the agent doesn't re-draft them.
- Candidate picked: none (seed only).
- ⚠ **For a human — study #2 count provenance.** The collector's REST `search/code`
  gives `CLAUDE.md` ≈ 47K, but study #2 (live) reports ≈ 590K and its method doc §4
  labels that "code-search total_count." REST reproduces AGENTS.md (~152K) but not
  CLAUDE.md, so the ~590K almost certainly came from the github.com web UI (a different,
  larger index), not REST. Study #2's method doc is internally inconsistent on this;
  worth reconciling before a new draft cites any CLAUDE.md scale number.
