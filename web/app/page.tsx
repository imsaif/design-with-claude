import { Nav } from "@/components/skills/Nav";
import { Hero } from "@/components/skills/Hero";
import { InstallBanner } from "@/components/skills/InstallBanner";
import { SkillsDirectory } from "@/components/skills/SkillsDirectory";
import { EcosystemLinks } from "@/components/skills/EcosystemLinks";
import { Footer } from "@/components/skills/Footer";

export default function SkillsPage() {
  return (
    <>
      <Nav />
      <Hero />
      <InstallBanner />
      <SkillsDirectory />
      <EcosystemLinks />
      <Footer />
    </>
  );
}
