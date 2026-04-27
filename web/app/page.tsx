import { Nav } from "@/components/skills/Nav";
import { Footer } from "@/components/skills/Footer";
import { GetStartedPreview } from "@/components/skills/GetStartedPreview";

export default function LandingPage() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav />
      <main id="main-content">
        <GetStartedPreview />
      </main>
      <Footer />
    </>
  );
}
