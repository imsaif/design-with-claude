import { CopyButton } from "./CopyButton";

interface EmptySectionProps {
  label: string;
  helper: string;
  promptHint: string;
}

export function EmptySection({ label, helper, promptHint }: EmptySectionProps) {
  return (
    <div
      style={{
        border: "1px dashed rgba(255,255,255,0.12)",
        borderRadius: 12,
        padding: "1.25rem 1.5rem",
        background: "rgba(255,255,255,0.015)",
      }}
    >
      <div
        style={{
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.45)",
          marginBottom: "0.4rem",
        }}
      >
        {label} · not set yet
      </div>
      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", marginBottom: "0.85rem" }}>
        {helper}
      </p>
      <div
        style={{
          background: "#0F0F10",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          padding: "0.75rem 0.9rem",
          fontFamily: "var(--font-geist-mono), SF Mono, monospace",
          fontSize: "0.78rem",
          color: "rgba(255,255,255,0.78)",
          lineHeight: 1.55,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <span style={{ flex: 1 }}>{promptHint}</span>
        <CopyButton text={promptHint} label="Copy" compact />
      </div>
    </div>
  );
}
