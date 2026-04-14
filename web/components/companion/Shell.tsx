import Link from "next/link";
import DwcIcon from "@/components/DwcIcon";
import type { ReactNode } from "react";

interface ShellProps {
  children: ReactNode;
  step?: 1 | 2 | 3 | 4 | 5;
}

const STEPS: Array<{ n: 1 | 2 | 3 | 4 | 5; label: string }> = [
  { n: 1, label: "Start" },
  { n: 2, label: "Profile" },
  { n: 3, label: "Install" },
  { n: 4, label: "Companion" },
  { n: 5, label: "Upgrade" },
];

export function Shell({ children, step }: ShellProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F0F10",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <nav
        style={{
          padding: "1.25rem 2rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          <DwcIcon className="h-6 w-auto" />
          <span>
            design<span style={{ color: "#c8f07a" }}>with</span>claude
          </span>
        </Link>
        {step ? (
          <ol
            aria-label="Journey progress"
            style={{
              display: "flex",
              gap: "0.75rem",
              listStyle: "none",
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.45)",
              alignItems: "center",
            }}
          >
            {STEPS.map((s, i) => (
              <li
                key={s.n}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  color:
                    s.n === step
                      ? "#c8f07a"
                      : s.n < step
                        ? "rgba(255,255,255,0.75)"
                        : "rgba(255,255,255,0.4)",
                  fontWeight: s.n === step ? 600 : 400,
                }}
              >
                <span>{s.label}</span>
                {i < STEPS.length - 1 ? (
                  <span aria-hidden style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}
      </nav>
      <main style={{ flex: 1, padding: "3rem 2rem", maxWidth: 960, width: "100%", margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}
