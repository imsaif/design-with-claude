import Link from "next/link";
import PaintBrushIcon from "@heroicons/react/24/outline/PaintBrushIcon";
import CodeBracketIcon from "@heroicons/react/24/outline/CodeBracketIcon";
import DocumentTextIcon from "@heroicons/react/24/outline/DocumentTextIcon";
import SparklesIcon from "@heroicons/react/24/outline/SparklesIcon";
import CommandLineIcon from "@heroicons/react/24/outline/CommandLineIcon";
import ChevronDownIcon from "@heroicons/react/24/outline/ChevronDownIcon";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import EyeSlashIcon from "@heroicons/react/24/outline/EyeSlashIcon";
import ArrowTrendingUpIcon from "@heroicons/react/24/outline/ArrowTrendingUpIcon";
import Squares2X2Icon from "@heroicons/react/24/outline/Squares2X2Icon";
import ExclamationTriangleIcon from "@heroicons/react/24/outline/ExclamationTriangleIcon";
import { Nav } from "@/components/skills/Nav";
import { Footer } from "@/components/skills/Footer";
import styles from "../research.module.css";
import { SAMPLE_N, FOOTPRINT_TOTAL, FRONTEND, CONFIG_FOOTPRINT, ADOPTION, ADOPTION_MAX } from "./data";

