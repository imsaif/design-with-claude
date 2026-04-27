"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "loading" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailGate() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus("error");
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/get-started/mint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: trimmed, website_url: "" }),
      });
      const data = (await res.json()) as { ok: boolean; token?: string; reason?: string };
      if (!res.ok || !data.ok || !data.token) {
        setStatus("error");
        setErrorMsg(
          data.reason === "invalid_email"
            ? "That email doesn't look right."
            : "Something went wrong. Try again?",
        );
        return;
      }
      router.push(`/get-started?token=${data.token}&project=default`);
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Try again?");
    }
  }

  return (
    <form onSubmit={onSubmit} className="email-gate">
      {/* Honeypot — visually hidden, bots fill it */}
      <input
        type="text"
        aria-hidden="true"
        aria-label="Leave this field blank"
        autoComplete="off"
        tabIndex={-1}
        name="website_url"
        value=""
        onChange={() => {}}
        style={{
          position: "absolute",
          left: "-9999px",
          opacity: 0,
          height: 0,
          width: 0,
          pointerEvents: "none",
        }}
      />

      <div className="email-gate-row">
        <input
          type="email"
          aria-label="Email address"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="you@somewhere.com"
          disabled={status === "loading"}
          className="email-gate-input"
        />
        <button
          type="submit"
          className="email-gate-submit"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Setting up…" : "Get my token"}
        </button>
      </div>

      {status === "error" && errorMsg ? (
        <p className="email-gate-error" role="alert">
          {errorMsg}
        </p>
      ) : null}
    </form>
  );
}
