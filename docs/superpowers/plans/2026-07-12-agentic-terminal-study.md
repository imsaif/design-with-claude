# Agentic Terminal Study (Design Research #2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the second Design Research study — "How many people build in the terminal with an agent?" — as a Next.js page mirroring study #1, driven by the firmed data.

**Architecture:** A typed data module holds the firmed numbers; a server-component page renders hero + stat tiles + a quarterly adoption bar-chart + a frontend/tool-mix section + a reproducible method box, reusing `research.module.css` (aiux type scale, full-width prose, brand navy). Wire it into the hub index and sitemap.

**Tech Stack:** Next.js 15 (App Router, server components), TypeScript, CSS Modules, Heroicons (already a dep).

## Global Constraints (from the spec — every task inherits these)

- **Numbers are directional.** Use "~", ranges, and the 95% CI. Never a precise multiplier ("2.3×"). Frontend = **23% (±5pp, ~18–28%)**, n=278.
- **State the ceiling.** Fingerprints are a **floor**; pre-config AI work (Copilot/ChatGPT/autocomplete) leaves no trace. This line must appear in the method box.
- **One denominator:** repos with an agent-config file (`CLAUDE.md`/`AGENTS.md`/cursor/windsurf/cline/aider). Never mix in `.claude/` file counts.
- **Files ≠ people.** "~770K config **files**", never "~770K users/repos".
- **Honest sampling note:** curve reflects the dominant conventions (~96% of footprint); Cursor has a small 2024 tail.
- **Brand/CSS rules (already enforced by `research.module.css`):** aiux type scale, body = brand navy, **prose runs full-width (no max-width on lede/caption)**, prominent full-width section separators, `text-wrap: pretty` on prose.
- **No em dashes** in copy (user preference) — use periods/commas/colons.
- **Canonical host is `www`** — `SITE_URL = "https://www.designwithclaude.com"`.
- **A11y bar (same as study #1):** one `<h1>`, ordered `h2/h3`, skip-link + `<main>`, every chart `role="img"` + `aria-label`, decorative bits `aria-hidden`, AA+ contrast. The page must pass its own `dwic-audit`.

---

### Task 1: Data module

**Files:**
- Create: `web/app/design-research/agentic-terminal/data.ts`

**Interfaces:**
- Produces: `SAMPLE_N: number`, `FRONTEND: {count,n,pct,ciPp}`, `CONFIG_FOOTPRINT: {name,label,files,share}[]`, `ADOPTION: {q,n,partial?}[]`, `FOOTPRINT_TOTAL: string`.

- [ ] **Step 1: Create the data module**

```ts
// web/app/design-research/agentic-terminal/data.ts
// Firmed 2026-07-12. Raw sample: docs/research/agentic-terminal-sample.csv
// Method + limits: docs/research/agentic-terminal-workflow-study.md

export const SAMPLE_N = 278;
export const FOOTPRINT_TOTAL = "~770K";

// 95% CI ≈ 18–28%
export const FRONTEND = { count: 63, n: SAMPLE_N, pct: 23, ciPp: 5 };

export interface FootprintRow { name: string; label: string; files: string; share: number; }
export const CONFIG_FOOTPRINT: FootprintRow[] = [
  { name: "CLAUDE.md", label: "Claude Code", files: "~590K", share: 76 },
  { name: "AGENTS.md", label: "agent-agnostic", files: "~150K", share: 19 },
  { name: "Cursor, Windsurf, Cline, Aider", label: "other tools", files: "~29K", share: 4 },
];

// First-commit date of the agent-config file, bucketed by quarter (n=278).
export interface QuarterRow { q: string; n: number; partial?: boolean; }
export const ADOPTION: QuarterRow[] = [
  { q: "2025 Q2", n: 9 },
  { q: "2025 Q3", n: 23 },
  { q: "2025 Q4", n: 29 },
  { q: "2026 Q1", n: 103 },
  { q: "2026 Q2", n: 109 },
  { q: "2026 Q3", n: 5, partial: true },
];
export const ADOPTION_MAX = 109; // for bar scaling
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: clean (no errors).

- [ ] **Step 3: Commit**

```bash
git add web/app/design-research/agentic-terminal/data.ts
git commit -m "research(study-2): data module — firmed agentic-terminal numbers"
```

---

### Task 2: The study page

**Files:**
- Create: `web/app/design-research/agentic-terminal/page.tsx`

**Interfaces:**
- Consumes: everything from `./data`.
- Produces: default-exported `AgenticTerminalStudy` server component at route `/design-research/agentic-terminal`.

- [ ] **Step 1: Write the page**

```tsx
// web/app/design-research/agentic-terminal/page.tsx
import Link from "next/link";
import { Nav } from "@/components/skills/Nav";
import { Footer } from "@/components/skills/Footer";
import styles from "../research.module.css";
import { SAMPLE_N, FOOTPRINT_TOTAL, FRONTEND, CONFIG_FOOTPRINT, ADOPTION, ADOPTION_MAX } from "./data";

const SITE_URL = "https://www.designwithclaude.com";
const PAGE_PATH = "/design-research/agentic-terminal";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "How many people build in the terminal with an agent?";
const PAGE_DESCRIPTION =
  "Working from a terminal with an AI agent leaves a fingerprint in public code: a committed instruction file. We counted them. Two years ago there were almost none; today the footprint is in the hundreds of thousands, and about one in four is building UI.";
const DATE_MODIFIED = "2026-07-12";

export const metadata = {
  title: `${PAGE_TITLE} · Design Research · designwithclaude`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  openGraph: { title: `${PAGE_TITLE} · designwithclaude`, description: PAGE_DESCRIPTION, url: PAGE_URL, type: "article" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "The agentic terminal workflow, by the numbers",
  description:
    "A reproducible count of public repositories carrying an AI-agent config file (CLAUDE.md, AGENTS.md, Cursor/Windsurf/Cline/Aider rules), their first-commit adoption over time, and the share building UI.",
  creator: { "@type": "Organization", name: "designwithclaude" },
  dateModified: DATE_MODIFIED,
  measurementTechnique: "GitHub code-search counts + sampled first-commit dates (deterministic queries)",
  variableMeasured: ["agent-config file footprint", "adoption by quarter", "frontend share"],
  isPartOf: { "@type": "CreativeWorkSeries", name: "Design Research", url: `${SITE_URL}/design-research` },
  url: PAGE_URL,
};

export default function AgenticTerminalStudy() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Nav />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main id="main-content" className={styles.page}>
        <Link href="/design-research" className={styles.back}>← Design Research</Link>
        <p className={styles.eyebrow}>Study &middot; Updated July 2026</p>
        <h1 className={styles.title}>How many people build in the terminal with an agent?</h1>
        <p className={styles.lede}>
          Working from a terminal with an AI agent leaves a fingerprint in public code: a committed instruction
          file. We counted them across GitHub. Two years ago there were almost none. Today the footprint is in
          the hundreds of thousands, and about one in four is building a user interface.
        </p>
        <div className={styles.meta}>
          <span><b>{FOOTPRINT_TOTAL}</b> config files</span>
          <span><b>{SAMPLE_N}</b> repos sampled</span>
          <span>Reproducible</span>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statNum}>{FOOTPRINT_TOTAL}</div>
            <div className={styles.statLabel}>public agent-config files (CLAUDE.md, AGENTS.md, and peers)</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNum}>{FRONTEND.pct}%</div>
            <div className={styles.statLabel}>of sampled repos are building UI (&plusmn;{FRONTEND.ciPp}pp)</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNum}>~96%</div>
            <div className={styles.statLabel}>are Claude Code or AGENTS.md</div>
          </div>
          <div className={styles.stat}>
            <div className={`${styles.statNum} ${styles.alert}`}>3.5&times;</div>
            <div className={styles.statLabel}>more adoption in 2026 so far than in all of 2025</div>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>The takeoff</h2>
          <p className={styles.caption}>
            When each repo first committed its agent-config file, by quarter. Near zero before 2025, then the
            jump from 2025 Q4 to 2026 Q1 (29 to 103). The dominant conventions (Claude Code, AGENTS.md) are a
            2025 and 2026 phenomenon; Cursor has a smaller tail reaching back to 2024.
          </p>
          <div className={styles.chart}>
            {ADOPTION.map((r) => (
              <div className={styles.row} key={r.q}>
                <div className={styles.rowLabel}>{r.q}{r.partial ? " *" : ""}</div>
                <div
                  className={styles.track}
                  role="img"
                  aria-label={`${r.q}: ${r.n} repos first committed an agent-config file${r.partial ? " (quarter in progress)" : ""}`}
                >
                  <div className={`${styles.fill} ${styles.count}`} style={{ width: `${(r.n / ADOPTION_MAX) * 100}%` }} />
                </div>
                <div className={styles.rowVal}>{r.n}</div>
              </div>
            ))}
          </div>
          <p className={styles.caption} style={{ marginTop: "1rem", marginBottom: 0 }}>
            * 2026 Q3 is a partial quarter (July).
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>How many are building UI</h2>
          <p className={styles.caption}>
            We classified {SAMPLE_N} sampled repos by their dependencies. About {FRONTEND.pct}% build a user
            interface (React, Next, Vue, Svelte, Tailwind, or a static site), give or take {FRONTEND.ciPp} points.
            That slice, roughly one in four, is dwic&rsquo;s audience: people shipping interfaces from a terminal,
            with no traditional design tooling.
          </p>
          <ul className={styles.impact}>
            {CONFIG_FOOTPRINT.map((f) => (
              <li className={styles.impactItem} key={f.name}>
                <span className={styles.impactPct}>{f.share}%</span>
                <span><b>{f.name}</b> &mdash; {f.label}, {f.files} files.</span>
              </li>
            ))}
          </ul>
        </section>

        <div className={styles.method}>
          <h3>Method, and what this can and cannot see</h3>
          <p>
            We counted public files on GitHub matching each agent-config convention (`CLAUDE.md`, `AGENTS.md`,
            `.cursorrules`, `.cursor/rules`, `.windsurfrules`, `.clinerules`, `.aider.conf.yml`) via code search,
            then sampled {SAMPLE_N} repos and, for each, read the first commit that introduced the file (its real
            adoption date, not the repo&rsquo;s creation date) and its dependencies (to classify frontend).
          </p>
          <p>
            <span className={styles.pill}>Deterministic queries</span>
            <span className={styles.pill}>First-commit dates</span>
            <span className={styles.pill}>Files, not people</span>
          </p>
          <p>
            Every number here is a floor. Repo fingerprints only appear once someone commits a config file.
            AI-assisted work that predates the convention (Copilot from 2021, ChatGPT from late 2022, Cursor
            autocomplete from 2023) leaves no trace, so the real movement is older and larger than we can show.
          </p>
          <p style={{ marginBottom: 0 }}>
            Counts are approximate: GitHub code-search totals are volatile and index files, not unique repos, and
            the sample is relevance-ranked, not random. Treat magnitudes as directional. Raw sample and full
            method are in the repo under `docs/research/`.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Fix the em dash in the footprint list**

