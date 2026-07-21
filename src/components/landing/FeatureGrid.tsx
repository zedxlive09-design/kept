import { Sparkles, ShieldCheck, CreditCard, BellRing } from "lucide-react";

/**
 * Feature Grid — 4 cards in a 2×2 grid (1-col on mobile).
 *
 * Architecture §8: "icon + one line each, no illustration needed."
 * Design doc §7: cards are flat and quiet — accent color draws the eye, not elevation.
 *
 * No 'use client' — static server component.
 */

const features = [
  {
    icon: Sparkles,
    title: "AI-powered scanning",
    description:
      "Point your camera at any receipt. Structured data, not a wall of text.",
  },
  {
    icon: ShieldCheck,
    title: "Warranty tracking",
    description:
      "Never miss a claim window. Reminders at 30 and 7 days before expiry.",
  },
  {
    icon: CreditCard,
    title: "Subscription management",
    description:
      "See every recurring charge. Know your true monthly cost.",
  },
  {
    icon: BellRing,
    title: "Smart reminders",
    description:
      "One email per day, only when something needs your attention.",
  },
];

export function FeatureGrid() {
  return (
    <section className="bg-background py-20 md:py-28 border-t border-border">
      <div className="max-w-3xl mx-auto px-6">
        {/* Section heading */}
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center tracking-tight">
          Everything in one place
        </h2>

        {/* 2×2 grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              data-reveal="true"
              className="min-h-[140px] bg-card border border-transparent hover:border-border rounded-lg p-6 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent-color)] to-[var(--accent-color)]/70">
                <feature.icon
                  className="w-4.5 h-4.5 text-white"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}