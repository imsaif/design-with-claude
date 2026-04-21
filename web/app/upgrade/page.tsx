import Link from "next/link";
import { Shell } from "@/components/companion/Shell";
import { getProfile } from "@/lib/dwic/store";
import { isTokenShapeValid } from "@/lib/dwic/tokens";

interface UpgradePageProps {
  searchParams: Promise<{ token?: string; project?: string }>;
}

export const metadata = {
  title: "Upgrade — designwithclaude",
};

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
  const { token = "", project } = await searchParams;
  const hasToken = isTokenShapeValid(token);
  const profile = hasToken ? await getProfile(token, project) : undefined;

  const summary = profile?.onboarding
    ? `${profile.onboarding.product_type} · ${profile.onboarding.tech_stack.join(", ")}`
    : null;

  return (
    <Shell step={5} token={hasToken ? token : undefined}>
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
          You&apos;ve hit the free tier
        </p>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 600, lineHeight: 1.15, marginBottom: "0.75rem" }}>
          Keep what you&apos;ve built.
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.05rem", maxWidth: 620 }}>
          Your designer profile, color palette, type scale, and spacing tokens are all saved.
          Upgrade to pick up exactly where you left off.
        </p>
      </header>

      {summary ? (
        <section
          style={{
            background: "rgba(200,240,122,0.06)",
            border: "1px solid rgba(200,240,122,0.2)",
            borderRadius: 10,
            padding: "0.9rem 1.25rem",
            marginBottom: "2rem",
            fontSize: "0.88rem",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.5)", marginRight: "0.5rem" }}>Saved profile:</span>
          {summary}
        </section>
      ) : null}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        <PlanCard
          badge="Current"
          title="Free"
          price="—"
          perks={["10 commands lifetime", "Profile saved", "Live companion", "Full command library"]}
          cta={null}
          subdued
        />
        <PlanCard
          badge="Recommended"
          title="Subscriber"
          price="$12/mo"
          perks={[
            "Unlimited commands",
            "Your profile compounds over time",
            "Priority on new agents + missions",
            "Cancel anytime — profile freezes, doesn't delete",
          ]}
          cta={{ href: "https://designwithclaude.com/checkout", label: "Upgrade (coming soon)" }}
        />
      </section>

      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
        Payments are wired up in the next phase — this page is a placeholder while we integrate Dodo.
      </p>
      <Link
        href={hasToken ? `/companion?token=${token}` : "/"}
        style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "0.9rem" }}
      >
        ← Back to the companion
      </Link>
    </Shell>
  );
}

function PlanCard({
  badge,
  title,
  price,
  perks,
  cta,
  subdued,
}: {
  badge: string;
  title: string;
  price: string;
  perks: string[];
  cta: { href: string; label: string } | null;
  subdued?: boolean;
}) {
  return (
    <article
      style={{
        background: subdued ? "rgba(255,255,255,0.02)" : "#0a0a0b",
        border: subdued ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(200,240,122,0.3)",
        borderRadius: 12,
        padding: "1.5rem",
      }}
    >
      <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: subdued ? "rgba(255,255,255,0.4)" : "#c8f07a", marginBottom: "0.5rem" }}>
        {badge}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 600 }}>{title}</h2>
        <span style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.85)" }}>{price}</span>
      </div>
      <ul style={{ listStyle: "none", padding: 0, marginBottom: "1rem", display: "grid", gap: "0.5rem" }}>
        {perks.map((p) => (
          <li key={p} style={{ color: "rgba(255,255,255,0.78)", fontSize: "0.88rem", display: "flex", gap: "0.5rem" }}>
            <span style={{ color: subdued ? "rgba(255,255,255,0.4)" : "#c8f07a" }}>✓</span> {p}
          </li>
        ))}
      </ul>
      {cta ? (
        <Link
          href={cta.href}
          style={{
            display: "inline-block",
            background: "#c8f07a",
            color: "#0F0F10",
            padding: "0.65rem 1rem",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          {cta.label}
        </Link>
      ) : null}
    </article>
  );
}
