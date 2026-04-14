"use client";
import { useState } from "react";

interface StoredEvent {
  id: string;
  receivedAt: string;
  toolName: string;
  timestamp: string;
}

export function HistoryPanel({ events }: { events: StoredEvent[] }) {
  const [open, setOpen] = useState(false);
  const sorted = [...events].reverse();

  return (
    <section
      style={{
        background: "#0a0a0b",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        marginTop: "1.5rem",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          padding: "0.7rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          fontFamily: "inherit",
        }}
      >
        <span
          style={{
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.55)",
          }}
        >
          History · {events.length} event{events.length === 1 ? "" : "s"}
        </span>
        <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>{open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <ul style={{ listStyle: "none", padding: "0 1rem 0.85rem", margin: 0, display: "grid", gap: "0.35rem" }}>
          {sorted.length === 0 ? (
            <li style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.82rem", padding: "0.4rem 0" }}>
              Nothing yet.
            </li>
          ) : (
            sorted.map((e) => (
              <li
                key={e.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.78rem",
                  color: "rgba(255,255,255,0.7)",
                  padding: "0.35rem 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span>{e.toolName}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-geist-mono)" }}>
                  {new Date(e.timestamp).toLocaleTimeString()}
                </span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </section>
  );
}
