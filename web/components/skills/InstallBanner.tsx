"use client";

import { useCallback, useState } from "react";
import { SKILLS } from "@/app/data/skills";

// The library predates the plugin: it was built when a single markdown file per
// skill was the only way to install anything, so the page taught that and only
// that. Both paths are real and serve different moments. Someone with a broken
// form wants one file today; someone who has copied three already wants all of
// them. The plugin leads because it is the smaller ask once you want more than
// one, and the per-skill path stays because it is the smaller ask the first time.
const PLUGIN_INSTALL =
  "claude plugin marketplace add imsaif/design-with-claude && claude plugin install design-with-claude@design-with-claude";

export function InstallBanner() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(PLUGIN_INSTALL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <section id="install" className="skills-install">
      <div className="skills-install-inner">
        <h2 className="skills-install-title">How to install</h2>

        <div className="skills-install-plugin">
          <div className="skills-install-step-num">
            All {SKILLS.length} at once
          </div>
          <div className="skills-install-step-title">
            Install the whole library as a plugin
          </div>
          <div className="skills-install-step-desc">
            One command in your terminal. Every skill below becomes available in
            Claude Code, and updates arrive without you copying anything again.
          </div>
          <div
            className={`skill-card-code ${copied ? "copied" : ""}`}
            onClick={handleCopy}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCopy();
              }
            }}
            aria-label={copied ? "Command copied" : "Copy plugin install command"}
          >
            <div className="skill-card-code-scroll">
              <code>{PLUGIN_INSTALL}</code>
            </div>
            <span className="skill-card-copy-label">
              {copied ? "Copied" : "Copy"}
            </span>
          </div>
        </div>

        <div className="skills-install-or">Or take just the one you need</div>

        <div className="skills-install-steps">
          <div className="skills-install-step">
            <div className="skills-install-step-num">Step 1</div>
            <div className="skills-install-step-title">
              Open a skill, copy its command
            </div>
            <div className="skills-install-step-desc">
              Open any skill card below to reveal its install command
            </div>
          </div>
          <div className="skills-install-step">
            <div className="skills-install-step-num">Step 2</div>
            <div className="skills-install-step-title">
              Run in your project
            </div>
            <div className="skills-install-step-desc">
              Paste into your terminal inside any Claude Code project
            </div>
          </div>
          <div className="skills-install-step">
            <div className="skills-install-step-num">Step 3</div>
            <div className="skills-install-step-title">
              Use in Claude Code
            </div>
            <div className="skills-install-step-desc">
              Claude reads the skill from .claude/commands/ and picks it up
              automatically
            </div>
          </div>
        </div>

        <p className="skills-install-footer">
          Skills are plain markdown files. No dependencies, no configuration.
          Compatible with Claude Code, Cursor, and any agent that supports
          custom commands.
        </p>
      </div>
    </section>
  );
}
