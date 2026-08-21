import { Nav } from "@/components/skills/Nav";
import { InstallBanner } from "@/components/skills/InstallBanner";
import { SkillsDirectory } from "@/components/skills/SkillsDirectory";
import { EcosystemLinks } from "@/components/skills/EcosystemLinks";
import { Footer } from "@/components/skills/Footer";
import { SKILLS, CATEGORIES } from "@/app/data/skills";

export const metadata = {
  title: "Turn Claude Code into your product designer | dwic",
  description: `${SKILLS.length} free design specialists as Claude Code slash commands, across ${CATEGORIES.length} categories. Install all of them as one plugin, or copy a single markdown file into any Claude Code project.`,
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
          <p className="skills-hero-eyebrow">Plugin · free · open source</p>
          <h1>Turn Claude Code into your product designer.</h1>
          <p className="skills-hero-sub">
            Design superpowers, from {SKILLS.length} specialists.
          </p>
          <InstallBanner />
        </section>
        <SkillsDirectory />
        <EcosystemLinks />
      </main>
      <Footer />
    </>
  );
}
