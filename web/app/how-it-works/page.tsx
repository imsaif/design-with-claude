import Link from "next/link";
import { Nav } from "@/components/skills/Nav";
import { Footer } from "@/components/skills/Footer";
import HtdwcAnimatedTerminal from "@/components/skills/HtdwcAnimatedTerminal";
import HtdwcCliCopy from "@/components/skills/HtdwcCliCopy";
import { SKILLS } from "@/app/data/skills";

const SITE_URL = "https://designwithclaude.com";
const PAGE_PATH = "/how-it-works";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "How it works";
const PAGE_DESCRIPTION =
  "How dwic works under the hood: a deterministic design-system review you can run anywhere, plus a senior designer inside Claude Code that fixes what it finds and remembers your project.";
const DATE_PUBLISHED = "2026-05-29";
const DATE_MODIFIED = "2026-05-29";

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

// The eight audit categories and what each deterministically checks.
const CATEGORIES = [
  { name: "Color", checks: "WCAG contrast ratios, mandated-accent drift" },
  { name: "Typography", checks: "type scale, line-height, font weights" },
  { name: "Spacing", checks: "grid alignment, off-grid values, big jumps" },
  { name: "Accessibility", checks: "labels, heading order, landmarks, alt text" },
  { name: "Forms", checks: "labels, fieldsets, input types, error wiring" },
  { name: "Navigation", checks: "landmarks, aria-current, mobile disclosure" },
  { name: "Motion", checks: "reduced-motion, transition: all, runaway durations" },
  { name: "Copy", checks: "weak CTAs, jargon, passive voice, shouting" },
];

