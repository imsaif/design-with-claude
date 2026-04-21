"use client";
import { useEffect, useMemo, useState } from "react";
import { SystemCanvas } from "./SystemCanvas";
import { StatusSidebar } from "./StatusSidebar";

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

export function CompanionView({ token, project }: { token: string; project: string }) {
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPollAt, setLastPollAt] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const params = new URLSearchParams({ token, project, limit: "100" });
        const res = await fetch(`/api/events/recent?${params.toString()}`, {
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
  }, [token, project]);

  const toolEvents = useMemo(
    () => events.filter((e) => e.toolName !== "__mcp.connected__"),
    [events],
  );
  const isConnected =
    Boolean(profile?.connected) || events.some((e) => e.toolName === "__mcp.connected__");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 320px",
        gap: "2rem",
        alignItems: "start",
      }}
      className="dwic-companion-grid"
    >
      <div style={{ minWidth: 0 }}>
        <SystemCanvas events={toolEvents} onboarding={profile?.onboarding} />
      </div>
      <StatusSidebar
        token={token}
        project={project}
        isConnected={isConnected}
        profile={profile}
        error={error}
        lastPollAt={lastPollAt}
        events={events}
      />
      <style>{`
        @media (max-width: 960px) {
          .dwic-companion-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
