import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';
import { LandingAnimations } from '@/components/landing/LandingAnimations';

/**
 * Kept — Landing Page (Phase 3 + Phase 7 animations)
 *
 * Architecture §8 section order:
 *   Hero → How It Works → Feature Grid → [Social Proof — skipped, DECISION NEEDED] → Final CTA → Footer
 *
 * Hero is a client component with its own GSAP "stamp lands" animation.
 * LandingAnimations wraps the remaining sections for scroll-triggered reveals.
 *
 * SEO: metadata is set in layout.tsx for the root route.
 * The footer uses mt-auto to stick to the bottom when content is short.
 */
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Hero />
      <LandingAnimations>
        <HowItWorks />
        <FeatureGrid />
        <FinalCTA />
      </LandingAnimations>
      <Footer />
    </div>
  );
}