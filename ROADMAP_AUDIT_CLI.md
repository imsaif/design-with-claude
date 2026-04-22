# Roadmap — `dwic audit` CLI (alpha.3)

**Started:** 2026-04-22
**Target ship:** alpha.3 on npm, ~1–2 days of build after alpha.2 is published
**Strategic frame:** The CLI is the **hook** — zero-friction, shareable, top-of-funnel. The MCP server stays the **habit** — the ongoing conversational auditor designers live in. Same audit brain under both.

---

## Why

Alpha.2 makes dwic substantively truthful ("design auditor inside Claude Code", 9 of 14 V2 tools audit server-side). But the install cost for a first impression is still too high — every lead has to go through token → setup CLI → `.mcp.json` → Claude Code restart before they see *any* output.

`dwic audit` collapses that to one line:

```
npx @imrandwc/dwic audit
```

No token. No Claude Code. No project profile. Just: here's a dashboard of what's broken in your design system, and here's what to run inside Claude Code to fix each category.

The report is the distribution asset. A clean terminal screenshot is what ships on X, Reddit, the Anthropic Discord — not another landing page.

---

## UX spec — what the output looks like

```
dwic audit • /Users/imran/cognition
Scanned: themes.css (32 tokens) · 14 components · package.json
───────────────────────────────────────────────────────────────

  Color           ⚠  3 findings    2 AA fails · mandated #1F3B90 missing
  Typography      ·  clean          12 tokens, 1.25 ratio
  Spacing         ⚠  1 finding      3 off-grid values at 13px, 21px, 27px
  Accessibility   ✗  7 findings     2 errors · 5 warns
  Forms           ✗  2 findings     1 unlabeled input · 1 missing fieldset
  Navigation      ·  clean
  Motion          ✗  1 error        no @media (prefers-reduced-motion)
  Copy            ⚠  4 findings     2 weak CTAs · jargon ("leverage")

───────────────────────────────────────────────────────────────
  8 categories · 18 findings · 3 errors · 12 warnings · 3 info

Run any specialist inside Claude Code for the full detail + fixes:

  > color-specialist with mode:"audit"           — fix the 2 AA fails
  > accessibility-specialist with mode:"audit"    — fix the 7 a11y issues
  > motion-designer with mode:"audit"             — add the reduced-motion guard

Report written to .dwic/audit-2026-04-22.md

Install dwic to run these inside Claude Code:
  npx @imrandwc/dwic setup --token=<get one at designwithclaude.com/start>
```

### Design principles for this output

- **Fit on one screen.** Screenshot on a MacBook terminal without scrolling. Cap at ~30 lines.
- **Severity glance.** Red (✗ errors) > yellow (⚠ warnings) > dim (· info/clean). Sort categories with errors first so the worst stuff is visible above the fold.
- **One-line gist per category.** Not a list — the most actionable 1–2 problems, comma-separated.
- **Suggested follow-ups are MCP tool calls, not CLI calls.** CLI is the hook; MCP is the product. Never say "run `dwic audit --deep color`" — always "run `color-specialist inside Claude Code`".
- **Written report is a markdown file.** `.dwic/audit-<YYYY-MM-DD>.md` — checkable into git, postable to Notion, copyable into Slack. Include full findings (not just the summary).
- **Exit code mirrors severity.** 0 = all clean. 1 = warnings. 2 = errors. Lets CI pipelines gate on it later.
- **`--no-telemetry` opt-out, loud first-run telemetry notice.** Print a one-line "dwic pings a counter — `--no-telemetry` to disable" on the very first run; never again. Store an opt-out marker in `~/.dwic/state.json`.

---

## Architecture

### Flow

