import type { SpacingData } from "@/lib/dwc/types";

export function SpacingRenderer({ data }: { data: SpacingData }) {
  const maxPx = Math.max(...data.steps.map((s) => s.px), 1);
  return (
    <div>
      <h3 style={{ fontSize: "0.95rem", marginBottom: "1rem", color: "rgba(255,255,255,0.85)" }}>
        {data.name}
      </h3>
      <div style={{ display: "grid", gap: "0.45rem" }}>
        {data.steps.map((step) => (
          <div
            key={step.name}
            style={{
              display: "grid",
              gridTemplateColumns: "80px 80px 1fr 90px",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.35rem 0",
              fontSize: "0.8rem",
            }}
          >
            <code style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-geist-mono)" }}>
              --{step.name}
            </code>
            <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-geist-mono)" }}>
              {step.px}px
            </span>
            <div
              style={{
                background: "rgba(200,240,122,0.35)",
                height: 14,
                borderRadius: 2,
                width: `${(step.px / maxPx) * 100}%`,
                minWidth: step.px ? 2 : 0,
              }}
            />
            <span style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-geist-mono)", textAlign: "right" }}>
              {step.rem}rem
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