const BOUNDARIES = [
  "It checks structure, not taste. dwic won't tell you whether your design is good. It tells you where it breaks its own rules.",
  "It's a rules engine, not a guesser. The audit is deterministic math and parsing, so it never hallucinates a finding, but it only catches what the rules cover.",
  "It won't redesign for you. The CLI reports; the fixes happen when you ask a specialist in Claude Code, with you in the loop.",
  "It remembers your decisions, not your whole codebase. Memory is your project profile plus your recent specialist calls, not a semantic index of every file.",
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
          <p className="skills-hero-eyebrow">How it works · 5 min read</p>
          <h1>How dwic works.</h1>
          <p className="skills-hero-sub">
            A senior designer inside your terminal. One engine, two ways to use
            it: a deterministic review you can run anywhere, and a designer that
            fixes what it finds inside Claude Code.
          </p>
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">Why it matters</p>
            <h2 className="htdwc-h2">Design review on every run, not every launch.</h2>
            <p>
              Linters check your code. Type checkers check your types. Nothing
              checks your design system, so contrast failures, a type scale that
              drifted three sizes off, and unlabeled inputs ship quietly. Someone
              catches them weeks later, by eye, if at all.
            </p>
            <p>
              dwic turns that review into a command. It runs in seconds, returns
              the same answer every time, and fits in CI. So checking your design
              system stops being a thing a senior designer does occasionally and
              becomes a thing that happens on every change.
            </p>
          </div>
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">The engine</p>
            <h2 className="htdwc-h2">A deterministic design review.</h2>
            <p>
              Under the hood, dwic reads your CSS and components and runs eight
              category checks: WCAG contrast math, design-token parsing, and
              markup heuristics. There is no LLM in this step and nothing
              leaves your machine, so the result is fast, private, and
              reproducible: the same project always returns the same findings.
            </p>
          </div>
          <HtdwcCliCopy command="npx @imrandwc/dwic audit" />
          <p className="htdwc-cli-note">
            No token, no install, no Claude Code required. Runs entirely on your
            machine.
          </p>
          <div className="htdwc-specialists">
            {CATEGORIES.map((c) => (
              <div key={c.name} className="htdwc-specialist">
                <p className="htdwc-specialist-name">{c.name}</p>
                <p className="htdwc-specialist-role">{c.checks}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">On every run</p>
            <h2 className="htdwc-h2">One dashboard, a report, an exit code.</h2>
            <p>
              Each run prints a triage dashboard, writes a shareable markdown
              report to <code>.dwic/</code> so it&rsquo;s reviewable in a pull
              request, and exits non-zero when there are errors, which is all CI
              needs to fail a build on design-system drift.
            </p>
          </div>
          <HtdwcAnimatedTerminal />
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">Inside Claude Code</p>
            <h2 className="htdwc-h2">The senior designer that fixes it.</h2>
            <p>
              Install the MCP server and the same engine runs inside Claude Code.
              When you ask a specialist (<code>color-specialist</code>,{" "}
              <code>accessibility-specialist</code>, or any of the others), dwic
              runs the deterministic checks to find the facts, then Claude
              reasons over those findings to explain them and apply specific
              fixes. The engine finds what&rsquo;s wrong; Claude fixes it.
            </p>
          </div>
          <HtdwcCliCopy command="npx @imrandwc/dwic setup" />
          <p className="htdwc-cli-note">
            Restart Claude Code once. The specialists appear as MCP tools you can
            invoke from any project.
          </p>
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">Memory</p>
            <h2 className="htdwc-h2">It remembers your project.</h2>
            <p>
              The first time you call a specialist in a new project, dwic asks a
              few questions (what you&rsquo;re building, your stack, your design
              system) and stores the answers. After that, every
              call carries that profile plus your most recent specialist
              decisions, so the designer builds on what you&rsquo;ve already
              chosen instead of re-interrogating you each session.
            </p>
            <p>
              That&rsquo;s the difference between a one-off prompt and a designer
              who knows your project: continuity, without you re-explaining it.
            </p>
          </div>
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">Honest boundaries</p>
            <h2 className="htdwc-h2">What dwic doesn&rsquo;t do.</h2>
            <p>
              A senior designer is most useful when you know exactly what they
              will and won&rsquo;t weigh in on. So, plainly:
            </p>
            <ul className="htdwc-boundaries">
              {BOUNDARIES.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">One brain, two surfaces</p>
            <h2 className="htdwc-h2">The expertise is open.</h2>
            <p>
              dwic isn&rsquo;t a black box. Each specialist&rsquo;s knowledge
              lives in a plain markdown role prompt, and those prompts are the
              free, open{" "}
              <Link href="/library">design skill library</Link>. When you ask
              dwic&rsquo;s <code>color-specialist</code> inside Claude Code, its
              expertise comes from the exact same file the free{" "}
              <code>/color-specialist</code> slash command loads.
            </p>
            <p>
              dwic wires twelve of those specialists as MCP tools and adds what
              plain prompts can&rsquo;t: a deterministic audit engine, project
              memory, and the one-line CLI. The rest of the library is free to
              drop into Claude Code as slash commands today.
            </p>
          </div>
        </section>

        <section className="htdwc-section">
          <div className="htdwc-prose">
            <p className="htdwc-eyebrow">Going deeper</p>
            <h2 className="htdwc-h2">Where to read next.</h2>
          </div>
          <div className="gs-cards htdwc-cards-3">
            <Link href="/how-to-design-with-claude" className="gs-card gs-card--link">
              <p className="gs-card-title">The full workflow →</p>
              <p className="gs-card-body">
                The day-to-day loop: install, ask specialists, audit, iterate.
                The how-to for shipping design work with Claude Code.
              </p>
              <p className="gs-card-cta">How to design with Claude</p>
            </Link>
            <a
              href="https://www.aiuxdesign.guide"
              target="_blank"
              rel="noopener noreferrer"
              className="gs-card gs-card--link"
            >
              <p className="gs-card-title">Pattern library →</p>
              <p className="gs-card-body">
                Go deeper on AI UX: 36 patterns across 8 categories, from how the
                best AI products are actually built.
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
          </div>
        </section>

        <section className="htdwc-section htdwc-section--cta">
          <div className="htdwc-prose">
            <h2 className="htdwc-h2">Try the one-line audit.</h2>
            <p>No token, no install. Runs on your machine in seconds.</p>
          </div>
          <HtdwcCliCopy command="npx @imrandwc/dwic audit" />
        </section>
      </main>
      <Footer />
    </>
  );
}