The `&mdash;` in the `CONFIG_FOOTPRINT` map violates the no-em-dash rule. Replace `&mdash;` with `&mdash;`→ a colon:

```tsx
                <span><b>{f.name}</b>: {f.label}, {f.files} files.</span>
```

- [ ] **Step 3: Typecheck + lint**

Run: `cd web && npx tsc --noEmit && npx eslint app/design-research/agentic-terminal/page.tsx`
Expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add web/app/design-research/agentic-terminal/page.tsx
git commit -m "research(study-2): agentic-terminal study page"
```

---

### Task 3: Wire into hub index + sitemap

**Files:**
- Modify: `web/app/design-research/page.tsx` (the `STUDIES` array)
- Modify: `web/app/sitemap.ts`

- [ ] **Step 1: Add the study to the hub `STUDIES` array**

In `web/app/design-research/page.tsx`, add as the FIRST element of `STUDIES` (newest first):

```tsx
  {
    slug: "/design-research/agentic-terminal",
    updated: "Updated July 2026",
    title: "How many people build in the terminal with an agent?",
    summary:
      "We counted the public fingerprints of agentic terminal work. Two years ago there were almost none; today the footprint is in the hundreds of thousands, and about one in four is building UI.",
    bars: [76, 19, 23, 9] as number[],
  },
