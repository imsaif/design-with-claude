import { Nav } from "@/components/skills/Nav";
import { Hero } from "@/components/skills/Hero";
import { LearnCTA } from "@/components/skills/LearnCTA";
import { InstallBanner } from "@/components/skills/InstallBanner";
import { SkillsDirectory } from "@/components/skills/SkillsDirectory";
import { EcosystemLinks } from "@/components/skills/EcosystemLinks";
import { NewsletterSignup } from "@/components/skills/NewsletterSignup";
import { Footer } from "@/components/skills/Footer";

export default function SkillsPage() {
  return (
    <>
      <Nav />
      <Hero />
      <InstallBanner />
      <LearnCTA />
      <SkillsDirectory />
      <NewsletterSignup />
      <EcosystemLinks />
      <Footer />
    </>
  );
}