```
argv → parse subcommand
     ↓
if subcommand === "audit":
     ↓
detectProjectConfig(cwd)  ← already exists (C9 slice 3)
     ↓
walk filesystem for audit inputs:
  - token CSS files (themes.css / tokens.css / globals.css in root + src/ + src/styles/ + app/)
  - HTML/JSX/TSX files under src/ (capped at ~200 files, skip .next/node_modules/dist)
     ↓
run each audit helper on the matched inputs:
  - color:   parseTokensFromCss + auditContrast + mandated-accent check
  - type:    auditTypography
  - spacing: auditSpacing
  - a11y:    runA11yAudit on every HTML/JSX file, aggregate
  - form:    runFormAudit, aggregate
  - nav:     runNavAudit, aggregate
  - motion:  runMotionAudit on collected CSS
  - copy:    runContentAudit on collected JSX (CTAs + headings)
     ↓
aggregate Finding[] per category → CategoryResult { category, severity, findings, oneLineGist }
     ↓
renderDashboard(results) → stdout
renderMarkdownReport(results) → .dwic/audit-<date>.md
emitTelemetry(results)  ← fire-and-forget POST to /api/events with __cli.audit.summary__
     ↓
exit(worstSeverity)
```

### Reuse (do not reimplement)

- `src/utils/detect-project-config.ts::detectProjectConfig` — already walks `package.json`, scans common CSS locations, infers framework + tech stack + slug. Use as-is for the "Scanned: …" header.
- `src/tools/color.ts::parseTokensFromCss` + `contrastRatio` + `auditContrastMatrix` — all pure.
- `src/tools/typography.ts::runTypographyAudit`
- `src/tools/spacing.ts::runSpacingAudit`
- `src/tools/accessibility.ts::runA11yAudit`
- `src/tools/form.ts::runFormAudit`
- `src/tools/navigation.ts::runNavAudit`
- `src/tools/motion.ts::runMotionAudit`
- `src/tools/content.ts::runContentAudit`
- `src/api-client.ts::ApiClient.emitEvent` — telemetry hop reuses the event pipe

### New code (~350 lines total)

| File | Purpose | Size |
|---|---|---|
| `src/bin/audit.ts` | CLI entry — argv parsing, top-level orchestration | ~80 lines |
| `src/audit/walker.ts` | File walker that finds CSS + HTML/JSX inputs, with the same skip set as the detector (`.next`, `node_modules`, `dist`, `.git`, `.dwic`) | ~60 lines |
| `src/audit/aggregator.ts` | Composes per-category `CategoryResult` by calling the existing audit helpers | ~90 lines |
| `src/audit/dashboard.ts` | ANSI-rendered terminal output (severity icons, columns, follow-up suggestions) | ~70 lines |
| `src/audit/markdown-report.ts` | Full findings markdown for `.dwic/audit-<date>.md` | ~50 lines |
| `src/audit/telemetry.ts` | Fire-and-forget event emit + first-run opt-out notice | ~40 lines |

---

## File-by-file breakdown

### `src/bin/audit.ts`

```typescript
#!/usr/bin/env node
import { parseAuditArgs } from "../audit/args.js";
import { detectProjectConfig } from "../utils/detect-project-config.js";
import { walkProject } from "../audit/walker.js";
import { aggregate } from "../audit/aggregator.js";
import { renderDashboard } from "../audit/dashboard.js";
import { writeMarkdownReport } from "../audit/markdown-report.js";
import { emitAuditTelemetry } from "../audit/telemetry.js";

async function main() {
  const args = parseAuditArgs(process.argv);
  const cwd = args.cwd ?? process.cwd();

  const detected = detectProjectConfig(cwd);
  const inputs = walkProject(cwd, args.overrides);
  const results = aggregate(inputs);

  process.stdout.write(renderDashboard(detected, inputs, results));
  const reportPath = writeMarkdownReport(cwd, detected, results);
  process.stdout.write(`\nReport written to ${reportPath}\n`);

  if (args.telemetry) await emitAuditTelemetry(results, detected);

  const worst = results.reduce((w, r) => Math.max(w, severityScore(r.severity)), 0);
  process.exit(worst);
}
```

### `src/audit/walker.ts`

- Takes `cwd` + optional overrides `{ css?: string[], markup?: string[] }`.
- Auto mode: walks from cwd, respects a skip set (`.git`, `node_modules`, `.next`, `dist`, `.dwic`, `coverage`, `build`).
- Collects files by extension: `.css` (token candidates first — files matching TOKEN_CSS_CANDIDATES prioritized; fall back to any .css with `--color-*` or `--space-*` tokens), `.html`, `.jsx`, `.tsx`.
- Caps at 200 markup files (flag with `--max-files=N`).
- Returns `{ cssFiles: string[], markupFiles: string[], cssContent: string, markupContent: string }` — content is pre-concatenated since every audit helper accepts one big string.

