import Link from "next/link";
import { Shell } from "@/components/companion/Shell";
import { CopyButton } from "@/components/companion/CopyButton";
import { isTokenShapeValid } from "@/lib/dwc/tokens";
import { isValidSlug } from "@/lib/dwc/projects";

interface InstallPageProps {
  searchParams: Promise<{ token?: string; project?: string }>;
}

export const metadata = {
  title: "Install designwithclaude",
};

export default async function InstallPage({ searchParams }: InstallPageProps) {
  const { token = "", project: rawProject } = await searchParams;
  const valid = isTokenShapeValid(token);
  const project = rawProject && isValidSlug(rawProject) ? rawProject : "default";

  const setupCommand = valid
    ? `npx designwithclaude setup --token=${token} --project=${project}`
    : `npx designwithclaude setup --token=imr_yourTokenHere --project=<slug>`;
  const uninstallCommand = `npx designwithclaude uninstall --project=${project}`;

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
          Install · project{" "}
          <code style={{ color: "rgba(255,255,255,0.75)" }}>{project}</code>
        </p>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 600, lineHeight: 1.15, marginBottom: "0.75rem" }}>
          Install the MCP server for this project
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "1.05rem", maxWidth: 600 }}>
          <strong style={{ color: "#fff" }}>Run this inside the project directory</strong> you want
          Claude Code to use — we&apos;ll write a <code>.mcp.json</code> there so this project&apos;s
          design system only applies when Claude Code runs from that folder.
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
              fontSize: "1rem",
              color: "#fff",
              whiteSpace: "nowrap",
              overflowX: "auto",
            }}
          >
            <span style={{ color: "#c8f07a" }}>$</span> {setupCommand}
          </code>
          <CopyButton text={setupCommand} label="Copy" />
        </div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", margin: 0 }}>
          Default scope writes <code>.mcp.json</code> in the current directory. Open a new Claude
          Code session from that directory and dwc is in.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          What this does
        </h2>
        <ul style={{ listStyle: "none", padding: 0, color: "rgba(255,255,255,0.7)", fontSize: "0.95rem" }}>
          <li style={{ padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            Writes <code>.mcp.json</code> in the current directory with your token + project slug
          </li>
          <li style={{ padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            Registers the server with Claude Code so its tools appear in this project
          </li>
          <li style={{ padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            Other projects stay isolated — each gets its own <code>.mcp.json</code> + design system
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
          {uninstallCommand}
        </div>
      </section>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <Link
          href={valid ? `/companion?token=${token}&project=${project}` : "/start"}
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
          href={valid ? `/profile?token=${token}&project=${project}` : "/start"}
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
