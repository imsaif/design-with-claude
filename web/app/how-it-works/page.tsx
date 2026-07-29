import Link from "next/link";
import { Nav } from "@/components/skills/Nav";
import { Footer } from "@/components/skills/Footer";
import HtdwcAnimatedTerminal from "@/components/skills/HtdwcAnimatedTerminal";
import HtdwcCliCopy from "@/components/skills/HtdwcCliCopy";
import { SKILLS } from "@/app/data/skills";

const SITE_URL = "https://www.designwithclaude.com";
const PAGE_PATH = "/how-it-works";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "How it works";
const PAGE_DESCRIPTION =
  "One command checks your design for contrast, type, spacing and accessibility problems. Run it anywhere, or let Claude Code fix what it finds.";
const DATE_PUBLISHED = "2026-05-29";
const DATE_MODIFIED = "2026-07-29";

export const metadata = {
  title: `${PAGE_TITLE} · designwithclaude`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: `${PAGE_TITLE} · designwithclaude`,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    type: "article",
  },
};

// The eight things dwic checks. Order and `blocker` mirror the CLI's own
// banding in src/audit/dashboard.ts: WCAG_CATEGORIES (accessibility, color)
// are "Fix before you ship"; the rest are "Then clean up".
const CATEGORIES = [
  { name: "Accessibility", checks: "labels, heading order, alt text", blocker: true },
  { name: "Color", checks: "contrast, off-brand accents", blocker: true },
  { name: "Typography", checks: "type scale, line height, font weights" },
  { name: "Spacing", checks: "off-grid values, big jumps" },
  { name: "Forms", checks: "labels, input types, error wiring" },
  { name: "Navigation", checks: "landmarks, current page, mobile menu" },
  { name: "Motion", checks: "reduced motion, long durations" },
  { name: "Copy", checks: "weak buttons, jargon, shouting" },
];

// Lead is the scannable claim; rest is the one-line qualifier.
const BOUNDARIES = [
  { lead: "Rules, not taste.", rest: "It won't say if your design is good, only where it breaks its own rules." },
  { lead: "No guessing.", rest: "It never invents a problem, but it only finds what the rules cover." },
  { lead: "No redesigns.", rest: "It reports. You ask Claude for the fixes." },
  { lead: "Choices, not code.", rest: "It remembers your decisions, not your whole codebase." },
];

export default function HowItWorksPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    mainEntityOfPage: { "@type": "WebPage", "@id": PAGE_URL },
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    author: {
      "@type": "Person",
      name: "Imran",
      url: "https://www.imranaidesign.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Design with Claude",
      url: SITE_URL,
    },
  };

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main id="main-content">
        <section className="skills-hero">
          <p className="skills-hero-eyebrow">How it works · 2 min read</p>
          <h1>How dwic works.</h1>
          <p className="skills-hero-sub">
            One command finds what&rsquo;s broken in your design. Claude Code
            fixes it.
          </p>
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">The check</p>
            <h2 className="htdwc-h2">One command, eight checks.</h2>
            <p>
              Your tools check your code. Nothing checks your design. So faint
              text, odd font sizes and unlabelled fields ship unnoticed.
            </p>
            <p>
              dwic reads your CSS and components and lists what&rsquo;s wrong.
              No AI. Your code stays on your computer. Same answers every time.
            </p>
          </div>
          <div className="htdwc-cli-row">
            <HtdwcCliCopy command="npx dwic-audit" />
            <p className="htdwc-cli-note htdwc-cli-note--inline">
              No account. No install. Works without Claude Code.
            </p>
          </div>
          <div className="htdwc-specialists">
            {CATEGORIES.map((c) => (
              <div
                key={c.name}
                className={`htdwc-specialist${c.blocker ? " htdwc-specialist--blocker" : ""}`}
              >
                <p className="htdwc-specialist-name">{c.name}</p>
                <p className="htdwc-specialist-role">{c.checks}</p>
                {c.blocker ? (
                  <p className="htdwc-specialist-tag">Fix before you ship</p>
                ) : null}
              </div>
            ))}
          </div>
          <div className="htdwc-prose htdwc-prose--after">
            <p>
              Accessibility and contrast are ranked first, under{" "}
              <em>Fix before you ship</em>. WCAG AA failures are a compliance
              risk under the EU Accessibility Act, in force since June 2025.
              Everything else is cleanup.
            </p>
            <p>
              Every run prints a summary and saves a report to{" "}
              <code>.dwic/</code> for your pull request. Errors fail the build
              in CI. Add <code>--watch</code> to re-check on every save.
            </p>
          </div>
          <HtdwcAnimatedTerminal />
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">In Claude Code</p>
            <h2 className="htdwc-h2">Ask it to fix things.</h2>
            <p>
              Set it up once and dwic works inside Claude Code. Ask for the{" "}
              <code>color-specialist</code> or the{" "}
              <code>accessibility-specialist</code>. dwic finds the problems.
              Claude fixes them.
            </p>
          </div>
          <HtdwcCliCopy command="npx dwic-audit setup" />
          <p className="htdwc-cli-note">
            Restart Claude Code once. The specialists show up as tools in every
            project.
          </p>
          <div className="htdwc-prose htdwc-prose--after">
            <p>
              It remembers your project. The first time, it asks what
              you&rsquo;re building and what you use. After that you
              don&rsquo;t repeat yourself.
            </p>
            <p>
              Nothing is hidden. Each specialist is a plain text file, free in
              the <Link href="/library">design skill library</Link>. The{" "}
              <code>/color-specialist</code> slash command reads the same file.
              dwic adds the checks and the memory.
            </p>
          </div>
        </section>

        <div className="htdwc-band">
          <section className="htdwc-section">
            <div className="htdwc-prose">
              <p className="htdwc-eyebrow">Limits</p>
              <h2 className="htdwc-h2">What it won&rsquo;t do.</h2>
              <p>Before you start:</p>
              <ul className="htdwc-boundaries">
                {BOUNDARIES.map((b) => (
                  <li key={b.lead}>
                    <strong>{b.lead}</strong> {b.rest}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="htdwc-section">
            <div className="htdwc-prose">
              <p className="htdwc-eyebrow">Next</p>
              <h2 className="htdwc-h2">Where to go from here.</h2>
            </div>
            <div className="gs-cards htdwc-cards-3">
              <Link href="/design-research" className="gs-card gs-card--link">
                <p className="gs-card-title">Design Research →</p>
                <p className="gs-card-body">
                  How well AI builds interfaces, measured.
                </p>
                <p className="gs-card-cta">/design-research</p>
              </Link>
              <a
                href="https://www.aiuxdesign.guide"
                target="_blank"
                rel="noopener noreferrer"
                className="gs-card gs-card--link"
              >
                <p className="gs-card-title">Pattern library →</p>
                <p className="gs-card-body">
                  36 AI UX patterns from the best AI products.
                </p>
                <p className="gs-card-cta">aiuxdesign.guide</p>
              </a>
              <Link href="/library" className="gs-card gs-card--link">
                <p className="gs-card-title">Free specialist library →</p>
                <p className="gs-card-body">
                  {SKILLS.length} design specialists as slash commands. Install one at a
                  time.
                </p>
                <p className="gs-card-cta">/library</p>
              </Link>
            </div>
          </section>
        </div>

        <section className="htdwc-section htdwc-section--cta">
          <div className="htdwc-prose">
            <h2 className="htdwc-h2">Try it.</h2>
            <p>One command. Any project. Takes seconds.</p>
          </div>
          <HtdwcCliCopy command="npx dwic-audit" />
        </section>
      </main>
      <Footer />
    </>
  );
}