```

- [ ] **Step 2: Add the route to the sitemap**

In `web/app/sitemap.ts`, add after the `ai-generated-frontends/data` entry:

```ts
    { url: `${BASE}/design-research/agentic-terminal`, lastModified, changeFrequency: "monthly", priority: 0.8 },
```

- [ ] **Step 3: Typecheck + build**

Run: `cd web && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add web/app/design-research/page.tsx web/app/sitemap.ts
git commit -m "research(study-2): add hub card + sitemap entry"
```

---

### Task 4: Verify end-to-end + a11y (practice what it preaches)

**Files:** none (verification only).

- [ ] **Step 1: Start dev server**

Run: `cd web && PORT=3210 npm run dev` (background). Wait for "Ready", confirm `curl -s -o /dev/null -w "%{http_code}" http://localhost:3210/design-research/agentic-terminal` = 200.

- [ ] **Step 2: Dogfood — run dwic-audit on the page files**

Run: `node dist/bin/audit.js audit --cwd web/app/design-research/agentic-terminal --no-baseline` (from repo root; build dist first if needed with `npm run build`).
Expected: no NEW accessibility errors attributable to this page (single h1, chart has aria-label, no unlabelled inputs — there are none). Fix any that are real.

- [ ] **Step 3: Visual check (user-driven)**

