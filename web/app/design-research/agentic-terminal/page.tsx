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
  openGraph: {
    title: `${PAGE_TITLE} · designwithclaude`,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    type: "article",
  },
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
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main id="main-content" className={styles.page}>
        <Link href="/design-research" className={styles.back}>
          ← Design Research
        </Link>
        <p className={styles.eyebrow}>Study &middot; Updated July 2026</p>
        <h1 className={styles.title}>How many people build in the terminal with an agent?</h1>
        <p className={styles.lede}>
          Working from a terminal with an AI agent leaves a fingerprint in public code: a committed instruction
          file. We counted them across GitHub. Two years ago there were almost none. Today the footprint is in the
          hundreds of thousands, and about one in four is building a user interface.
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
            When each repo first committed its agent-config file, by quarter. Near zero before 2025, then the jump
            from 2025 Q4 to 2026 Q1 (29 to 103). The dominant conventions (Claude Code, AGENTS.md) are a 2025 and
            2026 phenomenon; Cursor has a smaller tail reaching back to 2024.
          </p>
          <div className={styles.chart}>
            {ADOPTION.map((r) => (
              <div className={styles.row} key={r.q}>
                <div className={styles.rowLabel}>
                  {r.q}
                  {r.partial ? " *" : ""}
                </div>
                <div
                  className={styles.track}
                  role="img"
                  aria-label={`${r.q}: ${r.n} repos first committed an agent-config file${
                    r.partial ? " (quarter in progress)" : ""
                  }`}
                >
                  <div
                    className={`${styles.fill} ${styles.count}`}
                    style={{ width: `${(r.n / ADOPTION_MAX) * 100}%` }}
                  />
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
                <span>
                  <b>{f.name}</b>: {f.label}, {f.files} files.
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className={styles.method}>
          <h3>Method, and what this can and cannot see</h3>
          <p>
            We counted public files on GitHub matching each agent-config convention (CLAUDE.md, AGENTS.md,
            .cursorrules, .cursor/rules, .windsurfrules, .clinerules, .aider.conf.yml) via code search, then
            sampled {SAMPLE_N} repos and, for each, read the first commit that introduced the file (its real
            adoption date, not the repository&rsquo;s creation date) and its dependencies (to classify frontend).
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
            the sample is relevance-ranked, not random. Treat magnitudes as directional. The raw sample and full
            method are in the repo under <code>docs/research/</code>.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
