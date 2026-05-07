import Link from "next/link";
import {
  PencilSquareIcon,
  EyeIcon,
  ArrowPathIcon,
  SignalIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { Nav } from "@/components/skills/Nav";
import { Footer } from "@/components/skills/Footer";
import HtdwcAnimatedTerminal from "@/components/skills/HtdwcAnimatedTerminal";
import HtdwcCliCopy from "@/components/skills/HtdwcCliCopy";
import { SKILLS } from "@/app/data/skills";

const SITE_URL = "https://designwithclaude.com";
const PAGE_PATH = "/how-to-design-with-claude";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "How to design with Claude";
const PAGE_DESCRIPTION =
  "A workflow for shipping design work with Claude Code: install dwic, ask design specialists for help, audit for drift, and ground every decision in 36 AI UX patterns from aiuxdesign.guide.";
const DATE_PUBLISHED = "2026-05-07";
const DATE_MODIFIED = "2026-05-07";

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

const SPECIALIST_SLUGS = [
  "design-system-architect",
  "color-specialist",
  "typography-specialist",
  "spacing-layout-specialist",
  "accessibility-specialist",
  "form-designer",
  "navigation-specialist",
  "motion-designer",
  "content-strategist",
];

const SPECIALIST_PROMPTS: Record<string, string> = {
  "design-system-architect":
    "Design tokens for a SaaS dashboard. WCAG AA. Tailwind v4.",
  "color-specialist":
    "Review my palette for AA contrast and accent drift.",
  "typography-specialist":
    "Build a 6-step type scale anchored at 16px body.",
  "spacing-layout-specialist":
    "Audit my spacing tokens for grid alignment.",
  "accessibility-specialist":
    "Check this signup form for keyboard + screen-reader support.",
  "form-designer":
    "Design an inline validation pattern for our checkout.",
  "navigation-specialist":
    "Pick a primary nav pattern for a 12-route app.",
  "motion-designer":
    "Define easing + duration tokens for our component library.",
  "content-strategist":
    "Rewrite our empty states to be helpful, not cute.",
};

export default function HowToDesignWithClaudePage() {
  const specialists = SPECIALIST_SLUGS.map((slug) => {
    const skill = SKILLS.find((s) => s.slug === slug);
    return skill ? { ...skill, prompt: SPECIALIST_PROMPTS[slug] } : null;
  }).filter((x): x is NonNullable<typeof x> => x !== null);

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
          <p className="skills-hero-eyebrow">Guide · 8 min read</p>
          <h1>How to design with Claude.</h1>
          <p className="skills-hero-sub">
            A workflow for shipping design work with Claude Code. Install dwic,
            ask specialists for help, and audit before you ship.
          </p>
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <h2 className="htdwc-h2">Why this guide</h2>
            <p>
              In 2026, &ldquo;designing with Claude&rdquo; doesn&rsquo;t mean
              chatting with Claude.ai about color theory. It means running
              Claude Code in your terminal, asking specialists for design
              decisions, and auditing the output before it ships.
            </p>
            <p>
              dwic is the loop that ties those moments together. It&rsquo;s an
              MCP server you install once, a set of design specialists you
              invoke per task, and an auditor that catches contrast failures,
              accent drift, and structural gaps before they reach production.
              This guide walks the loop end to end.
            </p>
          </div>
          <a
            href="https://www.aiuxdesign.guide/guides/claude-code-learning-path"
            target="_blank"
            rel="noopener noreferrer"
            className="htdwc-callout"
          >
            <span className="htdwc-callout-eyebrow">
              New to Claude Code?
            </span>
            <span className="htdwc-callout-title">
              Start with the Claude Code learning path on aiuxdesign.guide
              <ArrowTopRightOnSquareIcon
                className="htdwc-callout-icon"
                aria-hidden="true"
              />
            </span>
            <span className="htdwc-callout-body">
              A 23-lesson walkthrough for designers picking up Claude Code for
              the first time. Come back here once you&rsquo;re shipping.
            </span>
          </a>
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">The loop</p>
            <h2 className="htdwc-h2">Audit, generate, iterate, watch.</h2>
          </div>
          <div className="gs-cards htdwc-cards-4">
            <div className="gs-card">
              <EyeIcon className="gs-card-icon" aria-hidden="true" />
              <p className="gs-card-title">1. Audit</p>
              <p className="gs-card-body">
                <code>npx @imrandwc/dwic audit</code> scans your CSS + JSX
                across 8 categories and flags what&rsquo;s broken.
              </p>
            </div>
            <div className="gs-card">
              <PencilSquareIcon className="gs-card-icon" aria-hidden="true" />
              <p className="gs-card-title">2. Generate</p>
              <p className="gs-card-body">
                Ask specialists to fix the findings. They return tokens,
                scales, and copy. Structured output, not prose.
              </p>
            </div>
            <div className="gs-card">
              <ArrowPathIcon className="gs-card-icon" aria-hidden="true" />
              <p className="gs-card-title">3. Iterate</p>
              <p className="gs-card-body">
                Re-run audit to see what drifted since the last clean state.
                Findings cite AI UX patterns to read deeper.
              </p>
            </div>
            <div className="gs-card">
              <SignalIcon className="gs-card-icon" aria-hidden="true" />
              <p className="gs-card-title">4. Watch</p>
              <p className="gs-card-body">
                <code>dwic audit --watch</code> keeps the loop running. Re-runs
                on every save, surfaces only what changed.
              </p>
            </div>
          </div>
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">Setup</p>
            <h2 className="htdwc-h2">One command to install.</h2>
            <p>
              dwic ships as a Claude Code MCP server. The setup script writes
              the entry, picks up your existing project conventions, and
              registers the specialists as MCP tools.
            </p>
          </div>
          <HtdwcCliCopy command="npx @imrandwc/dwic setup" />
          <p className="htdwc-cli-note">
            Restart Claude Code once. The specialists appear as MCP tools you
            can invoke from any project.
          </p>
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">Specialists</p>
            <h2 className="htdwc-h2">Nine roles, one keystroke each.</h2>
            <p>
              Every specialist is a focused role with its own prompt, expertise,
              and output contract. Ask the one closest to your task, or
              start with <code>/design-brief</code> and let it route.
            </p>
          </div>
          <div className="htdwc-specialists">
            {specialists.map((s) => (
              <div key={s.slug} className="htdwc-specialist">
                <p className="htdwc-specialist-name">{s.name}</p>
                <p className="htdwc-specialist-role">{s.description}</p>
                <p className="htdwc-specialist-prompt">
                  <span className="htdwc-specialist-prompt-label">
                    Ask Claude:
                  </span>{" "}
                  {s.prompt}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">Auditing</p>
            <h2 className="htdwc-h2">Catch drift before it ships.</h2>
            <p>
              <code>dwic audit</code> reads your CSS and JSX, runs eight
              category audits, and prints one dashboard. Add{" "}
              <code>--watch</code> to re-run on every save and surface only
              what&rsquo;s changed since the last clean state.
            </p>
          </div>
          <HtdwcAnimatedTerminal />
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">Going deeper</p>
            <h2 className="htdwc-h2">Where to read next.</h2>
          </div>
          <div className="gs-cards htdwc-cards-3">
            <a
              href="https://www.aiuxdesign.guide"
              target="_blank"
              rel="noopener noreferrer"
              className="gs-card gs-card--link"
            >
              <p className="gs-card-title">Pattern library →</p>
              <p className="gs-card-body">
                36 patterns, 8 categories. Designed for designers; useful for
                everyone.
              </p>
              <p className="gs-card-cta">aiuxdesign.guide</p>
            </a>
            <Link href="/library" className="gs-card gs-card--link">
              <p className="gs-card-title">Free specialist library →</p>
              <p className="gs-card-body">
                {SKILLS.length} design agents as Claude Code slash commands.
                Install one at a time.
              </p>
              <p className="gs-card-cta">/library</p>
            </Link>
            <a
              href="https://github.com/imsaif/design-with-claude"
              target="_blank"
              rel="noopener noreferrer"
              className="gs-card gs-card--link"
            >
              <p className="gs-card-title">GitHub →</p>
              <p className="gs-card-body">
                Source, issues, contributing. Open to PRs from designers and
                engineers.
              </p>
              <p className="gs-card-cta">imsaif/design-with-claude</p>
            </a>
          </div>
        </section>

        <section className="htdwc-section htdwc-section--cta">
          <div className="htdwc-prose">
            <h2 className="htdwc-h2">Install dwic.</h2>
            <p>One command. Ships in seconds.</p>
          </div>
          <HtdwcCliCopy command="npx @imrandwc/dwic setup" />
        </section>
      </main>
      <Footer />
    </>
  );
}
