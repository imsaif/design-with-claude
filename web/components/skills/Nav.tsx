import Link from "next/link";
import DwicIcon from "@/components/DwicIcon";

export function Nav() {
  return (
    <nav className="skills-nav" aria-label="Primary">
      <div className="skills-nav-brand">
        <Link href="/" className="skills-nav-logo" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <DwicIcon className="h-6 w-auto" />
          <span aria-label="designwithclaude">
            <span aria-hidden="true">
              <span className="skills-nav-logo-accent">d</span>
              <span className="skills-nav-logo-dim">esign</span>
              <span className="skills-nav-logo-accent">wi</span>
              <span className="skills-nav-logo-dim">th</span>
              <span className="skills-nav-logo-accent">c</span>
              <span className="skills-nav-logo-dim">laude</span>
            </span>
          </span>
          <span className="skills-nav-badge" aria-label="Alpha release">
            alpha
          </span>
        </Link>
        <a
          href="https://github.com/imsaif/design-with-claude"
          className="skills-nav-github"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
          GitHub
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
      <div className="skills-nav-links">
        <Link href="/how-it-works">How it works</Link>
        <Link href="/design-research">Design Research</Link>
        <Link href="/library">Free library</Link>
      </div>
    </nav>
  );
}
