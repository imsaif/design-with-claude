"use client";
import { useState } from "react";

/**
 * First-run orientation card. Drops into the /account project grid alongside
 * real project cards and shows what each visual element on a real card means.
 * Non-interactive (no navigation, no API calls) — it's a visual key, not a
 * working project.
 */
export function SampleProjectCard() {
  const [showGuide, setShowGuide] = useState(true);

  return (
    <article
      aria-label="Sample project card — not a real project"
      style={{
        background: "rgba(200,240,122,0.025)",
        border: "1px dashed rgba(200,240,122,0.3)",
        borderRadius: 12,
        padding: "1rem 1.1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        minHeight: 128,
        position: "relative",
      }}
    >
      {/* EXAMPLE pill */}
      <div
        style={{
          position: "absolute",
          top: "0.65rem",
          right: "0.7rem",
          fontSize: "0.58rem",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "#c8f07a",
          background: "rgba(200,240,122,0.1)",
          border: "1px solid rgba(200,240,122,0.28)",
          padding: "0.15rem 0.45rem",
          borderRadius: 999,
          fontWeight: 600,
        }}
      >
        Example
      </div>

      <header style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingRight: "4rem" }}>
        <span
          title="Green dot = Claude Code is currently connected to this project"
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
          acme-landing
        </h3>
        <span
          title="Commands used on this project"
          style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-geist-mono)" }}
        >
          7
        </span>
      </header>

      <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}>
        Acme marketing site
      </p>

      <div
        style={{
          display: "flex",
          gap: "0.6rem",
          fontSize: "0.78rem",
          alignItems: "center",
          marginTop: "auto",
          opacity: 0.75,
        }}
      >
        <span style={{ color: "#c8f07a", fontWeight: 500 }}>Open companion →</span>
        <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
        <span style={{ color: "rgba(255,255,255,0.5)" }}>Install command</span>
      </div>

      {showGuide ? (
        <div
          style={{
            marginTop: "0.25rem",
            paddingTop: "0.75rem",
            borderTop: "1px dashed rgba(200,240,122,0.22)",
            display: "grid",
            gap: "0.35rem",
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.5,
          }}
        >
          <Row
            marker={<span style={{ color: "#c8f07a" }}>●</span>}
            label="lime = Claude Code session is live for this project"
          />
          <Row
            marker={<code style={{ fontFamily: "var(--font-geist-mono)" }}>acme-landing</code>}
            label="slug you passed to npx designwithclaude setup --project=…"
          />
          <Row marker="7" label="tool calls made on this project so far" />
          <Row
            marker={<span style={{ color: "#c8f07a" }}>Open companion →</span>}
            label="watch your palette, type, spacing render live as you work"
          />
          <button
            type="button"
            onClick={() => setShowGuide(false)}
            style={{
              marginTop: "0.35rem",
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.45)",
              fontSize: "0.68rem",
              padding: 0,
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
            }}
          >
            Hide guide
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          style={{
            marginTop: "0.25rem",
            background: "transparent",
            border: "none",
            color: "rgba(200,240,122,0.7)",
            fontSize: "0.72rem",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
          }}
        >
          Show guide
        </button>
      )}
    </article>
  );
}

function Row({ marker, label }: { marker: React.ReactNode; label: string }) {
  return (
    <div style={{ display: "flex", gap: "0.55rem", alignItems: "baseline" }}>
      <span
        style={{
          minWidth: 80,
          fontWeight: 500,
          flexShrink: 0,
          color: "rgba(255,255,255,0.85)",
          fontSize: "0.75rem",
        }}
      >
        {marker}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
    </div>
  );
}
