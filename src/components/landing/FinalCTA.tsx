import Link from "next/link";

/**
 * Final CTA — repeats the primary action from the hero.
 *
 * Architecture §8: "Repeat the primary action" — same CTA, not a new message.
 *
 * No 'use client' — static server component.
 */
export function FinalCTA() {
  return (
    <section className="bg-background py-20 md:py-28 border-t border-border">
      <div className="max-w-md mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Start keeping track today
        </h2>

        <Link
          href="/signup"
          className="mt-6 inline-flex items-center justify-center h-12 px-8 rounded-lg bg-[var(--accent-color)] text-[var(--paper)] font-medium text-base transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Get started free
        </Link>

        <p className="mt-4 text-sm text-muted-foreground">
          Free to use. No credit card required.
        </p>
      </div>
    </section>
  );
}