import { SKILLS, CATEGORIES } from "@/app/data/skills";

export function Hero() {
  return (
    <section className="skills-hero">
      <p className="skills-hero-eyebrow">Design Skills for Claude Code</p>
      <h1>Skills built for designers, not just developers.</h1>
      <p className="skills-hero-sub">
        AI coding tools have thousands of skills. None are made for design work.
        This is the curated set. Agents that understand wireframes,
        accessibility, handoff, copy, and the way designers actually think.
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