const SITE_URL = "https://www.designwithclaude.com";
const PAGE_PATH = "/design-research/agentic-terminal";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "Design tools aren't the future. The terminal is.";
const PAGE_DESCRIPTION =
  "A bold claim, backed by the public record: two years ago almost nobody directed an AI agent from the terminal. Today hundreds of thousands do, and about one in four are building UI, with no design tool in the loop. Here is what the data says, and where it points.";
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
        <h1 className={styles.title}>Design tools aren&rsquo;t the future. The terminal is.</h1>
        <p className={styles.lede}>
          Two years ago almost nobody directed an AI agent from the command line. Today hundreds of thousands do,
          and about one in four are building a user interface, with no design tool anywhere in the loop. Here is
          what the data says, and where it points.
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
            <div className={styles.statNum}>96%</div>
            <div className={styles.statLabel}>are Claude Code or AGENTS.md</div>
          </div>
          <div className={styles.stat}>
            <div className={`${styles.statNum} ${styles.alert}`}>3.5&times;</div>
            <div className={styles.statLabel}>more adoption in 2026 so far than in all of 2025</div>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>What changed</h2>
          <p className={styles.caption}>
            For most of software&rsquo;s history, building an interface meant two separate places: a design tool
            where you drew it, and an editor where someone rebuilt it in code. AI help, when it existed, was
            invisible autocomplete. Around early 2025 a different shape appeared. You hand an agent a set of
            written instructions, and it builds and edits the project for you, from the terminal. That instruction
            file is the fingerprint. It only exists when someone is directing an agent, so counting the files
            counts the people working this new way.
          </p>
          <figure className={styles.evidence}>
            <div className={styles.evidenceCol}>
              <p className={styles.evidenceHead}>The old way</p>
              <div className={styles.flow}>
                <div className={styles.flowStep}>
                  <span className={styles.flowIcon}><PaintBrushIcon aria-hidden="true" /></span>
                  <span className={styles.flowLabel}><b>Draw it</b> in a design tool</span>
                </div>
                <span className={styles.flowArrow}><ChevronDownIcon aria-hidden="true" /></span>
                <div className={styles.flowStep}>
                  <span className={styles.flowIcon}><CodeBracketIcon aria-hidden="true" /></span>
                  <span className={styles.flowLabel}><b>Rebuild it</b> by hand in code</span>
                </div>
              </div>
              <p className={styles.flowNote}>Two places. A handoff loses detail in between.</p>
            </div>
            <div className={styles.evidenceCol}>
              <p className={styles.evidenceHead}>The new way</p>
              <div className={styles.flow}>
                <div className={styles.flowStep}>
                  <span className={styles.flowIcon}><DocumentTextIcon aria-hidden="true" /></span>
                  <span className={styles.flowLabel}><b>Write the instructions</b> once</span>
                </div>
                <span className={styles.flowArrow}><ChevronDownIcon aria-hidden="true" /></span>
                <div className={styles.flowStep}>
                  <span className={styles.flowIcon}><SparklesIcon aria-hidden="true" /></span>
                  <span className={styles.flowLabel}><b>An agent</b> builds it</span>
                </div>
                <span className={styles.flowArrow}><ChevronDownIcon aria-hidden="true" /></span>
                <div className={styles.flowStep}>
                  <span className={styles.flowIcon}><CommandLineIcon aria-hidden="true" /></span>
                  <span className={styles.flowLabel}><b>It runs</b> in your terminal</span>
                </div>
              </div>
              <p className={styles.flowNote}>One loop. No handoff.</p>
            </div>
          </figure>
        </section>

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

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>What this means</h2>
          <p className={styles.caption}>
            A large, brand-new group is shipping interfaces in a workflow with no design tool in it at all. An
            agent is very good at the design you can see in a screenshot. It is blind to the design you cannot.
          </p>
          <figure className={styles.evidence}>
            <div className={styles.evidenceCol}>
              <p className={styles.evidenceHead}>
                <EyeIcon className={styles.headIcon} aria-hidden="true" />
                What shows in a screenshot
              </p>
              <ul className={styles.evList}>
                <li>Layout, spacing, and alignment</li>
                <li>Color and type</li>
                <li>The happy-path look of a screen</li>
              </ul>
              <p className={styles.flowNote}>An agent optimizes for this.</p>
            </div>
            <div className={styles.evidenceCol}>
              <p className={styles.evidenceHead}>
                <EyeSlashIcon className={styles.headIcon} aria-hidden="true" />
                What doesn&rsquo;t
              </p>
              <ul className={styles.evList}>
                <li>Contrast ratios</li>
                <li>Keyboard and focus order</li>
                <li>Labels, roles, and landmarks</li>
                <li>Reduced-motion and edge states</li>
              </ul>
              <p className={styles.readoutNote}>This is where it fails.</p>
            </div>
          </figure>
          <p className={styles.caption} style={{ marginTop: "1.75rem", marginBottom: 0 }}>
            Our first study measured the result. Of 123 frontends built by AI coding tools,{" "}
            <Link href="/design-research/ai-generated-frontends">
              74% would fail a basic quality check, and accessibility was the number one defect
            </Link>
            . That is what this workflow ships when nothing minds the invisible half.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>Where this points</h2>
          <p className={styles.caption}>
            This is a snapshot, not a forecast, and every number here is a floor. But three signals are hard to
            walk back.
          </p>
          <ul className={styles.impact}>
            <li className={styles.impactItem}>
              <span className={styles.flowIcon}><ArrowTrendingUpIcon aria-hidden="true" /></span>
              <span>
                <b>A vertical, two-year-old curve.</b> Adoption went from almost nothing to hundreds of thousands
                in under two years. That is the shape of a beginning, not a fad leveling off.
              </span>
            </li>
            <li className={styles.impactItem}>
              <span className={styles.flowIcon}><Squares2X2Icon aria-hidden="true" /></span>
              <span>
                <b>A quarter is already interfaces.</b> The design surface is moving into the terminal whether the
                incumbent tools follow or not.
              </span>
            </li>
            <li className={styles.impactItem}>
              <span className={styles.flowIcon}><ExclamationTriangleIcon aria-hidden="true" /></span>
              <span>
                <b>A measured cost when ungoverned.</b>{" "}
                <Link href="/design-research/ai-generated-frontends">Study one</Link> showed what this workflow
                ships without a guardrail: most of it would fail a basic quality check.
              </span>
            </li>
          </ul>
          <p className={styles.caption} style={{ marginBottom: 0 }}>
            If the curve holds, the design tool of the next decade looks less like a canvas you open and more like
            an agent you instruct, with the guardrails built in. That is the future we are building dwic for.
          </p>
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
            The file counts are a July 2026 snapshot that climbs week to week, so we report them as a floor. They
            index files on GitHub, not unique repos, and the sample is relevance-ranked, not random, so treat the
            magnitudes as directional. Check our work: the{" "}
            <a
              href="https://github.com/imsaif/design-with-claude/blob/main/docs/research/agentic-terminal-sample.csv"
              target="_blank"
              rel="noopener noreferrer"
            >
              raw sample of {SAMPLE_N} repos
            </a>{" "}
            and the{" "}
            <a
              href="https://github.com/imsaif/design-with-claude/blob/main/docs/research/agentic-terminal-workflow-study.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              full method
            </a>{" "}
            are on GitHub.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
