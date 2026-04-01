import Link from "next/link";
import DwcIcon from "@/components/DwcIcon";

export function Nav() {
  return (
    <nav className="skills-nav">
      <Link href="/" className="skills-nav-logo" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <DwcIcon className="h-6 w-auto" />
        <span>design<span className="skills-nav-logo-accent">with</span>claude</span>
      </Link>
      <div className="skills-nav-links">
        <a href="#install">How to install</a>
        <a
          href="https://aiuxdesign.guide"
          target="_blank"
          rel="noopener noreferrer"
        >
          AI UX Patterns
        </a>
        <a
          href="https://github.com/imsaif/design-with-claude"
          target="_blank"
          rel="noopener noreferrer"
        >
          Submit a skill
        </a>
      </div>
    </nav>
  );
}
