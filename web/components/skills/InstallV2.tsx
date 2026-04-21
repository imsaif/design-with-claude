"use client";

import { useState } from "react";
import Link from "next/link";

const INSTALL_CMD = "npx dwic setup --token=imr_xxx --project=your-project";

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
    <section id="install" className="dwic-install">
      <div className="dwic-install-inner">
        <p className="dwic-install-eyebrow">Install</p>
        <h2 className="dwic-install-title">One command, inside any Claude Code project.</h2>

        <div className="dwic-install-cmdrow">
          <code className="dwic-install-cmd">{INSTALL_CMD}</code>
          <button className="dwic-install-copy" onClick={copy} aria-live="polite">
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>

        <p className="dwic-install-note">
          dwic runs as an MCP server alongside Claude Code. You call any audit
          specialist from a Claude Code session — dwic parses your tokens or
          markup server-side and returns real findings, not LLM guesses.
        </p>

        <p className="dwic-install-cta">
          Don&apos;t have a token yet?{" "}
          <Link href="/start" className="dwic-install-link">
            Get one in 5 questions →
          </Link>
        </p>
      </div>
    </section>
  );
}
