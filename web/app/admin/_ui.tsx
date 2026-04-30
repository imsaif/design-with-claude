"use client";

import { useState } from "react";
import s from "./admin.module.css";

/* Five primitives + a few helpers. Anything page-specific stays inline. */

export const tokenSuffix = (h: string) => (h ? h.slice(-8) : "—");

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });

export const fmtRelative = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return fmtDate(iso);
};

/* ---------- Page header ---------- */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className={s.header}>
      <div>
        <p className={s.eyebrow}>{eyebrow}</p>
        <h1 className={s.title}>{title}</h1>
        {description && <p className={s.sub}>{description}</p>}
      </div>
      {actions && <div className={s.headerActions}>{actions}</div>}
    </div>
  );
}

/* ---------- Stat band ---------- */

type StatTone = "default" | "accent" | "success" | "muted";

export function StatBand({
  items,
}: {
  items: { label: string; value: number | string; hint?: string; tone?: StatTone }[];
}) {
  return (
    <div className={s.statband}>
      {items.map((it) => (
        <div key={it.label} className={s.stat}>
          <p className={s.statLabel}>{it.label}</p>
          <p
            className={`${s.statValue} ${
              it.tone === "accent"
                ? s.statValueAccent
                : it.tone === "success"
                ? s.statValueSuccess
                : it.tone === "muted"
                ? s.statValueMuted
                : ""
            }`}
          >
            {typeof it.value === "number" ? it.value.toLocaleString() : it.value}
          </p>
          {it.hint && <p className={s.statHint}>{it.hint}</p>}
        </div>
      ))}
    </div>
  );
}

/* ---------- Pill ---------- */

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "mono";
}) {
  const tones: Record<string, string> = {
    neutral: s.pillNeutral,
    success: s.pillSuccess,
    warning: s.pillWarning,
    danger: s.pillDanger,
    mono: s.pillMono,
  };
  return <span className={`${s.pill} ${tones[tone]}`}>{children}</span>;
}

/* ---------- Auth gate ---------- */

export function AuthGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onAuthenticated();
        setPassword("");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Invalid password");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={s.authShell}>
      <div className={s.authBox}>
        <div className={s.authIntro}>
          <span className={s.authMark} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M12 2 4 6v6c0 5 3.5 9.4 8 10 4.5-.6 8-5 8-10V6l-8-4Z" />
            </svg>
          </span>
          <div>
            <p className={s.authTitle}>dwic admin</p>
            <p className={s.authSub}>Authentication required</p>
          </div>
        </div>
        <form className={s.authCard} onSubmit={handleSubmit}>
          <label htmlFor="admin-password" className={s.authLabel}>
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            className={s.authInput}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            placeholder="••••••••"
          />
          {error && <p className={s.authError}>{error}</p>}
          <button
            type="submit"
            className={s.authSubmit}
            disabled={submitting || password.length === 0}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------- Table shell ---------- */

export function TableShell({
  columns,
  loading,
  empty,
  emptyHint,
  rows,
  pagination,
}: {
  columns: { label: string; align?: "left" | "right" }[];
  loading: boolean;
  empty: string;
  emptyHint?: string;
  rows: React.ReactNode;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    onPage: (p: number) => void;
  };
}) {
  const isEmpty =
    !loading &&
    (!rows || (Array.isArray(rows) && rows.length === 0));

  return (
    <div className={s.tableCard}>
      {loading ? (
        <div className={s.loading}>
          <span className={s.spinner} />
          <span className={s.loadingText}>Loading…</span>
        </div>
      ) : isEmpty ? (
        <div className={s.empty}>
          <p className={s.emptyTitle}>{empty}</p>
          {emptyHint && <p className={s.emptyHint}>{emptyHint}</p>}
        </div>
      ) : (
        <table className={s.table}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.label} className={`${s.th} ${c.align === "right" ? s.thRight : ""}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className={s.pagination}>
          <span>
            <span className={s.tnum}>{(pagination.page - 1) * pagination.limit + 1}</span>
            <span style={{ margin: "0 4px" }}>–</span>
            <span className={s.tnum}>
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>
            <span style={{ margin: "0 6px", color: "#CBD5E1" }}>/</span>
            <span className={s.tnum}>{pagination.total.toLocaleString()}</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <button
              className={s.pageBtn}
              onClick={() => pagination.onPage(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              ← Prev
            </button>
            <span className={s.pageMeta}>
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              className={s.pageBtn}
              onClick={() => pagination.onPage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next →
            </button>
          </span>
        </div>
      )}
    </div>
  );
}

/* ---------- Error banner ---------- */

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className={s.banner} role="alert">
      <span>⚠ {message}</span>
      <button className={s.bannerClose} onClick={onDismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

export { s as styles };
