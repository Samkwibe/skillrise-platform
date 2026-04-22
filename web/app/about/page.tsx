import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { AboutSection } from "@/components/about/about-section";
import { about } from "@/lib/about";

export const metadata = {
  title: `About ${about.name} — SkillRise`,
  description: about.tagline,
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="pt-24">
        <AboutSection variant="full" />
      </main>
      <Footer />
    </>
  );
}
