import type { ComponentSpecData } from "@/lib/dwic/types";

export function ComponentSpecRenderer({ data }: { data: ComponentSpecData }) {
  return (
    <div>
      <h3 style={{ fontSize: "1.05rem", marginBottom: "0.4rem", color: "#fff" }}>{data.name}</h3>
      <Section label="Anatomy" body={data.anatomy} />
      <Section label="States" body={data.states.join(", ") || "—"} />
      <Section label="Accessibility" body={data.accessibility} />
      {data.markup ? (
        <div style={{ marginTop: "1rem" }}>
          <div
            style={{
              fontSize: "0.68rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.45)",
              marginBottom: "0.4rem",
            }}
          >
            Markup
          </div>
          <pre
            style={{
              margin: 0,
              padding: "0.9rem 1rem",
              background: "#0F0F10",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              fontSize: "0.78rem",
              fontFamily: "var(--font-geist-mono)",
              color: "rgba(255,255,255,0.88)",
              overflowX: "auto",
            }}
          >
            {data.markup}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div
        style={{
          fontSize: "0.68rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.45)",
          marginBottom: "0.2rem",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)" }}>{body}</div>
    </div>
  );
}
