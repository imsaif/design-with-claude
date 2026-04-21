import Link from "next/link";
import { Shell } from "@/components/companion/Shell";
import { CompanionView } from "@/components/companion/CompanionView";
import { isTokenShapeValid } from "@/lib/dwic/tokens";
import { isValidSlug } from "@/lib/dwic/projects";

interface CompanionPageProps {
  searchParams: Promise<{ token?: string; project?: string }>;
}

export const metadata = {
  title: "Companion — designwithclaude",
};

export default async function CompanionPage({ searchParams }: CompanionPageProps) {
  const { token = "", project: rawProject } = await searchParams;

  if (!isTokenShapeValid(token)) {
    return (
      <Shell step={4}>
        <div style={{ maxWidth: 520, marginTop: "3rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>Missing token</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem" }}>
            Your companion URL should look like <code>/companion?token=imr_xxx&amp;project=&lt;slug&gt;</code>. Start the
            onboarding to generate one.
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
            Start onboarding →
          </Link>
        </div>
      </Shell>
    );
  }

  // Tolerate alpha.1-style URLs without ?project= by falling back to 'default'.
  // Phase 4-final will flip DWIC_ALLOW_IMPLICIT_PROJECT off and surface an inline
  // "pick a project" prompt here instead of a silent default.
  const project = rawProject && isValidSlug(rawProject) ? rawProject : "default";

  return (
    <Shell step={4} token={token} wide>
      <header style={{ marginBottom: "1.5rem" }}>
        <p
          style={{
            textTransform: "uppercase",
            fontSize: "0.72rem",
            letterSpacing: "0.12em",
            color: "#c8f07a",
            marginBottom: "0.5rem",
          }}
        >
          Your design system · project{" "}
          <code style={{ color: "rgba(255,255,255,0.75)", textTransform: "none", letterSpacing: 0 }}>
            {project}
          </code>
        </p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 600, lineHeight: 1.2 }}>
          Compounding here as you work.
        </h1>
      </header>
      <CompanionView token={token} project={project} />
    </Shell>
  );
}
