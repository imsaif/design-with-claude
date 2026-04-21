"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,31}$/;

/**
 * Drop-in grid tile that behaves like a "new item" card. Collapsed state is a
 * dashed placeholder with a large "+"; clicking expands it inline into a slug
 * form (no modal, no separate section). Same dimensions as a real project card.
 */
export function AddProjectTile({ token }: { token: string }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);

  const normalized = slug
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 32);

  const valid = useMemo(() => SLUG_PATTERN.test(normalized), [normalized]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    router.push(`/start?token=${token}&project=${normalized}`);
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        style={{
          background: "transparent",
          border: "1px dashed rgba(255,255,255,0.18)",
          borderRadius: 12,
          padding: "1rem 1.1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4rem",
          color: "rgba(255,255,255,0.55)",
          cursor: "pointer",
          fontFamily: "inherit",
          minHeight: 128,
          transition: "all 140ms ease",
        }}
        className="dwic-add-tile"
      >
        <span
          aria-hidden
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
            lineHeight: 1,
            color: "rgba(255,255,255,0.7)",
            fontWeight: 400,
          }}
        >
          +
        </span>
        <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>Add project</span>
        <style>{`
          .dwic-add-tile:hover {
            border-color: rgba(200,240,122,0.5);
            color: #c8f07a;
          }
          .dwic-add-tile:hover > span:first-child {
            background: rgba(200,240,122,0.15);
            color: #c8f07a;
          }
        `}</style>
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: "rgba(200,240,122,0.04)",
        border: `1px solid ${valid ? "rgba(200,240,122,0.35)" : "rgba(200,240,122,0.18)"}`,
        borderRadius: 12,
        padding: "1rem 1.1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
        minHeight: 128,
      }}
    >
      <div
        style={{
          fontSize: "0.68rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.45)",
        }}
      >
        New project · slug
      </div>
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="e.g. thriya"
        autoFocus
        autoComplete="off"
        spellCheck={false}
        style={{
          width: "100%",
          background: "#0F0F10",
          border: `1px solid ${valid ? "#c8f07a" : slug ? "rgba(255,180,80,0.4)" : "rgba(255,255,255,0.14)"}`,
          borderRadius: 8,
          padding: "0.55rem 0.75rem",
          color: "#fff",
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: "0.88rem",
          outline: "none",
        }}
      />
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={() => {
            setExpanded(false);
            setSlug("");
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontSize: "0.78rem",
            padding: 0,
            fontFamily: "inherit",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!valid || busy}
          style={{
            background: valid && !busy ? "#c8f07a" : "rgba(255,255,255,0.08)",
            color: valid && !busy ? "#0F0F10" : "rgba(255,255,255,0.35)",
            border: "none",
            borderRadius: 6,
            padding: "0.45rem 0.85rem",
            fontWeight: 600,
            cursor: valid && !busy ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            fontSize: "0.82rem",
          }}
        >
          {busy ? "Opening…" : "Create →"}
        </button>
      </div>
      <p
        style={{
          fontSize: "0.68rem",
          color: "rgba(255,255,255,0.4)",
          fontFamily: "var(--font-geist-mono), monospace",
          marginTop: "-0.15rem",
        }}
      >
        {slug
          ? valid
            ? normalized
            : "lowercase a-z 0-9 -, 2–32 chars"
          : "lowercase a-z 0-9 -, 2–32 chars"}
      </p>
    </form>
  );
}