Do NOT auto-launch Claude in Chrome (user preference). Tell the user to open `localhost:3210/design-research/agentic-terminal` and `localhost:3210/design-research` (hub card) and confirm: full-width prose, brand navy, adoption bars read as growth, no em dashes, separators clean.

- [ ] **Step 4: Final advisor review on the draft**

Call `advisor()` with the built page + numbers in context (the review the advisor said pays off most). Address anything real.

- [ ] **Step 5: Commit any fixes; stop dev server**

```bash
git add -A && git commit -m "research(study-2): a11y + review fixes" || echo "nothing to fix"
```

---

## Self-Review

**Spec coverage:** §1 question → title/lede ✓. §2 claims/anti-claims → directional copy + CI + no multipliers ✓. §3 ceiling → method box ¶3 ✓. §4 method/denominator → method box ¶1,4 ✓. §5 firmed numbers → data.ts ✓. §6 findings structure (hero curve, scale tiles, UI slice, method box) → page sections ✓. §7 page impl (route, css reuse, hub card, sitemap, a11y) → Tasks 2–4 ✓. §8 firm-up → done pre-plan.

**Placeholder scan:** none — full code in every step. (Task 2 Step 2 fixes the one `&mdash;` that slips into the mapped list.)

**Type consistency:** `data.ts` exports (`SAMPLE_N`, `FOOTPRINT_TOTAL`, `FRONTEND{pct,ciPp,count,n}`, `CONFIG_FOOTPRINT{name,label,files,share}`, `ADOPTION{q,n,partial}`, `ADOPTION_MAX`) match every usage in `page.tsx`. CSS classes (`page/back/eyebrow/title/lede/meta/stats/stat/statNum/alert/statLabel/section/sectionHead/caption/chart/row/rowLabel/track/fill/count/rowVal/impact/impactItem/impactPct/method/pill`) all exist in `research.module.css`.