### `src/audit/aggregator.ts`

- Interface:
  ```typescript
  export interface CategoryResult {
    category: "color" | "typography" | "spacing" | "accessibility" | "form" | "navigation" | "motion" | "copy";
    severity: "clean" | "info" | "warn" | "error";
    findings: Finding[];  // union of the per-helper Finding types
    oneLineGist: string;  // what the dashboard renders
  }
  export function aggregate(inputs: WalkedInputs): CategoryResult[]
  ```
- Calls each helper with the appropriate input (css for color/type/space/motion/dsa; markup for a11y/form/nav/copy).
- Picks the worst severity across each helper's findings.
- Computes `oneLineGist` by topic:
  - color: "N AA fails · mandated #HEX missing" or "clean"
  - a11y: "N errors · M warns"
  - motion: "no @media (prefers-reduced-motion)" or duration specifics
- Enforces a ~55-char cap on the gist.

### `src/audit/dashboard.ts`

- Pure string rendering — no side effects.
- Emits:
  1. Header line: `dwic audit • <cwd>`
  2. Scanned line: `Scanned: <cssFiles> (<N> tokens) · <M> components · package.json`
  3. Divider
  4. One row per category (8 rows, fixed order): `  <Category>        <sevIcon>  <countLabel>    <gist>`
  5. Divider
  6. Summary totals: `N categories · X findings · Y errors · Z warnings · W info`
  7. "Run any specialist inside Claude Code for the full detail + fixes:" block with up to 3 MCP tool-call suggestions, chosen by worst severity.
  8. `Report written to ...`
  9. Install CTA block.
