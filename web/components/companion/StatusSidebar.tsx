"use client";
import Link from "next/link";

interface StoredEvent {
  id: string;
  receivedAt: string;
  toolName: string;
  timestamp: string;
}

interface ProfileSummary {
  status: "free" | "paid" | "cancelled";
  commandCount: number;
  connected: boolean;
}

interface Props {
  token: string;
  isConnected: boolean;
  profile: ProfileSummary | null;
  error: string | null;
  lastPollAt: number | null;
  events: StoredEvent[];
}

const CARD: React.CSSProperties = {
  background: "#0a0a0b",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: "1rem 1.1rem",
};

export function StatusSidebar({
  token,
  isConnected,
  profile,
  error,
  lastPollAt,
  events,
}: Props) {
  const freshSeconds = lastPollAt ? Math.round((Date.now() - lastPollAt) / 1000) : null;
  const count = profile?.commandCount ?? 0;
  const status = profile?.status ?? "free";
  const remaining = status === "free" ? Math.max(0, 10 - count) : null;
  const gateBlocked = status === "free" && count >= 10;

  const recent = [...events].reverse().slice(0, 10);

  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
        position: "sticky",
        top: "1.5rem",
        alignSelf: "start",
      }}
    >
      {/* Connection */}
      <section style={CARD}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: isConnected ? "#c8f07a" : "rgba(255,255,255,0.3)",
              boxShadow: isConnected ? "0 0 10px rgba(200,240,122,0.6)" : "none",
            }}
          />
          <span style={{ fontSize: "0.88rem", color: "#fff", fontWeight: 500 }}>
            {isConnected ? "Connected" : "Waiting for install"}
          </span>
        </div>
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: 0 }}>
          {isConnected
            ? freshSeconds !== null
              ? `Refreshed ${freshSeconds}s ago · polls every 2.5s`
              : "Live"
            : "Run the install command and this will flip lime."}
        </p>
        {!isConnected ? (
          <Link
            href={`/install?token=${token}`}
            style={{
              marginTop: "0.75rem",
              display: "inline-block",
              color: "#c8f07a",
              fontSize: "0.78rem",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Show install command →
          </Link>
        ) : null}
        {error ? (
          <p style={{ fontSize: "0.72rem", color: "#ff8080", marginTop: "0.5rem" }}>{error}</p>
        ) : null}
      </section>

      {/* Plan + free-tier counter */}
      <section style={CARD}>
        <div
          style={{
            fontSize: "0.68rem",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.45)",
            marginBottom: "0.6rem",
          }}
        >
          Plan
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "1rem", color: "#fff", fontWeight: 600, textTransform: "capitalize" }}>
            {status}
          </span>
          {status === "free" ? (
            <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-geist-mono)" }}>
              {count}/10
            </span>
          ) : null}
        </div>

        {status === "free" ? (
          <div
            style={{
              height: 4,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 999,
              overflow: "hidden",
              marginBottom: "0.75rem",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, (count / 10) * 100)}%`,
                background: gateBlocked ? "#ffb450" : "#c8f07a",
                transition: "width 240ms ease",
              }}
            />
          </div>
        ) : null}

        {gateBlocked ? (
          <>
            <p style={{ fontSize: "0.78rem", color: "#ffb450", marginBottom: "0.6rem" }}>
              You&apos;ve hit the free tier. Upgrade to keep building.
            </p>
            <Link
              href={`/upgrade?token=${token}`}
              style={{
                display: "inline-block",
                background: "#c8f07a",
                color: "#0F0F10",
                padding: "0.45rem 0.85rem",
                borderRadius: 6,
                textDecoration: "none",
                fontSize: "0.82rem",
                fontWeight: 600,
              }}
            >
              Upgrade →
            </Link>
          </>
        ) : (
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", marginBottom: 0 }}>
            {remaining !== null
              ? `${remaining} free commands remaining. Profile saves across sessions.`
              : "Unlimited — your profile keeps compounding."}
          </p>
        )}
      </section>

      {/* History */}
      <section style={CARD}>
        <div
          style={{
            fontSize: "0.68rem",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.45)",
            marginBottom: "0.65rem",
          }}
        >
          History · {events.length}
        </div>
        {recent.length === 0 ? (
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>
            Nothing yet. Each tool call shows up here.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.35rem" }}>
            {recent.map((e) => (
              <li
                key={e.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.72)",
                  padding: "0.25rem 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.toolName}
                </span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.38)",
                    fontFamily: "var(--font-geist-mono)",
                    flexShrink: 0,
                  }}
                >
                  {new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
