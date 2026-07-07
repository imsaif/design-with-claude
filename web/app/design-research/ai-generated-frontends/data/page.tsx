import Link from "next/link";
import { Nav } from "@/components/skills/Nav";
import { Footer } from "@/components/skills/Footer";
import styles from "../../research.module.css";
import { CORPUS } from "../corpus";

const SITE_URL = "https://designwithclaude.com";
const PAGE_PATH = "/design-research/ai-generated-frontends/data";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "The 123 frontends we audited";
const PAGE_DESCRIPTION =
  "Every repository in the AI-generated frontends study, alphabetical, with its findings. Public projects you can open and check for yourself.";

export const metadata = {
  title: `${PAGE_TITLE} · Design Research · designwithclaude`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  openGraph: { title: PAGE_TITLE, description: PAGE_DESCRIPTION, url: PAGE_URL, type: "article" },
};

export default function CorpusDataPage() {
  const totals = CORPUS.reduce((a, r) => ({ e: a.e + r.e, w: a.w + r.w, i: a.i + r.i }), { e: 0, w: 0, i: 0 });
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav />
      <main id="main-content" className={styles.page}>
        <Link href="/design-research/ai-generated-frontends" className={styles.back}>
          ← The study
        </Link>
        <p className={styles.eyebrow}>Study data</p>
        <h1 className={styles.title}>The 123 frontends we audited</h1>
        <p className={styles.lede}>
          Every repository in the study, listed alphabetically with its findings. These are public projects
          that identify as AI-generated. Open any of them on GitHub and check for yourself.
        </p>
        <p className={styles.caption}>
          <b>Errors</b> are serious: they should stop code from shipping. <b>Warnings</b> and <b>info</b> are
          lower-severity. Because the audit is deterministic, these numbers are stable, not a snapshot of one run.
        </p>

        <div className={styles.tableWrap} style={{ maxWidth: "none" }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Repository</th>
                <th>Errors</th>
                <th>Warnings</th>
                <th>Info</th>
              </tr>
            </thead>
            <tbody>
              {CORPUS.map((r) => (
                <tr key={r.repo}>
                  <td>
                    <a
                      className={styles.repoLink}
                      href={`https://github.com/${r.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {r.repo}
                    </a>
                  </td>
                  <td>{r.e}</td>
                  <td>{r.w}</td>
                  <td>{r.i}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>
                  <b>Total ({CORPUS.length} frontends)</b>
                </td>
                <td>
                  <b>{totals.e}</b>
                </td>
                <td>
                  <b>{totals.w}</b>
                </td>
                <td>
                  <b>{totals.i}</b>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className={styles.method}>
          <h3>How this list was built</h3>
          <p>
            We searched public GitHub for repositories that self-identify as AI-generated (v0, Lovable, bolt,
            and similar), across 150+ accounts. Of 165 cloned, the {CORPUS.length} shown here had an analysable
            frontend and form the study&rsquo;s sample; the rest were empty or backend-only and were excluded.
          </p>
          <p>
            Every one was checked with the same deterministic tool: no model, no network, no judgement, so the
            same repository yields the same numbers every time. Repositories can change after publication, so a
            row may drift if its owner edits or deletes it.
          </p>
          <p style={{ marginBottom: 0 }}>
            Technical, and want to re-run it? In any project root: <span className={styles.code}>npx dwic-audit</span>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
