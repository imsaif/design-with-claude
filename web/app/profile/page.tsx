import Link from "next/link";
import { Shell } from "@/components/companion/Shell";
import { CopyButton } from "@/components/companion/CopyButton";
import { getProfile } from "@/lib/dwc/store";
import { isTokenShapeValid } from "@/lib/dwc/tokens";

interface ProfilePageProps {
  searchParams: Promise<{ token?: string }>;
}

export const metadata = {
  title: "Your profile — designwithclaude",
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const { token = "" } = await searchParams;

  if (!isTokenShapeValid(token)) {
    return (
      <Shell step={2}>
        <div style={{ maxWidth: 520, marginTop: "3rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>No token in the URL</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem" }}>
            The profile page needs a token. Head back to the start and run through the 5 questions.
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
            Start over →
          </Link>
        </div>
      </Shell>
    );
  }

  const profile = await getProfile(token);
  if (!profile || !profile.onboarding || !profile.claudeMd) {
    return (
      <Shell step={2}>
        <div style={{ maxWidth: 520, marginTop: "3rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>Profile not found</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem" }}>
            This token doesn&apos;t match a complete profile. Profiles live in memory during the
            alpha — if the server restarted, your profile was lost. Start fresh.
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
            Start over →
          </Link>
        </div>
      </Shell>
    );
  }

  const { onboarding, claudeMd } = profile;

  return (
    <Shell step={2} token={token}>
      <header style={{ marginBottom: "2rem" }}>
        <p
          style={{
            textTransform: "uppercase",
            fontSize: "0.72rem",
            letterSpacing: "0.12em",
            color: "#c8f07a",
            marginBottom: "0.75rem",
          }}
        >
          Step 2 of 4
        </p>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 600, lineHeight: 1.15, marginBottom: "0.75rem" }}>
          This is what Claude will know about you
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "1.05rem", maxWidth: 640 }}>
          Your CLAUDE.md file — generated from your 5 answers. Claude Code reads this at the start
          of every session so you don&apos;t have to re-explain the project.
        </p>
      </header>

      <section
        style={{
          background: "rgba(200,240,122,0.06)",
          border: "1px solid rgba(200,240,122,0.2)",
          borderRadius: 10,
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "0.75rem",
          fontSize: "0.88rem",
        }}
      >
        <Meta label="Building" value={onboarding.product_type} />
        <Meta label="Stack" value={onboarding.tech_stack.join(", ")} />
        <Meta label="Design system" value={onboarding.design_system} />
        <Meta label="Experience" value={onboarding.experience_level} />
        <Meta label="Tone" value={onboarding.tone_preference} />
      </section>

      <section
        style={{
          background: "#0a0a0b",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          marginBottom: "2rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "0.75rem 1.25rem",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.55)" }}>CLAUDE.md</span>
          <CopyButton text={claudeMd} label="Copy CLAUDE.md" compact />
        </div>
        <pre
          style={{
            margin: 0,
            padding: "1.25rem 1.5rem",
            fontFamily: "var(--font-geist-mono), SF Mono, monospace",
            fontSize: "0.82rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.88)",
            whiteSpace: "pre-wrap",
            overflowX: "auto",
          }}
        >
          {claudeMd}
        </pre>
      </section>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <Link
          href={`/install?token=${token}`}
          style={{
            background: "#c8f07a",
            color: "#0F0F10",
            textDecoration: "none",
            fontWeight: 600,
            padding: "0.75rem 1.25rem",
            borderRadius: 8,
          }}
        >
          Looks good — install →
        </Link>
        <Link
          href="/start"
          style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none", fontSize: "0.9rem" }}
        >
          ← Change my answers
        </Link>
      </div>

      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", marginTop: "2.5rem" }}>
        Bookmark this URL to come back — your token is <code>{token}</code>.
      </p>
    </Shell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.15rem" }}>
        {label}
      </div>
      <div style={{ color: "#fff", fontWeight: 500 }}>{value}</div>
    </div>
  );
}
