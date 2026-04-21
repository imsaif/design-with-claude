import { Nav } from "@/components/skills/Nav";
import { Hero } from "@/components/skills/Hero";
import { AuditDemo } from "@/components/skills/AuditDemo";
import { InstallV2 } from "@/components/skills/InstallV2";
import { SpecialistsList } from "@/components/skills/SpecialistsList";
import { LearnCTA } from "@/components/skills/LearnCTA";
import { NewsletterSignup } from "@/components/skills/NewsletterSignup";
import { EcosystemLinks } from "@/components/skills/EcosystemLinks";
import { Footer } from "@/components/skills/Footer";

export default function LandingPage() {
  return (
    <>
      <Nav />
      <Hero />
      <AuditDemo />
      <InstallV2 />
      <SpecialistsList />
      <LearnCTA />
      <NewsletterSignup />
      <EcosystemLinks />
      <Footer />
    </>
  );
}
