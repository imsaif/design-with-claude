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

// The eight things dwic checks, and what it looks for in each.
const CATEGORIES = [
  { name: "Color", checks: "contrast, off-brand accents" },
  { name: "Typography", checks: "type scale, line height, font weights" },
  { name: "Spacing", checks: "off-grid values, big jumps" },
  { name: "Accessibility", checks: "labels, heading order, alt text" },
  { name: "Forms", checks: "labels, input types, error wiring" },
  { name: "Navigation", checks: "landmarks, current page, mobile menu" },
  { name: "Motion", checks: "reduced motion, long durations" },
  { name: "Copy", checks: "weak buttons, jargon, shouting" },
];

const BOUNDARIES = [
  "It checks rules, not taste. It won't tell you if your design is good. It tells you where it breaks its own rules.",
  "It doesn't guess. The checks are math and parsing, so it never invents a problem. It also only finds what the rules cover.",
  "It won't redesign for you. The command reports. The fixes happen when you ask Claude, with you in the loop.",
  "It remembers your choices, not your codebase. That means your project profile and recent calls, not every file.",
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
            One command checks your design and tells you what&rsquo;s broken.
            Then Claude Code fixes it.
          </p>
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">The check</p>
            <h2 className="htdwc-h2">One command, eight checks.</h2>
            <p>
              Your tools check your code. Nothing checks your design. So faint
              text, odd font sizes and unlabelled form fields ship without
              anyone noticing.
            </p>
            <p>
              dwic reads your CSS and components and lists what&rsquo;s wrong.
              There&rsquo;s no AI in this step, and your code never leaves your
              computer. Same project, same answers, every time.
            </p>
          </div>
          <HtdwcCliCopy command="npx dwic-audit" />
          <p className="htdwc-cli-note">
            No account. No install. Works without Claude Code.
          </p>
          <div className="htdwc-specialists">
            {CATEGORIES.map((c) => (
              <div key={c.name} className="htdwc-specialist">
                <p className="htdwc-specialist-name">{c.name}</p>
                <p className="htdwc-specialist-role">{c.checks}</p>
              </div>
            ))}
          </div>
          <div className="htdwc-prose htdwc-prose--after">
            <p>
              Every run prints a summary and saves a report to{" "}
              <code>.dwic/</code> that you can drop into a pull request. It
              fails the build in CI when there are errors. Add{" "}
              <code>--watch</code> and it re-checks each time you save.
            </p>
          </div>
          <HtdwcAnimatedTerminal />
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">In Claude Code</p>
            <h2 className="htdwc-h2">Ask it to fix things.</h2>
            <p>
              Run the setup once and dwic works inside Claude Code. Ask for the{" "}
              <code>color-specialist</code> or the{" "}
              <code>accessibility-specialist</code>. dwic finds the problems.
              Claude explains them and writes the fix.
            </p>
          </div>
          <HtdwcCliCopy command="npx dwic-audit setup" />
          <p className="htdwc-cli-note">
            Restart Claude Code once. The specialists show up as tools in every
            project.
          </p>
          <div className="htdwc-prose htdwc-prose--after">
            <p>
              It also remembers your project. The first time you ask, it wants to
              know what you&rsquo;re building, your stack and your design system.
              After that it knows, so you don&rsquo;t repeat yourself.
            </p>
            <p>
              Nothing is hidden. Every specialist is a plain text file, and
              they&rsquo;re all free in the{" "}
              <Link href="/library">design skill library</Link>. The{" "}
              <code>/color-specialist</code> slash command reads the same file.
              dwic adds the checks, the memory and the one-line command.
            </p>
          </div>
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">Limits</p>
            <h2 className="htdwc-h2">What it won&rsquo;t do.</h2>
            <p>Worth knowing before you start:</p>
            <ul className="htdwc-boundaries">
              {BOUNDARIES.map((b, i) => (
                <li key={i}>{b}</li>
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
                Studies on how well AI builds interfaces, with real numbers.
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
                36 AI UX patterns, taken from how the best AI products work.
              </p>
              <p className="gs-card-cta">aiuxdesign.guide</p>
            </a>
            <Link href="/library" className="gs-card gs-card--link">
              <p className="gs-card-title">Free specialist library →</p>
              <p className="gs-card-body">
                {SKILLS.length} design specialists as Claude Code slash commands.
                Install one at a time.
              </p>
              <p className="gs-card-cta">/library</p>
            </Link>
          </div>
        </section>

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
