import Link from "next/link";
import { Shell } from "@/components/companion/Shell";
import { CompanionView } from "@/components/companion/CompanionView";
import { isTokenShapeValid } from "@/lib/dwc/tokens";

interface CompanionPageProps {
  searchParams: Promise<{ token?: string }>;
}

export const metadata = {
  title: "Companion — designwithclaude",
};

export default async function CompanionPage({ searchParams }: CompanionPageProps) {
  const { token = "" } = await searchParams;

  if (!isTokenShapeValid(token)) {
    return (
      <Shell step={4}>
        <div style={{ maxWidth: 520, marginTop: "3rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>Missing token</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem" }}>
            Your companion URL should look like <code>/companion?token=imr_xxx</code>. Start the
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
          Your design system
        </p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 600, lineHeight: 1.2 }}>
          Compounding here as you work.
        </h1>
      </header>
      <CompanionView token={token} />
    </Shell>
  );
}
