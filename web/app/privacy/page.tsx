import Link from "next/link";
import { Nav } from "@/components/skills/Nav";
import { Footer } from "@/components/skills/Footer";
import styles from "../design-research/research.module.css";

const PAGE_TITLE = "Privacy";
const PAGE_DESCRIPTION =
  "What designwithclaude (dwic) collects: the Claude Code plugin sends nothing, the audit sends one anonymous count you can turn off, and the website has no trackers.";

export const metadata = {
  title: `${PAGE_TITLE} · designwithclaude`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/privacy" },
};

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

/*
 * Keep this page true to the code. Sources, checked 2026-11-17:
 * - plugin: plugin/ holds only Markdown, JSON and an image; no MCP servers or hooks.
 * - audit ping: src/audit/telemetry.ts (payload, ~/.dwic/state.json, --no-telemetry, DWIC_TELEMETRY=off)
 *   → web/app/api/events (recordAnonymousEvent).
 * - paid MCP: src/api-client.ts EventPayload sends toolName, input, output, project.
 * - website: no analytics scripts in web/app or web/components.
 * If any of these change, change this page in the same commit.
 */
export default function PrivacyPage() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav />
      <main id="main-content" className={styles.page}>
        <p className={styles.eyebrow}>Last updated 17 November 2026</p>
        <h1 className={styles.title}>Privacy</h1>
        <p className={styles.lede}>
          dwic is built to need as little of your data as possible. The Claude Code plugin sends nothing to us. The
          audit sends one anonymous count, which you can turn off. This page says exactly what goes where.
        </p>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>The Claude Code plugin</h2>
          <p className={styles.caption}>
            The plugin is a set of text instructions that run inside your own Claude Code session. It has no server of its
            own and makes no network calls. We never receive your code, your prompts or your files. What Claude itself
            reads and sends is covered by{" "}
            <a href="https://www.anthropic.com/legal/privacy" {...ext}>Anthropic&rsquo;s privacy policy</a>.
          </p>
          <p className={styles.caption}>
            Some commands write files into your project, and only there: design decisions (for example{" "}
            <code>DESIGN-CONTEXT.md</code>), audit reports and <code>.dwic/EMPATHY.md</code>. <code>/design-empathy</code>{" "}
            can read interview notes you point it at; it removes people&rsquo;s names before writing anything, and asks
            before searching the public web on your behalf.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>The audit (<code>npx dwic-audit</code>)</h2>
          <p className={styles.caption}>
            You can run the audit yourself, and four plugin commands may run it for you (<code>/design-triage</code>,{" "}
            <code>/design-enforce</code>, <code>/design-critic</code>, <code>/anti-slop-designer</code>). Each run sends one
            anonymous count to designwithclaude.com so we can see whether the tool is used. It contains:
          </p>
          <ul className={styles.caption}>
            <li>the audit version and the framework it detected;</li>
            <li>how many findings it made in each category, and how many were new or resolved since last time;</li>
            <li>a random ID, stored on your machine in <code>~/.dwic/state.json</code>, so repeat runs count once.</li>
          </ul>
          <p className={styles.caption}>
            It never contains file contents, file paths, project names or the text of any finding. The first run tells you
            this. To turn it off, pass <code>--no-telemetry</code> or set <code>DWIC_TELEMETRY=off</code>. The counts are
            kept to measure use over time and are never sold or shared.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>The paid MCP server (alpha)</h2>
          <p className={styles.caption}>
            This is a separate install that needs an access token; the plugin doesn&rsquo;t use it. If you set it up, each
            tool call sends the tool&rsquo;s name, its input and its output to designwithclaude.com, stored against your
            account and project so the browser companion can show your results. Don&rsquo;t use it on material you
            can&rsquo;t share with us.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>This website</h2>
          <p className={styles.caption}>
            The site uses no analytics or advertising trackers and sets no tracking cookies. It is hosted on Vercel, which
            keeps standard request logs.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>Questions or deletion</h2>
          <p className={styles.caption}>
            To ask what we hold or have something deleted, open an issue on{" "}
            <a href="https://github.com/imsaif/design-with-claude/issues" {...ext}>GitHub</a>. For the anonymous audit
            count, delete <code>~/.dwic/state.json</code> and turn telemetry off; there is nothing linking it to you.
          </p>
          <p className={styles.caption}>
            <Link href="/">Back to designwithclaude</Link>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
