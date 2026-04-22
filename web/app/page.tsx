import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { MovementStrip } from "@/components/movement-strip";
import { Features } from "@/components/features";
import { RolePreview } from "@/components/landing/role-preview";
import { LifeSkills } from "@/components/landing/life-skills";
import { Mission } from "@/components/mission";
import { Audiences } from "@/components/audiences";
import { TeachFlow } from "@/components/teach-flow";
import { SkillFeedPreview } from "@/components/skillfeed-preview";
import { Youth } from "@/components/youth";
import { Testimonials } from "@/components/testimonials";
import { AboutSection } from "@/components/about/about-section";
import { Pledge } from "@/components/pledge";
import { ImpactStrip } from "@/components/impact-strip";
import { Employers } from "@/components/employers";
import { Download } from "@/components/download";
import { Footer } from "@/components/footer";
import { Reveal } from "@/components/reveal";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <MovementStrip />
        <Reveal>
          <Features />
        </Reveal>
        <Reveal>
          <LifeSkills />
        </Reveal>
        <Reveal>
          <RolePreview />
        </Reveal>
        <Reveal>
          <Mission />
        </Reveal>
        <Reveal>
          <Audiences />
        </Reveal>
        <Reveal>
          <TeachFlow />
        </Reveal>
        <Reveal>
          <SkillFeedPreview />
        </Reveal>
        <Reveal>
          <Youth />
        </Reveal>
        <Reveal>
          <Testimonials />
        </Reveal>
        <Reveal>
          <AboutSection variant="compact" />
        </Reveal>
        <Reveal>
          <Pledge />
        </Reveal>
        <ImpactStrip />
        <Reveal>
          <Employers />
        </Reveal>
        <Reveal>
          <Download />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
