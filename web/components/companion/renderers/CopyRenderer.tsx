import type { CopyData } from "@/lib/dwic/types";

export function CopyRenderer({ data }: { data: CopyData }) {
  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {data.context || "Copy"}
        </span>
        {data.tone ? (
          <span
            style={{
              fontSize: "0.7rem",
              padding: "0.15rem 0.5rem",
              borderRadius: 999,
              background: "rgba(200,240,122,0.1)",
              color: "#c8f07a",
            }}
          >
            {data.tone}
          </span>
        ) : null}
      </div>
      <div style={{ display: "grid", gap: "0.6rem" }}>
        {data.blocks.map((b, i) => (
          <div
            key={i}
            style={{
              padding: "0.8rem 1rem",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
            }}
          >
            {b.label ? (
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "rgba(255,255,255,0.45)",
                  marginBottom: "0.25rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {b.label}
              </div>
            ) : null}
            <div style={{ fontSize: "0.95rem", color: "#fff" }}>{b.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
