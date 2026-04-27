import {
  CommandLineIcon,
  EyeIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

import DwicIcon from "@/components/DwicIcon";
import { EmailGate } from "@/components/skills/EmailGate";

export function GetStartedPreview() {
  return (
    <div className="gs">
      <section className="gs-hero">
        <h1 className="gs-hero-title">
          dwic is a senior designer inside your terminal
        </h1>
        <p className="gs-hero-sub">
          It knows your design system, your design choices, and your code. It
          catches changes before they get shipped.
        </p>
        <div className="gs-hero-form">
          <EmailGate />
        </div>
      </section>

      <section className="gs-cards" aria-label="How dwic works">
        <article className="gs-card">
          <CommandLineIcon className="gs-card-icon" aria-hidden="true" />
          <h2 className="gs-card-title">Install in Claude Code</h2>
          <p className="gs-card-body">
            One paste-able command. dwic runs as an MCP server alongside.
          </p>
        </article>

        <article className="gs-card">
          <DwicIcon className="gs-card-icon" aria-hidden="true" />
          <h2 className="gs-card-title">dwic learns your project</h2>
          <p className="gs-card-body">
            Auto-detects your stack and tokens. Asks only what it can&apos;t
            see.
          </p>
        </article>

        <article className="gs-card">
          <EyeIcon className="gs-card-icon" aria-hidden="true" />
          <h2 className="gs-card-title">Catch drift on every run</h2>
          <p className="gs-card-body">
            Audits your design system and remembers what changed.
          </p>
        </article>

        <article className="gs-card">
          <ArrowPathIcon className="gs-card-icon" aria-hidden="true" />
          <h2 className="gs-card-title">Monitor continuously</h2>
          <p className="gs-card-body">
            Wire dwic into CI or pre-commit. Every push compares against the
            last baseline.
          </p>
        </article>
      </section>
    </div>
  );
}
