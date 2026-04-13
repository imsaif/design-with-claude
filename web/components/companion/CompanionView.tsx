"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { RenderOutput } from "./renderers";
import type { ToolOutputPayload } from "@/lib/dwc/types";

interface StoredEvent {
  id: string;
  receivedAt: string;
  token: string;
  toolName: string;
  input: unknown;
  output: unknown;
  timestamp: string;
}

interface ProfileSummary {
  status: "free" | "paid" | "cancelled";
  commandCount: number;
  connected: boolean;
}

interface RecentResponse {
  ok: boolean;
  profile?: ProfileSummary | null;
  events?: StoredEvent[];
}

const VALID_TYPES = ["palette", "type-scale", "spacing", "component-spec", "copy", "markdown"] as const;
type ValidType = (typeof VALID_TYPES)[number];

function isToolOutput(o: unknown): o is ToolOutputPayload {
  if (!o || typeof o !== "object") return false;
  const type = (o as { type?: unknown }).type;
  return typeof type === "string" && VALID_TYPES.includes(type as ValidType);
}

const POLL_MS = 2500;

export function CompanionView({ token }: { token: string }) {
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPollAt, setLastPollAt] = useState<number | null>(null);
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const res = await fetch(`/api/events/recent?token=${token}&limit=100`, {
          cache: "no-store",
        });
        const body = (await res.json()) as RecentResponse;
        if (!active) return;
        if (body.ok) {
          setProfile(body.profile ?? null);
          const next = body.events ?? [];
          setEvents(next);
          for (const e of next) seenIds.current.add(e.id);
          setError(null);
          setLastPollAt(Date.now());
        } else {
          setError("profile not found");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : String(err));
      }
    }
    poll();
    const id = window.setInterval(poll, POLL_MS);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [token]);

  const toolEvents = useMemo(
    () => events.filter((e) => e.toolName !== "__mcp.connected__"),
    [events],
  );
  const latest = toolEvents[toolEvents.length - 1];
  const isConnected = Boolean(profile?.connected) || events.some((e) => e.toolName === "__mcp.connected__");
  const gateBlocked = profile && profile.status === "free" && profile.commandCount >= 10;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: "2rem" }}>
      <section>
        <ConnectionHeader
          isConnected={isConnected}
          profile={profile}
          error={error}
          lastPollAt={lastPollAt}
        />

        {gateBlocked ? (
          <UpgradeBanner token={token} count={profile!.commandCount} />
        ) : null}

        {!isConnected && toolEvents.length === 0 ? (
          <WaitingForInstall token={token} />
        ) : toolEvents.length === 0 ? (
          <ReadyToBuild />
        ) : (
          <EventFeed events={toolEvents} latestId={latest?.id} />
        )}
      </section>
      <aside>
        <BuiltSoFar events={toolEvents} />
      </aside>
    </div>
  );
}

function ConnectionHeader({
  isConnected,
  profile,
  error,
  lastPollAt,
}: {
  isConnected: boolean;
  profile: ProfileSummary | null;
  error: string | null;
  lastPollAt: number | null;
}) {
  const freshSeconds = lastPollAt ? Math.round((Date.now() - lastPollAt) / 1000) : null;
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1.5rem",
        padding: "0.9rem 1.1rem",
        background: "#0a0a0b",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: isConnected ? "#c8f07a" : "rgba(255,255,255,0.3)",
            boxShadow: isConnected ? "0 0 10px rgba(200,240,122,0.6)" : "none",
          }}
        />
        <span style={{ fontSize: "0.9rem", color: "#fff", fontWeight: 500 }}>
          {isConnected ? "Connected to Claude Code" : "Waiting for install…"}
        </span>
      </div>
      {profile ? (
        <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
          {profile.status} · {profile.commandCount}
          {profile.status === "free" ? "/10" : ""} commands
          {freshSeconds !== null ? ` · refreshed ${freshSeconds}s ago` : ""}
        </span>
      ) : error ? (
        <span style={{ fontSize: "0.78rem", color: "#ff8080" }}>{error}</span>
      ) : null}
    </header>
  );
}

