"use client";

import { useState } from "react";
import {
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

interface Props {
  command: string;
}

export default function HtdwcCliCopy({ command }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Older browsers / blocked clipboard — silent fallback. Command is on screen.
    }
  }

  return (
    <div className="htdwc-cli">
      <span className="htdwc-cli-prompt">$</span>
      <code>{command}</code>
      <button
        type="button"
        onClick={copy}
        className="htdwc-cli-copy"
        aria-label={copied ? "Copied" : "Copy command"}
      >
        {copied ? (
          <>
            <CheckIcon className="htdwc-cli-copy-icon" aria-hidden="true" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <ClipboardDocumentIcon
              className="htdwc-cli-copy-icon"
              aria-hidden="true"
            />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );
}
