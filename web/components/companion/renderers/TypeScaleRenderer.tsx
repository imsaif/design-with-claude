import type { TypeScaleData } from "@/lib/dwic/types";

const SAMPLE: Record<string, string> = {
  display: "The quiet hum of clean design",
  h1: "Headline that anchors the page",
  h2: "Section heading",
  h3: "Sub-section",
  h4: "Minor heading",
  "body-lg": "The larger body line is for lead paragraphs.",
  body: "Body copy should be comfortable to read at any width.",
  "body-sm": "Smaller body for secondary information and labels.",
  caption: "Caption / helper text",
};

export function TypeScaleRenderer({ data }: { data: TypeScaleData }) {
  return (
    <div>
      <h3 style={{ fontSize: "0.95rem", marginBottom: "1rem", color: "rgba(255,255,255,0.85)" }}>
        {data.name}
      </h3>
      <div style={{ display: "grid", gap: "0.65rem" }}>
        {data.scale.map((row) => (
          <div
            key={row.role}
            style={{
              padding: "0.9rem 1rem",
              borderRadius: 8,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem", flexWrap: "wrap" }}>
              <code
                style={{
                  fontSize: "0.7rem",
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "var(--font-geist-mono)",
                  minWidth: 70,
                }}
              >
                {row.role}
              </code>
              <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-geist-mono)" }}>
                {row.clamp} · lh {row.lineHeight} · wt {row.weight}
              </span>
            </div>
            <div
              style={{
                marginTop: "0.3rem",
                fontSize: row.clamp,
                lineHeight: Number(row.lineHeight) || 1.4,
                fontWeight: Number(row.weight) || 400,
                color: "#fff",
              }}
            >
              {SAMPLE[row.role] ?? "Sample text"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