function WaitingForInstall({ token }: { token: string }) {
  return (
    <div
      style={{
        background: "#0a0a0b",
        border: "1px dashed rgba(255,255,255,0.12)",
        borderRadius: 12,
        padding: "2.5rem 2rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "3px solid rgba(200,240,122,0.2)",
          borderTopColor: "#c8f07a",
          margin: "0 auto 1.25rem",
          animation: "dwc-spin 1s linear infinite",
        }}
      />
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        Waiting for your install
      </h2>
      <p style={{ color: "rgba(255,255,255,0.55)", marginBottom: "1.25rem", maxWidth: 420, margin: "0 auto 1.25rem" }}>
        Run the setup command in your terminal. The moment it pings home, this page flips to live.
      </p>
      <Link
        href={`/install?token=${token}`}
        style={{
          color: "#c8f07a",
          textDecoration: "none",
          fontSize: "0.88rem",
          fontWeight: 500,
        }}
      >
        Show me the install command →
      </Link>
      <style>{`@keyframes dwc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ReadyToBuild() {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, rgba(200,240,122,0.1) 0%, rgba(200,240,122,0.02) 100%)",
        border: "1px solid rgba(200,240,122,0.25)",
        borderRadius: 12,
        padding: "2rem",
      }}
    >
      <p
        style={{
          fontSize: "0.72rem",
          color: "#c8f07a",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: "0.75rem",
        }}
      >
        Ready to build
      </p>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "0.75rem" }}>
        Your first command
      </h2>
      <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "1.25rem" }}>
        In Claude Code, ask for something like:
      </p>
      <code
        style={{
          display: "block",
          padding: "0.9rem 1rem",
          background: "#0F0F10",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          fontFamily: "var(--font-geist-mono)",
          fontSize: "0.9rem",
          color: "rgba(255,255,255,0.9)",
        }}
      >
        Use the color-specialist tool from designwithclaude. Brief: calm productivity app for indie designers.
      </code>
      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", marginTop: "1rem" }}>
        Results render here in real time.
      </p>
    </div>
  );
}

function UpgradeBanner({ token, count }: { token: string; count: number }) {
  return (
    <div
      style={{
        background: "rgba(255,180,80,0.08)",
        border: "1px solid rgba(255,180,80,0.24)",
        padding: "1rem 1.25rem",
        borderRadius: 10,
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <div style={{ color: "#ffb450", fontSize: "0.9rem" }}>
        You&apos;ve used {count}/10 free commands. Upgrade to keep your profile and continue.
      </div>
      <Link
        href={`/upgrade?token=${token}`}
        style={{
          background: "#c8f07a",
          color: "#0F0F10",
          padding: "0.5rem 1rem",
          borderRadius: 6,
          textDecoration: "none",
          fontWeight: 600,
          fontSize: "0.85rem",
        }}
      >
        Upgrade →
      </Link>
    </div>
  );
}

function EventFeed({ events, latestId }: { events: StoredEvent[]; latestId: string | undefined }) {
  const reversed = [...events].reverse();
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {reversed.map((e) => (
        <EventCard key={e.id} event={e} isLatest={e.id === latestId} />
      ))}
    </div>
  );
}

function EventCard({ event, isLatest }: { event: StoredEvent; isLatest: boolean }) {
  const output = event.output;
  const renderable = isToolOutput(output);

  return (
    <article
      style={{
        background: "#0a0a0b",
        border: isLatest ? "1px solid rgba(200,240,122,0.45)" : "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "1.25rem 1.5rem",
        boxShadow: isLatest ? "0 0 0 3px rgba(200,240,122,0.08)" : "none",
        transition: "box-shadow 200ms ease",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
          fontSize: "0.78rem",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              padding: "0.15rem 0.55rem",
              borderRadius: 999,
              background: "rgba(200,240,122,0.1)",
              color: "#c8f07a",
              fontSize: "0.7rem",
              fontWeight: 500,
            }}
          >
            {event.toolName}
          </span>
          {renderable ? (
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>
              {(output as ToolOutputPayload).type}
            </span>
          ) : null}
        </div>
        <time style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.72rem" }}>
          {new Date(event.timestamp).toLocaleTimeString()}
        </time>
      </header>
      {renderable ? (
        <RenderOutput output={output as ToolOutputPayload} />
      ) : (
        <pre style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", overflowX: "auto" }}>
          {JSON.stringify(output, null, 2)}
        </pre>
      )}
    </article>
  );
}

function BuiltSoFar({ events }: { events: StoredEvent[] }) {
  const byType = new Map<string, number>();
  for (const e of events) {
    if (!isToolOutput(e.output)) continue;
    const t = (e.output as ToolOutputPayload).type;
    byType.set(t, (byType.get(t) ?? 0) + 1);
  }

  return (
    <div
      style={{
        position: "sticky",
        top: "1.5rem",
        background: "#0a0a0b",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "1.25rem",
      }}
    >
      <h3
        style={{
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "1rem",
        }}
      >
        Built so far
      </h3>
      {events.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem" }}>
          Nothing yet. Run a command in Claude Code and it&apos;ll show up here.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.4rem", fontSize: "0.85rem" }}>
          {[...byType.entries()].map(([type, count]) => (
            <li
              key={type}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.35rem 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.75)" }}>{type}</span>
              <span style={{ color: "#c8f07a", fontFamily: "var(--font-geist-mono)" }}>×{count}</span>
            </li>
          ))}
          <li style={{ paddingTop: "0.5rem", fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>
            {events.length} total event{events.length === 1 ? "" : "s"}
          </li>
        </ul>
      )}
    </div>
  );
}
