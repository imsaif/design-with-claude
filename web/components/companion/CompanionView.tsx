"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SystemCanvas } from "./SystemCanvas";
import { HistoryPanel } from "./HistoryPanel";

interface StoredEvent {
  id: string;
  receivedAt: string;
  token: string;
  toolName: string;
  input: unknown;
  output: unknown;
  timestamp: string;
}

interface OnboardingHint {
  product_type: string;
  product_description: string;
  tech_stack: string[];
  design_system: string;
  experience_level: string;
  tone_preference: string;
}

interface ProfileSummary {
  status: "free" | "paid" | "cancelled";
  commandCount: number;
  connected: boolean;
  onboarding?: OnboardingHint;
}

interface RecentResponse {
  ok: boolean;
  profile?: ProfileSummary | null;
  events?: StoredEvent[];
}

const POLL_MS = 2500;

export function CompanionView({ token }: { token: string }) {
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPollAt, setLastPollAt] = useState<number | null>(null);

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
          setEvents(body.events ?? []);
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
  const isConnected =
    Boolean(profile?.connected) || events.some((e) => e.toolName === "__mcp.connected__");
  const gateBlocked = profile && profile.status === "free" && profile.commandCount >= 10;

  return (
    <div>
      <ConnectionHeader
        isConnected={isConnected}
        profile={profile}
        error={error}
        lastPollAt={lastPollAt}
      />

      {gateBlocked ? <UpgradeBanner token={token} count={profile!.commandCount} /> : null}

      {!isConnected && toolEvents.length === 0 ? <WaitingForInstall token={token} /> : null}

      <SystemCanvas events={toolEvents} onboarding={profile?.onboarding} />

      <HistoryPanel events={events} />
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
        marginBottom: "1.25rem",
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
        padding: "1.5rem",
        textAlign: "center",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "2px solid rgba(200,240,122,0.2)",
          borderTopColor: "#c8f07a",
          margin: "0 auto 0.85rem",
          animation: "dwc-spin 1s linear infinite",
        }}
      />
      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.92rem", marginBottom: "0.5rem" }}>
        Waiting for Claude Code to connect — run the install command in your terminal and we&apos;ll
        flip live.
      </p>
      <Link
        href={`/install?token=${token}`}
        style={{ color: "#c8f07a", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500 }}
      >
        Show me the install command →
      </Link>
      <style>{`@keyframes dwc-spin { to { transform: rotate(360deg); } }`}</style>
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
        marginBottom: "1.25rem",
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
