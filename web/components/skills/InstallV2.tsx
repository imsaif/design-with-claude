"use client";

import { useState } from "react";
import Link from "next/link";

const INSTALL_CMD = "npx designwithclaude setup --token=imr_xxx --project=your-project";

export function InstallV2() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <section id="install" className="dwc-install">
      <div className="dwc-install-inner">
        <p className="dwc-install-eyebrow">Install</p>
        <h2 className="dwc-install-title">One command, inside any Claude Code project.</h2>

        <div className="dwc-install-cmdrow">
          <code className="dwc-install-cmd">{INSTALL_CMD}</code>
          <button className="dwc-install-copy" onClick={copy} aria-live="polite">
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>

        <p className="dwc-install-note">
          dwc runs as an MCP server alongside Claude Code. You call any audit
          specialist from a Claude Code session — dwc parses your tokens or
          markup server-side and returns real findings, not LLM guesses.
        </p>

        <p className="dwc-install-cta">
          Don&apos;t have a token yet?{" "}
          <Link href="/start" className="dwc-install-link">
            Get one in 5 questions →
          </Link>
        </p>
      </div>
    </section>
  );
}
