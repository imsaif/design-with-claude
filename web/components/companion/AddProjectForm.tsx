"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,31}$/;

export function AddProjectForm({ token }: { token: string }) {
  const router = useRouter();
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

  return (
    <form
      onSubmit={submit}
      style={{
        display: "flex",
        gap: "0.5rem",
        flexWrap: "wrap",
        alignItems: "flex-start",
      }}
    >
      <div style={{ flex: 1, minWidth: 220 }}>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="e.g. thriya or acme-landing"
          autoComplete="off"
          spellCheck={false}
          style={{
            width: "100%",
            background: "#0F0F10",
            border: `1px solid ${valid ? "#c8f07a" : slug ? "rgba(255,180,80,0.4)" : "rgba(255,255,255,0.14)"}`,
            borderRadius: 8,
            padding: "0.7rem 0.9rem",
            color: "#fff",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: "0.9rem",
            outline: "none",
          }}
        />
        <p
          style={{
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.45)",
            marginTop: "0.35rem",
            fontFamily: "var(--font-geist-mono), monospace",
          }}
        >
          {slug
            ? valid
              ? `→ /companion?token=…&project=${normalized}`
              : `"${normalized || slug}" — lowercase letters, digits, hyphens only (2–32 chars)`
            : "Lowercase letters, digits, hyphens. 2–32 chars."}
        </p>
      </div>
      <button
        type="submit"
        disabled={!valid || busy}
        style={{
          background: valid && !busy ? "#c8f07a" : "rgba(255,255,255,0.1)",
          color: valid && !busy ? "#0F0F10" : "rgba(255,255,255,0.4)",
          border: "none",
          borderRadius: 8,
          padding: "0.72rem 1.1rem",
          fontWeight: 600,
          cursor: valid && !busy ? "pointer" : "not-allowed",
          fontFamily: "inherit",
          fontSize: "0.88rem",
        }}
      >
        {busy ? "Opening…" : "Add project →"}
      </button>
    </form>
  );
}
