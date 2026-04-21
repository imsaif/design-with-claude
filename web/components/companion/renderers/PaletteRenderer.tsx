import type { PaletteData } from "@/lib/dwic/types";

export function PaletteRenderer({ data }: { data: PaletteData }) {
  const byPrefix = new Map<string, typeof data.tokens>();
  for (const t of data.tokens) {
    const prefix = t.role.split(" ")[0];
    const group = byPrefix.get(prefix) ?? [];
    group.push(t);
    byPrefix.set(prefix, group);
  }

  return (
    <div>
      <h3 style={{ fontSize: "0.95rem", marginBottom: "1rem", color: "rgba(255,255,255,0.85)" }}>
        {data.name}
      </h3>
      {[...byPrefix.entries()].map(([group, tokens]) => (
        <div key={group} style={{ marginBottom: "1.25rem" }}>
          <div
            style={{
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.45)",
              marginBottom: "0.5rem",
            }}
          >
            {group}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "0.4rem" }}>
            {tokens.map((t) => (
              <div
                key={t.name}
                title={`${t.name} · ${t.role}`}
                style={{
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "#0F0F10",
                }}
              >
                <div style={{ height: 60, background: t.hex }} />
                <div style={{ padding: "0.4rem 0.5rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-geist-mono)" }}>
                    {t.hex}
                  </div>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "rgba(255,255,255,0.4)",
                      marginTop: "0.1rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
