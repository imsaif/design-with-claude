"use client";
import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
  compact?: boolean;
}

export function CopyButton({ text, label = "Copy", compact }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: copied ? "#c8f07a" : "#1a1a1c",
        color: copied ? "#0F0F10" : "#fff",
        border: copied ? "1px solid #c8f07a" : "1px solid rgba(255,255,255,0.16)",
        borderRadius: 6,
        padding: compact ? "0.35rem 0.75rem" : "0.6rem 1rem",
        fontSize: compact ? "0.75rem" : "0.85rem",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 150ms ease",
        fontFamily: "inherit",
      }}
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}
