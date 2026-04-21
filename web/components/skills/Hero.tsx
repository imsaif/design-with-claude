import { SKILLS, CATEGORIES } from "@/app/data/skills";

export function Hero() {
  return (
    <section className="skills-hero">
      <p className="skills-hero-eyebrow">Design auditor, inside Claude Code</p>
      <h1>Every design decision, audited before it ships.</h1>
      <p className="skills-hero-sub">
        Paste your CSS. dwc flags what fails WCAG, what&apos;s drifting from
        brand, what&apos;s missing — then prescribes the fix, and remembers it
        on the next call.
      </p>
      <div className="skills-hero-stats">
        <span>
          <span className="stat-num">{SKILLS.length}</span> design skills
        </span>
        <span>
          <span className="stat-num">{CATEGORIES.length}</span> categories
        </span>
        <span>
          <span className="stat-num">free</span> open source
        </span>
      </div>
    </section>
  );
}
