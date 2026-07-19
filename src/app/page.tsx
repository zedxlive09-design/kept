/**
 * Kept — Landing Page (Phase 0 scaffold)
 *
 * Currently: a blank, shadcn-styled page confirming the design system
 * tokens are wired correctly and the project scaffold is in place.
 *
 * Phase 3 will replace this with the full landing page structure (§8):
 * Hero → How It Works → Feature Grid → [Social Proof] → Final CTA → Footer
 */
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-6">
      {/* Logo mark — design doc §4: ink-only variant, used on light paper background */}
      <Image
        src="/kept-logo-mark.svg"
        alt="Kept"
        width={96}
        height={96}
        priority
        className="select-none"
        style={{ transform: "rotate(-3deg)" }}
      />

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Kept
        </h1>
        <p className="text-sm text-muted-foreground">
          Your purchase vault. Nothing kept yet.
        </p>
      </div>

      {/* Design system token verification — remove in Phase 3 */}
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-accent" />
          accent
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: "var(--status-active)" }} />
          active
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: "var(--status-expiring)" }} />
          expiring
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: "var(--status-expired)" }} />
          expired
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: "var(--status-cancelled)" }} />
          cancelled
        </span>
      </div>
    </main>
  );
}