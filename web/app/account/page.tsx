import Link from "next/link";
import { Shell } from "@/components/companion/Shell";
import { AddProjectTile } from "@/components/companion/AddProjectTile";
import { getAccountState } from "@/lib/dwc/store";
import { isTokenShapeValid } from "@/lib/dwc/tokens";

interface AccountPageProps {
  searchParams: Promise<{ token?: string }>;
}

export const metadata = {
  title: "My projects — designwithclaude",
};

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const { token = "" } = await searchParams;
  const hasToken = isTokenShapeValid(token);

  if (!hasToken) {
    return (
      <Shell>
        <div style={{ maxWidth: 520, marginTop: "3rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>Missing token</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem" }}>
            Your account URL should look like <code>/account?token=imr_xxx</code>. Start onboarding
            to get a token.
          </p>
          <Link
            href="/start"
            style={{
              background: "#c8f07a",
              color: "#0F0F10",
              padding: "0.7rem 1.2rem",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Start →
          </Link>
        </div>
      </Shell>
    );
  }

  const account = await getAccountState(token);
  const count = account.commandCount;
  const status = account.status;
  const gateBlocked = status === "free" && count >= 10;

  return (
    <Shell token={token} wide>
      <header style={{ marginBottom: "2rem" }}>
        <p
          style={{
            textTransform: "uppercase",
            fontSize: "0.72rem",
            letterSpacing: "0.12em",
            color: "#c8f07a",
            marginBottom: "0.5rem",
          }}
        >
          Account
        </p>
        <h1 style={{ fontSize: "2rem", fontWeight: 600, lineHeight: 1.2, marginBottom: "0.5rem" }}>
          Your projects
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem" }}>
          Each project has its own design system. Install dwc per-project so Claude Code uses the
          right one.
        </p>
      </header>

      {gateBlocked ? (
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
            color: "#ffb450",
            fontSize: "0.9rem",
          }}
        >
          <span>Free tier exhausted across all your projects. Upgrade to keep building.</span>
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
      ) : null}

      <section style={{ marginBottom: "3rem" }}>
        <h2
          style={{
            fontSize: "0.72rem",
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            color: "rgba(255,255,255,0.55)",
            fontWeight: 600,
            marginBottom: "0.85rem",
          }}
        >
          Projects ({account.projects.length})
        </h2>
        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          }}
        >
          {account.projects.map((p) => (
            <ProjectCard key={p.slug} token={token} project={p} />
          ))}
          <AddProjectTile token={token} />
        </div>
      </section>

      {/* Account summary — demoted to a compact bar at the bottom of the page
          since most of the time designers care about their projects, not the
          account stats. */}
      <section
        aria-label="Account summary"
        style={{
          background: "rgba(255,255,255,0.015)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10,
          padding: "0.75rem 1.1rem",
          display: "flex",
          gap: "1.5rem",
          flexWrap: "wrap",
          alignItems: "center",
          fontSize: "0.78rem",
          color: "rgba(255,255,255,0.55)",
        }}
      >
        <SummaryItem label="Plan" value={status} capitalize />
        <SummaryItem
          label="Commands"
          value={status === "free" ? `${count}/10` : `${count} · unlimited`}
        />
        <SummaryItem label="Projects" value={String(account.projects.length)} />
        <SummaryItem label="Last active" value={formatRelative(account.lastSeenAt)} />
        <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", fontFamily: "var(--font-geist-mono)" }}>
          {token.slice(0, 8)}…
        </span>
      </section>
    </Shell>
  );
}

function SummaryItem({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: "0.4rem", alignItems: "baseline" }}>
      <span
        style={{
          color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontSize: "0.68rem",
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: "rgba(255,255,255,0.8)",
          fontWeight: 500,
          textTransform: capitalize ? "capitalize" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ProjectCard({
  token,
  project,
}: {
  token: string;
  project: {
    slug: string;
    displayName: string | null;
    commandCount: number;
    connected: boolean;
    createdAt: string;
    lastSeenAt: string;
  };
}) {
  return (
    <article
      style={{
        background: "#0a0a0b",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "1rem 1.1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        minHeight: 128,
      }}
    >
      <header style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span
          aria-label={project.connected ? "Connected" : "Not connected"}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: project.connected ? "#c8f07a" : "rgba(255,255,255,0.25)",
            boxShadow: project.connected ? "0 0 8px rgba(200,240,122,0.6)" : "none",
          }}
        />
        <h3
          style={{
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "#fff",
            fontFamily: "var(--font-geist-mono), monospace",
            flex: 1,
          }}
        >
          {project.slug}
        </h3>
        <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-geist-mono)" }}>
          {project.commandCount}
        </span>
      </header>
      {project.displayName ? (
        <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}>
          {project.displayName}
        </p>
      ) : null}
      <div
        style={{
          display: "flex",
          gap: "0.6rem",
          fontSize: "0.78rem",
          alignItems: "center",
          marginTop: "auto",
        }}
      >
        <Link
          href={`/companion?token=${token}&project=${project.slug}`}
          style={{
            color: "#c8f07a",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Open companion →
        </Link>
        <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
        <Link
          href={`/install?token=${token}&project=${project.slug}`}
          style={{
            color: "rgba(255,255,255,0.55)",
            textDecoration: "none",
          }}
        >
          Install command
        </Link>
      </div>
    </article>
  );
}