- ANSI colors via tiny hand-written helpers (don't pull in `chalk` — keep dependencies flat). Respect `process.env.NO_COLOR` and `process.stdout.isTTY`.

### `src/audit/markdown-report.ts`

- Writes `.dwic/audit-<YYYY-MM-DD>.md` (mkdir -p).
- Same categories, full findings list per category (not capped), with timestamps + `detectedProjectConfig` header.
- Ends with "Next steps" — the same 3 specialist suggestions as the terminal output.
- Returns the absolute path for the CLI to echo back.

### `src/audit/telemetry.ts`

- First-run opt-out notice: check `~/.dwic/state.json`; if `telemetryNoticeShown` is falsy, print a one-line notice + set the flag.
- `emitAuditTelemetry(results, detected)`:
  - Payload: `{ version, framework: detected.framework, categoryTotals: {color: 3, a11y: 7, ...}, errorCount, warnCount, infoCount }` — no file contents, no file paths, no PII.
  - Fire-and-forget POST to `/api/events` with `toolName: "__cli.audit.summary__"` and a deterministic pseudo-token derived from `~/.dwic/state.json::clientId` (generated on first run; anonymous).
  - Timeout 2s. Never blocks exit.
- `--no-telemetry` flag AND `DWIC_TELEMETRY=off` both opt out.
- Client ID lives at `~/.dwic/state.json::clientId`. Opt-out persists at `~/.dwic/state.json::telemetryOptOut`.

---

## Wiring

- **`package.json` bin:** add `"dwic-audit": "dist/bin/audit.js"` (separate bin so `npx @imrandwc/dwic audit` stays the UX but Node resolves cleanly).
- **Subcommand dispatch:** extend `src/bin/setup.ts::parseArgs` to recognise `audit` as a command, and at the bottom of `main()` delegate to `audit.ts::main()` via dynamic import when `command === "audit"`. Keeps the `dwic` entry point unified.
- **chmod-bins script:** already chmods everything in `dist/bin/`; no change.
- **README:** add a "First time? Try `npx @imrandwc/dwic audit`" block above the existing setup instructions.

---

## Testing

### New test scripts

| Script | What it covers | ~Assertions |
|---|---|---|
| `scripts/test-audit-walker.mjs` | File walker on fixture dirs — finds token CSS, skips `node_modules`/`.next`, respects `--max-files`, handles empty dirs | 8 |
| `scripts/test-audit-aggregator.mjs` | Aggregator composes CategoryResults correctly — severity escalation, gist truncation, clean-category handling | 15 |
| `scripts/test-audit-dashboard.mjs` | Dashboard renderer — correct icons, respects NO_COLOR, one-screen cap, category ordering | 10 |
| `scripts/test-audit-markdown-report.mjs` | Report writer — path format, section structure, no PII leak | 6 |
| `scripts/test-audit-cli-e2e.mjs` | End-to-end against a fixture "intentionally broken" project | 8 |

### Fixture project

- New dir `examples/broken-project/` in the repo with:
  - `package.json` (Next.js 15, Tailwind v4, TypeScript)
  - `src/styles/themes.css` with deliberate contrast fail (turquoise on white), mandated accent missing
  - `src/components/Signup.tsx` with unlabeled input, missing fieldset, weak CTA ("Click here")
  - `src/styles/motion.css` with `transition: all 1500ms` and no reduced-motion guard

Both the e2e test and the demo screen-recording target this fixture.

---

## Publishing + distribution

### npm
- Bump to `1.0.0-alpha.3` when code-complete.
- Smoke-test `npx @imrandwc/dwic@alpha.3 audit` from a clean tmp dir + the fixture project before publishing.
- Keep `latest` tag pointing at alpha.3 once verified.

### Screen recording (designer owns this)
- 60s max. Terminal + one browser tab (the project). Narrate 2 problems the audit surfaces.
- Post locations, in order: Anthropic Discord #showcase, r/ClaudeAI, X with #ClaudeCode, Medium if you have one.
- Don't optimise the video for polish — optimise for "this is real code finding real problems".

### Telemetry we watch for a week after launch
- Unique client IDs pinging `__cli.audit.summary__`
- Avg findings per run (gut check on whether real projects or toy ones are running it)
- Any follow-through: does a client that ran `__cli.audit.summary__` later hit `__mcp.connected__`? That's the CLI-to-MCP funnel metric.
- GitHub issues filed, unprompted shares, "how do I fix X" emails.

---

## Risks + open questions

1. **False positives in the walker.** Reading every .tsx in a big repo pulls in non-component files (hooks, utils). Mitigation: only run a11y/form/nav/copy audits on files that actually contain JSX/TSX elements — cheap regex pre-filter.
2. **Token CSS ambiguity.** `globals.css` is Tailwind's preflight in many projects, not design tokens. Mitigation: prioritise files that match TOKEN_CSS_CANDIDATES *and* contain `--color-*` or `--space-*` declarations; skip `globals.css` that only has `@tailwind` directives.
3. **Performance on large repos.** 200-file cap + quick regex-based audits; shouldn't be an issue, but time the e2e on a real mid-size project before ship.
4. **Telemetry trust.** First-run notice + loud `--no-telemetry` + never logging file content → safe default. Document the exact payload in README so anyone skeptical can verify it's anonymous.
5. **CLI vs MCP tension in the story.** Make sure copy consistently frames CLI as "first look" and MCP as "daily driver" — never let the CLI feel like a lesser MCP.

---

## Sequencing

1. **Ship alpha.2 to npm first** — the working tree is on `origin/main` as of commit `46c0766`. Publish when ready (new automation token needed).
2. **Build alpha.3 on a fresh branch** — `audit-cli` or similar. Merge when tests green + fixture demo works.
3. **Record the screencast against the fixture project.** Don't ship the announcement until the video is cut.
4. **Distribute on one channel at a time.** Anthropic Discord first (warmest, smallest risk), then Reddit, then X. Measure each.
5. **Decision point at day 7.** If telemetry shows the CLI → MCP funnel lighting up, keep building the auditor (batch 4 + non-audit specialists still matter because they deepen what each follow-up specialist can do). If nothing, reassess whether the auditor framing is actually the product — that's real data, not a pivot on vibes.

---

## Out of scope for alpha.3

- `dwic audit --fix` that applies suggested fixes — separate feature, later.
- Per-file drilldown (`dwic audit src/components/Signup.tsx`) — save for when there's demonstrated appetite.
- GitHub Action / pre-commit hook integration — doable later, needs user pull first.
- Competing with Lighthouse / axe — they run live on a browser; dwic audits the source. Different use cases, don't muddy the positioning.
