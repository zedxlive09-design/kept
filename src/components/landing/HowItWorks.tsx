import { Camera, CheckCircle, Bell } from "lucide-react";

/**
 * How It Works — 3 numbered steps explaining the core flow.
 *
 * Architecture §8: "A real sequence, so numbering it is earning its keep."
 * Vertical on mobile, horizontal row on desktop.
 *
 * No 'use client' — static server component.
 */

const steps = [
  {
    number: "01",
    icon: Camera,
    title: "Snap",
    description:
      "Take a photo of your receipt, invoice, or subscription confirmation.",
  },
  {
    number: "02",
    icon: CheckCircle,
    title: "Confirm",
    description:
      "AI fills in the details. Review and save in seconds.",
  },
  {
    number: "03",
    icon: Bell,
    title: "Get reminded",
    description:
      "We\u2019ll notify you before a warranty expires or a subscription renews.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-background pt-28 md:pt-36 pb-20 md:py-28">
      <div className="max-w-4xl mx-auto px-6">
        {/* Section label */}
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground text-center mb-3">
          How it works
        </p>

        {/* Section heading */}
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center tracking-tight">
          Three steps to clarity
        </h2>

        {/* Steps — horizontal on md+, vertical on mobile */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 relative">
          {/* Connecting line between steps (desktop only) */}
          <div
            className="hidden md:block absolute top-[22px] left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px bg-border"
            aria-hidden="true"
          />

          {steps.map((step, idx) => (
            <div
              key={step.number}
              data-reveal="true"
              className="relative flex flex-col items-center text-center group"
            >
              {/* Step number circle with border */}
              <span className="relative z-10 flex items-center justify-center w-11 h-11 rounded-full border-2 border-[var(--accent-color)]/20 bg-background text-lg font-bold text-[var(--accent-color)]/50 tabular-nums transition-all duration-200 group-hover:border-[var(--accent-color)]/40 group-hover:text-[var(--accent-color)]/70">
                {step.number}
              </span>

              {/* Icon */}
              <div className="mt-4 flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-color)]/10 transition-colors duration-200 group-hover:bg-[var(--accent-color)]/15">
                <step.icon
                  className="w-6 h-6 text-[var(--accent-color)]"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </div>

              {/* Title */}
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {step.title}
              </h3>

              {/* Description */}
              <p className="mt-2 text-sm text-muted-foreground max-w-xs leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}