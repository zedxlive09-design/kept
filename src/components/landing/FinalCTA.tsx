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
    <section className="bg-background py-24 md:py-32 border-t border-border">
      <div
        className="mx-auto max-w-lg px-6 py-12 rounded-2xl text-center"
        style={{
          background:
            "linear-gradient(135deg, rgba(47,93,69,0.03) 0%, transparent 50%, rgba(47,93,69,0.03) 100%)",
        }}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Start keeping track today
        </h2>

        <Link
          href="/signup"
          className="mt-8 inline-flex items-center justify-center h-[52px] px-10 rounded-lg bg-[var(--accent-color)] text-[var(--paper)] font-medium text-base transition-all duration-200 hover:scale-[1.03] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          style={{
            boxShadow: "0 0 20px rgba(47,93,69,0.15)",
          }}
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