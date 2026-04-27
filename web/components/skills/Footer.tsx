import Link from "next/link";

export function Footer() {
  return (
    <footer className="skills-footer">
      <div className="skills-footer-left">
        &copy; 2026 designwithclaude.com
      </div>
      <div className="skills-footer-links">
        <Link href="/library">Free library</Link>
        <Link href="/#install">Get started</Link>
        <a
          href="https://github.com/imsaif/design-with-claude"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <a
          href="https://aiuxdesign.guide"
          target="_blank"
          rel="noopener noreferrer"
        >
          AI UX Patterns
        </a>
      </div>
    </footer>
  );
}
