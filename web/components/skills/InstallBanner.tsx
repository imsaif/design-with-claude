"use client";

import { useCallback, useState } from "react";
import {
  ClipboardIcon,
  CheckIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";

// Same control as the homepage hero: .gs-hero-cli-row for the navy pill and
// .gs-hero-cli-copy for the white Copy button, used directly rather than copied,
// so the two pages cannot drift apart.
//
// What sits inside differs, because the two pages install different things. The
// homepage shows `$ npx dwic-audit`, one short shell command. This installs a
// Claude Code plugin, which is two slash commands typed inside Claude Code, and
// they do not fit a single nowrap row. So the pill carries the destination, the
// way Anthropic's own plugin pages do (claude.com/plugins/<name> shows
// "Install in / Claude Code" and never renders the command), and Copy puts both
// commands on the clipboard.
//
// Step 2 is `design-with-claude`, not `design-with-claude@design-with-claude`:
// the suffix names the marketplace, which here shares the plugin's name.
const PLUGIN_INSTALL = [
  "/plugin marketplace add imsaif/design-with-claude",
  "/plugin install design-with-claude",
].join("\n");

export function InstallBanner() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(PLUGIN_INSTALL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, []);

  return (
    <section id="install" className="skills-install">
      <div className="gs-hero-cli-row">
        <BriefcaseIcon className="skills-install-mark" aria-hidden="true" />
        <span className="skills-install-dest">
          {copied ? "Paste into Claude Code" : "Install in Claude Code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="gs-hero-cli-copy"
          aria-live="polite"
          aria-label={
            copied ? "Commands copied" : "Copy the install commands to clipboard"
          }
        >
          {copied ? (
            <CheckIcon className="gs-hero-cli-copy-icon" aria-hidden="true" />
          ) : (
            <ClipboardIcon
              className="gs-hero-cli-copy-icon"
              aria-hidden="true"
            />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

    </section>
  );
}
