import { SKILLS, CATEGORIES } from "@/app/data/skills";

export function Hero() {
  return (
    <section className="skills-hero">
      <p className="skills-hero-eyebrow">Design-engineering rigor inside Claude Code</p>
      <h1>Audit, preserve, and persist your design system while Claude Code ships.</h1>
      <p className="skills-hero-sub">
        The MCP layer that catches contrast failures, protects mandated accents,
        and carries your design decisions across every session. Pair it with any
        canvas tool — or bring your own system.
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
