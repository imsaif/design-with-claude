import Link from "next/link";
import { Nav } from "@/components/skills/Nav";
import { Footer } from "@/components/skills/Footer";
import styles from "../research.module.css";

const SITE_URL = "https://designwithclaude.com";
const PAGE_PATH = "/design-research/ai-generated-frontends";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "The accessibility of AI-generated UI";
const PAGE_DESCRIPTION =
  "A deterministic, reproducible audit of 123 public frontends built by AI coding tools. 74% ship with an error serious enough to block release; accessibility is the number one defect.";
const DATE_MODIFIED = "2026-07-06";

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

const CATEGORIES = [
  { name: "Accessibility", error: 52, any: 98 },
  { name: "Motion", error: 35, any: 39 },
  { name: "Contrast", error: 12, any: 12 },
  { name: "Copy", error: 0, any: 95 },
  { name: "Navigation", error: 0, any: 46 },
  { name: "Forms", error: 0, any: 45 },
  { name: "Typography", error: 0, any: 31 },
  { name: "Spacing", error: 0, any: 0 },
];

const DISTRIBUTION = [
  { bucket: "0 (clean)", pct: 26, clean: true },
  { bucket: "1 to 2", pct: 37 },
  { bucket: "3 to 5", pct: 15 },
  { bucket: "6 to 10", pct: 7 },
  { bucket: "11 to 20", pct: 10 },
  { bucket: "21 or more", pct: 6 },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Audit of 123 AI-generated frontends",
  description:
    "A deterministic design-system audit of 123 public frontends built by AI coding tools (v0, Lovable, bolt, and similar), covering accessibility, motion, contrast, and five other categories.",
  creator: { "@type": "Organization", name: "designwithclaude" },
  dateModified: DATE_MODIFIED,
  measurementTechnique: "Deterministic static analysis (no model)",
  variableMeasured: ["accessibility errors", "motion errors", "contrast errors", "findings per project"],
  isPartOf: { "@type": "CreativeWorkSeries", name: "Design Research", url: `${SITE_URL}/design-research` },
  url: PAGE_URL,
};

export default function AiGeneratedFrontendsStudy() {
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
        <h1 className={styles.title}>How accessible is AI-generated UI?</h1>
        <p className={styles.lede}>
          We ran a deterministic design audit over 123 public frontends built by AI coding tools.
          The tools handle what you can see. They miss what you cannot see in a screenshot.
        </p>
        <div className={styles.meta}>
          <span><b>123</b> frontends analysed</span>
          <span><b>165</b> repos cloned</span>
          <span>Deterministic and reproducible</span>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statNum}>123</div>
            <div className={styles.statLabel}>frontends analysed, from 165 public repos</div>
          </div>
          <div className={styles.stat}>
            <div className={`${styles.statNum} ${styles.alert}`}>74%</div>
            <div className={styles.statLabel}>have an error serious enough to block shipping</div>
          </div>
          <div className={styles.stat}>
            <div className={`${styles.statNum} ${styles.alert}`}>52%</div>
            <div className={styles.statLabel}>have serious accessibility errors</div>
          </div>
          <div className={styles.stat}>
            <div className={`${styles.statNum} ${styles.alert}`}>1 in 3</div>
            <div className={styles.statLabel}>ignore the reduced-motion setting</div>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>Where the gaps are, by category</h2>
          <p className={styles.caption}>
            Share of the 123 frontends with a finding in each category, split into serious errors and
            lower-severity warnings. Only three categories produce errors serious enough to stop code from
            shipping. Accessibility is by far the largest.
          </p>
          <div className={styles.legend}>
            <span><i className={styles.swatch} style={{ background: "var(--dr-error)" }} /> Serious error</span>
            <span><i className={styles.swatch} style={{ background: "var(--dr-warn)" }} /> Warning</span>
          </div>
          <div className={styles.chart}>
            {CATEGORIES.map((c) => {
              const warnOnly = Math.max(0, c.any - c.error);
              return (
                <div className={styles.row} key={c.name}>
                  <div className={styles.rowLabel}>{c.name}</div>
                  <div
                    className={styles.track}
                    role="img"
                    aria-label={`${c.error}% serious errors, ${warnOnly}% warnings, ${c.any}% total`}
                    title={`${c.name}: ${c.error}% errors, ${c.any}% any finding`}
                  >
                    {c.error > 0 && <div className={`${styles.fill} ${styles.error}`} style={{ width: `${c.error}%` }} />}
                    {warnOnly > 0 && <div className={`${styles.fill} ${styles.warn}`} style={{ width: `${warnOnly}%` }} />}
                  </div>
                  <div className={styles.rowVal} aria-hidden="true">{c.any}%</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>How bad is bad?</h2>
          <p className={styles.caption}>
            Serious errors per frontend. Most projects have only a few. A quarter are clean. A small tail is
            severe, the worst with 194 errors, which is why the typical (median) project has just one.
          </p>
          <div className={styles.chart}>
            {DISTRIBUTION.map((d) => (
              <div className={styles.row} key={d.bucket}>
                <div className={styles.rowLabel}>{d.bucket}</div>
                <div className={styles.track} title={`${d.bucket} errors: ${d.pct}% of projects`}>
                  <div
                    className={`${styles.fill} ${d.clean ? styles.clean : styles.count}`}
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <div className={styles.rowVal}>{d.pct}%</div>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.method}>
          <h3>Method, and what we actually audited</h3>
          <p>
            We searched public GitHub for repositories that self-identify as AI-generated (v0, Lovable, bolt,
            and similar), across 150+ accounts. Of 165 cloned, 123 had an analysable frontend and form the
            sample. Every one was checked with the same deterministic tool: no model, no network, no judgement,
            so the same repository yields the same numbers every time. The sample is large enough that the
            headline rates hold to within two points if the ten worst projects are dropped.
          </p>
          <p>
            <span className={styles.pill}>No model in the loop</span>
            <span className={styles.pill}>Same input, same output</span>
            <span className={styles.pill}>Frontend-only denominator</span>
          </p>
          <p>
            You don&rsquo;t have to take our word for any of it.{" "}
            <Link href="/design-research/ai-generated-frontends/data">
              See all 123 repositories and their scores &rarr;
            </Link>{" "}
            Open any of them on GitHub and check.
          </p>
          <p style={{ marginBottom: 0 }}>
            &ldquo;Accessibility error&rdquo; here means a structural markup failure: unlabelled inputs,
            non-semantic buttons, missing landmarks, skipped headings, a stricter, narrower definition than a
            full manual review. The corpus skews toward landing pages, portfolios, and small apps.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
