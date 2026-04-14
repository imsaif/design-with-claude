import Link from "next/link";
import { Shell } from "@/components/companion/Shell";
import { CopyButton } from "@/components/companion/CopyButton";
import { isTokenShapeValid } from "@/lib/dwc/tokens";

interface InstallPageProps {
  searchParams: Promise<{ token?: string }>;
}

export const metadata = {
  title: "Install designwithclaude",
};

export default async function InstallPage({ searchParams }: InstallPageProps) {
  const { token = "" } = await searchParams;
  const valid = isTokenShapeValid(token);
  const command = valid
    ? `npx designwithclaude setup --token=${token}`
    : `npx designwithclaude setup --token=imr_yourTokenHere`;

  return (
    <Shell step={3} token={valid ? token : undefined}>
      <header style={{ marginBottom: "2.5rem" }}>
        <p
          style={{
            textTransform: "uppercase",
            fontSize: "0.72rem",
            letterSpacing: "0.12em",
            color: "#c8f07a",
            marginBottom: "0.75rem",
          }}
        >
          Step 3 of 4
        </p>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 600, lineHeight: 1.15, marginBottom: "0.75rem" }}>
          Install the MCP server
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "1.05rem", maxWidth: 600 }}>
          One command, about 20 seconds, no prompts. We use your token to register
          the server with Claude Code and ping us when it&apos;s live.
        </p>
      </header>

      {!valid ? (
        <div
          style={{
            background: "rgba(255, 180, 80, 0.08)",
            border: "1px solid rgba(255, 180, 80, 0.24)",
            padding: "1rem 1.25rem",
            borderRadius: 8,
            marginBottom: "1.5rem",
            color: "#ffb450",
          }}
        >
          No valid token in the URL. Start from <Link href="/start" style={{ color: "#c8f07a" }}>/start</Link> to generate one.
        </div>
      ) : null}

      <section
        style={{
          background: "#0a0a0b",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: "1.75rem",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", gap: "1rem" }}>
          <code
            style={{
              fontFamily: "var(--font-geist-mono), SF Mono, monospace",
              fontSize: "1.05rem",
              color: "#fff",
              whiteSpace: "nowrap",
              overflowX: "auto",
            }}
          >
            <span style={{ color: "#c8f07a" }}>$</span> {command}
          </code>
          <CopyButton text={command} label="Copy command" />
        </div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", margin: 0 }}>
          Paste this into any terminal. It works globally — you don&apos;t need to
          be in a project directory.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          What this does
        </h2>
        <ul style={{ listStyle: "none", padding: 0, color: "rgba(255,255,255,0.7)", fontSize: "0.95rem" }}>
          <li style={{ padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            Registers an MCP server named <code>designwithclaude</code> with Claude Code
          </li>
          <li style={{ padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            Saves your token so the server knows which profile to load
          </li>
          <li style={{ padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            Takes a backup of <code>~/.claude.json</code> before editing it
          </li>
          <li style={{ padding: "0.4rem 0" }}>
            Works on macOS, Linux, and Windows (via WSL or PowerShell)
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          How to undo
        </h2>
        <div
          style={{
            background: "#0a0a0b",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "0.9rem 1.1rem",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: "0.9rem",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          npx designwithclaude uninstall
        </div>
      </section>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <Link
          href={valid ? `/companion?token=${token}` : "/start"}
          style={{
            background: "#c8f07a",
            color: "#0F0F10",
            textDecoration: "none",
            fontWeight: 600,
            padding: "0.75rem 1.25rem",
            borderRadius: 8,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          I&apos;ve installed — take me to the companion →
        </Link>
        <Link
          href={valid ? `/profile?token=${token}` : "/start"}
          style={{
            color: "rgba(255,255,255,0.55)",
            textDecoration: "none",
            fontSize: "0.9rem",
          }}
        >
          ← Back to profile
        </Link>
      </div>
    </Shell>
  );
}
