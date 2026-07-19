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
    <section className="bg-background py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-6">
        {/* Section heading */}
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center tracking-tight">
          How it works
        </h2>

        {/* Steps — horizontal on md+, vertical on mobile */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {steps.map((step) => (
            <div key={step.number} data-reveal="true" className="flex flex-col items-center text-center">
              {/* Step number */}
              <span className="text-3xl font-bold text-muted-foreground/40 tabular-nums">
                {step.number}
              </span>

              {/* Icon */}
              <div className="mt-3 flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-color)]/10">
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