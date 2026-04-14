"use client";

/**
 * Orientation card for /account. Shows what a real project card's anatomy
 * looks like. Explicitly non-interactive — CTAs are labelled dimmed and a
 * clear "Example only" header + a pointer to the + tile for the real action
 * prevent the "wait, what do I click?" problem.
 */
export function SampleProjectCard() {
  return (
    <article
      aria-label="Sample project card — orientation only, not a real project"
      style={{
        background: "rgba(200,240,122,0.03)",
        border: "1px dashed rgba(200,240,122,0.3)",
        borderRadius: 12,
        padding: "0 0 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        minHeight: 128,
        overflow: "hidden",
      }}
    >
      {/* Top banner — replaces the absolute pill so it can't collide with anything */}
      <div
        style={{
          background: "rgba(200,240,122,0.12)",
          borderBottom: "1px dashed rgba(200,240,122,0.3)",
          padding: "0.35rem 1.1rem",
          fontSize: "0.62rem",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "#c8f07a",
          fontWeight: 600,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Example — what your cards will look like</span>
      </div>

      <div style={{ padding: "0 1.1rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
        <header style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            title="Lime dot = Claude Code is currently connected to this project"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#c8f07a",
              boxShadow: "0 0 8px rgba(200,240,122,0.6)",
            }}
          />
          <h3
            style={{
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#fff",
              fontFamily: "var(--font-geist-mono), monospace",
              flex: 1,
            }}
          >
            your-project
          </h3>
          <span
            title="Tool calls run in this project — 10 free across all your projects"
            style={{
              fontSize: "0.72rem",
              color: "rgba(255,255,255,0.5)",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            × 7 cmds
          </span>
        </header>

        <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}>
          A short description of what you&apos;re building.
        </p>

        <div
          style={{
            display: "grid",
            gap: "0.3rem",
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.55)",
            paddingTop: "0.5rem",
            borderTop: "1px dashed rgba(255,255,255,0.08)",
            lineHeight: 1.5,
          }}
        >
          <Row
            marker={<span style={{ color: "#c8f07a", fontSize: "0.85rem", lineHeight: 1 }}>●</span>}
            label="lime dot = Claude Code is live in this project"
          />
          <Row
            marker={<code style={{ fontFamily: "var(--font-geist-mono)" }}>your-project</code>}
            label="slug you pass to npx designwithclaude --project=…"
          />
          <Row
            marker={<span style={{ fontFamily: "var(--font-geist-mono)", color: "rgba(255,255,255,0.85)" }}>× 7 cmds</span>}
            label="tool calls used (10 free across all your projects)"
          />
        </div>

        <p
          style={{
            marginTop: "0.25rem",
            paddingTop: "0.65rem",
            borderTop: "1px dashed rgba(255,255,255,0.08)",
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.65)",
          }}
        >
          To make a real one →{" "}
          <strong style={{ color: "#c8f07a" }}>click the dashed</strong>{" "}
          <span
            aria-hidden
            style={{
              display: "inline-flex",
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "rgba(200,240,122,0.15)",
              color: "#c8f07a",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.72rem",
              fontWeight: 500,
              verticalAlign: "text-bottom",
              lineHeight: 1,
              margin: "0 0.15rem",
            }}
          >
            +
          </span>{" "}
          <strong style={{ color: "#c8f07a" }}>tile</strong>.
        </p>
      </div>
    </article>
  );
}

function Row({ marker, label }: { marker: React.ReactNode; label: string }) {
  return (
    <div style={{ display: "flex", gap: "0.55rem", alignItems: "baseline" }}>
      <span
        style={{
          minWidth: 84,
          fontWeight: 500,
          flexShrink: 0,
          color: "rgba(255,255,255,0.85)",
          fontSize: "0.72rem",
        }}
      >
        {marker}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
    </div>
  );
}
