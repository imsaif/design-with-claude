import Link from "next/link";
import { Nav } from "@/components/skills/Nav";
import { Footer } from "@/components/skills/Footer";
import { StudyArt } from "./StudyArt";
import styles from "./research.module.css";

const SITE_URL = "https://www.designwithclaude.com";
const PAGE_PATH = "/design-research";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "Design Research";
const PAGE_DESCRIPTION =
  "Reproducible, deterministic research on the design quality of AI-generated products. As AI builds more of the world's interfaces, we measure what that means for the people who use them.";

export const metadata = {
  title: `${PAGE_TITLE} · designwithclaude`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: `${PAGE_TITLE} · designwithclaude`,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    type: "website",
  },
};

// One study today. The structure holds many.
const STUDIES = [
  {
    slug: "/design-research/agentic-terminal",
    updated: "Updated July 2026",
    title: "Design tools aren't the future. The terminal is.",
    summary:
      "Two years ago almost nobody directed an AI agent from the terminal. Today hundreds of thousands do, and about one in four are building UI. Here is what the data says, and where it points.",
    art: "terminal" as const,
  },
  {
    slug: "/design-research/ai-generated-frontends",
    updated: "Updated July 2026",
    title: "The accessibility of AI-generated UI",
    summary:
      "We audited 123 public frontends built by AI coding tools. 74% would fail a basic quality check, and accessibility is the number one defect, present in half of them.",
    art: "accessibility" as const,
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Design Research",
  description: PAGE_DESCRIPTION,
  url: PAGE_URL,
  publisher: { "@type": "Organization", name: "designwithclaude" },
};

export default function DesignResearchHub() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main id="main-content" className={styles.page}>
        {/* mission */}
        <p className={styles.eyebrow}>dwic Design Research</p>
        <h1 className={styles.title}>Measuring the design quality of what AI builds.</h1>
        <p className={styles.mission}>
          AI now writes a large and growing share of the world&rsquo;s user interfaces. We measure
          what that means for the people who use them. We publish reproducible, deterministic studies on the
          design quality of AI-generated products, so designers, engineers, and the teams shipping AI can see
          what is actually being shipped.
        </p>

        {/* research index */}
        <section className={styles.section}>
          <h2 className={styles.visuallyHidden}>Explore the research</h2>
          <div className={styles.cards}>
            {STUDIES.map((s) => (
              <Link href={s.slug} key={s.slug} className={styles.card}>
                <div className={styles.cardThumb} aria-hidden="true">
                  <StudyArt kind={s.art} />
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardMeta}>
                    <span className={styles.dot} /> {s.updated}
                  </div>
                  <h3 className={styles.cardTitle}>{s.title}</h3>
                  <p className={styles.cardDesc}>{s.summary}</p>
                  <span className={styles.cardLink}>Read the study →</span>
                </div>
              </Link>
            ))}

            {/* placeholder tile signalling this is an ongoing program */}
            <div className={`${styles.card} ${styles.cardSoon}`}>
              <div className={`${styles.cardThumb} ${styles.cardThumbSoon}`} aria-hidden="true">
                <StudyArt kind="soon" />
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardMeta}>
                  <span className={styles.dot} /> In progress
                </div>
                <h3 className={styles.cardTitle}>More studies coming</h3>
              </div>
            </div>
          </div>
        </section>

        {/* principles */}
        <section className={styles.section}>
          <h2 className={styles.sectionHead}>How we work</h2>
          <div className={styles.principles}>
            <div className={styles.principle}>
              <h3>Deterministic</h3>
              <p>No model runs in the measurement. The same input gives the same result, every time.</p>
            </div>
            <div className={styles.principle}>
              <h3>Reproducible</h3>
              <p>Every figure can be re-run with one command. You never have to take our word for it.</p>
            </div>
            <div className={styles.principle}>
              <h3>Open</h3>
              <p>The tool behind the numbers is free to run on your own project: <code>npx dwic-audit</code>.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
