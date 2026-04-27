import Link from "next/link";
import { Nav } from "@/components/skills/Nav";
import { LearnCTA } from "@/components/skills/LearnCTA";
import { InstallBanner } from "@/components/skills/InstallBanner";
import { SkillsDirectory } from "@/components/skills/SkillsDirectory";
import { EcosystemLinks } from "@/components/skills/EcosystemLinks";
import { Footer } from "@/components/skills/Footer";
import { SKILLS, CATEGORIES } from "@/app/data/skills";

export const metadata = {
  title: "Library — free Claude Code design skills | dwic",
  description: `${SKILLS.length} free design agents as Claude Code slash commands, across ${CATEGORIES.length} categories. Separate from dwic (the design auditor) — install a single markdown file and get expert design guidance inside any Claude Code project.`,
  alternates: {
    canonical: "/library",
  },
};

export default function LibraryPage() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav />
      <main id="main-content">
        <section className="skills-hero">
          <p className="skills-hero-eyebrow">Library · free · open source</p>
          <h1>{SKILLS.length} free design skills for Claude Code.</h1>
          <p className="skills-hero-sub">
            Free slash commands for Claude Code: accessibility, design
            systems, motion, typography, copy. Install one at a time, no
            dependencies.
            <br />
            <br />
            Looking for <strong>dwic</strong>, the subscription auditor?{" "}
            <Link href="/" className="skills-nav-logo-accent" style={{ textDecoration: "underline" }}>
              It lives here →
            </Link>
          </p>
          <div className="skills-hero-stats">
            <span>
              <span className="stat-num">{SKILLS.length}</span> design skills
            </span>
            <span>
              <span className="stat-num">{CATEGORIES.length}</span> categories
            </span>
            <span>
              <span className="stat-num">0</span> dependencies
            </span>
          </div>
        </section>
        <InstallBanner />
        <LearnCTA />
        <SkillsDirectory />
        <EcosystemLinks />
      </main>
      <Footer />
    </>
  );
}
