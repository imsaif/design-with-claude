import Link from "next/link";
import {
  CommandLineIcon,
  EyeIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import DwicIcon from "@/components/DwicIcon";

export function Hero() {
  return (
    <section className="skills-hero">
      <h1>
        dwic is a senior designer inside your terminal<span className="skills-hero-cursor" aria-hidden="true" />
      </h1>
      <p className="skills-hero-sub">
        It knows your design system, your design choices, and your code.
        It catches changes before they get shipped.
      </p>
      <div className="skills-hero-cta">
        <Link href="/get-started" className="skills-hero-button">
          Get started
        </Link>
      </div>
      <ol className="skills-hero-steps">
        <li className="skills-hero-step">
          <span className="skills-hero-step-icon" aria-hidden="true">
            <CommandLineIcon />
          </span>
          <h2 className="skills-hero-step-title">Install in Claude Code</h2>
          <p className="skills-hero-step-body">One paste-able command. dwic runs as an MCP server alongside.</p>
        </li>
        <li className="skills-hero-step">
          <span className="skills-hero-step-icon" aria-hidden="true">
            <DwicIcon />
          </span>
          <h2 className="skills-hero-step-title">dwic learns your project</h2>
          <p className="skills-hero-step-body">Auto-detects your stack and tokens. Asks only what it can&apos;t see.</p>
        </li>
        <li className="skills-hero-step">
          <span className="skills-hero-step-icon" aria-hidden="true">
            <EyeIcon />
          </span>
          <h2 className="skills-hero-step-title">Catch drift on every run</h2>
          <p className="skills-hero-step-body">Audits your design system and remembers what changed.</p>
        </li>
        <li className="skills-hero-step">
          <span className="skills-hero-step-icon" aria-hidden="true">
            <ArrowPathIcon />
          </span>
          <h2 className="skills-hero-step-title">Monitor continuously</h2>
          <p className="skills-hero-step-body">Wire dwic into CI or pre-commit. Every push compares against the last baseline.</p>
        </li>
      </ol>
    </section>
  );
}
