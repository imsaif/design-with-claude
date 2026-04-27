import { Nav } from "@/components/skills/Nav";
import { Hero } from "@/components/skills/Hero";
import { Footer } from "@/components/skills/Footer";

export default function LandingPage() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav />
      <main id="main-content">
        <Hero />
      </main>
      <Footer />
    </>
  );
}
