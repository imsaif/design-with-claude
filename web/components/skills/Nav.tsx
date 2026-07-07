import Link from "next/link";
import DwicIcon from "@/components/DwicIcon";

export function Nav() {
  return (
    <nav className="skills-nav" aria-label="Primary">
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
      <div className="skills-nav-links">
        <Link href="/how-it-works">How it works</Link>
        <Link href="/design-research">Design Research</Link>
        <Link href="/library">Free library</Link>
      </div>
    </nav>
  );
}
