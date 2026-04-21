"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "dwic.lastToken";
const TOKEN_PATTERN = /^imr_[A-Za-z0-9_-]{8,}$/;

/**
 * Client-side "welcome back" nudge. If the designer has previously completed
 * onboarding in this browser (token stashed in localStorage by StartWizard on
 * success), but they've landed here without a token in the URL, offer them a
 * link to their account dashboard so they don't accidentally start over and
 * end up stuck.
 *
 * Hides itself entirely on the server and on first render to avoid layout
 * flicker.
 */
export function WelcomeBackBanner() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && TOKEN_PATTERN.test(stored)) setToken(stored);
    } catch {
      /* localStorage disabled — fail silently */
    }
  }, []);

  if (!token) return null;

  const shortToken = `${token.slice(0, 8)}…`;

  return (
    <div
      style={{
        background: "rgba(200,240,122,0.08)",
        border: "1px solid rgba(200,240,122,0.25)",
        padding: "0.9rem 1.1rem",
        borderRadius: 10,
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "0.68rem",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#c8f07a",
            marginBottom: "0.25rem",
          }}
        >
          Welcome back
        </div>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.88rem" }}>
          We remember your token (<code>{shortToken}</code>) on this browser. Filling this wizard
          again creates a <strong>new project</strong>, not a new account.
        </p>
      </div>
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
        <Link
          href={`/account?token=${token}`}
          style={{
            background: "#c8f07a",
            color: "#0F0F10",
            padding: "0.5rem 0.9rem",
            borderRadius: 6,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.82rem",
          }}
        >
          My projects →
        </Link>
      </div>
    </div>
  );
}

/** Call this from the wizard on successful onboarding to enable the banner next time. */
export function rememberToken(token: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, token);
  } catch {
    /* ignore */
  }
}
