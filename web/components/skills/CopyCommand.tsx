"use client";

import { useState } from "react";

interface Props {
  command: string;
}

export function CopyCommand({ command }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Older browsers — fall through silently. The command is on screen.
    }
  }

  return (
    <div className="get-started-cmd">
      <code className="get-started-cmd-text">{command}</code>
      <button
        type="button"
        onClick={copy}
        className="get-started-cmd-copy"
        aria-live="polite"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}
