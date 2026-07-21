'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { initHeroStampAnimation } from '@/lib/gsap';

/**
 * Hero section — the one bold, dark section on the landing page.
 *
 * Design doc §2: hero-bg (#141B24) is the only full-bleed dark section.
 * Design doc §4: two-tone logo only on the landing page hero.
 * Design doc §6: "the stamp lands" GSAP signature animation.
 *
 * Animated elements start with opacity-0 so GSAP reveals them.
 * A <noscript> block ensures content is visible without JavaScript.
 * GSAP's prefers-reduced-motion matchMedia sets the final state
 * immediately for reduced-motion users. (design doc §6, §9)
 */
export function Hero() {
  useEffect(() => {
    const cleanup = initHeroStampAnimation();
    return cleanup;
  }, []);

  return (
    <section className="relative bg-[var(--hero-bg)] overflow-hidden">
      {/* Fallback: make animated elements visible when JS is disabled */}
      <noscript>
        <style
          dangerouslySetInnerHTML={{
            __html: `.hero-stamp,.hero-glow,.hero-headline,.hero-subheadline,.hero-cta{opacity:1!important}`,
          }}
        />
      </noscript>

      {/* Dot pattern overlay for texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='white'/%3E%3C/svg%3E")`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Hero glow — multi-layer radial gradient for realistic light */}
      <div
        className="hero-glow absolute inset-0 pointer-events-none opacity-0"
        aria-hidden="true"
      >
        {/* Inner bright core */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] bg-[radial-gradient(circle,rgba(77,153,114,0.45)_0%,transparent_70%)]"
        />
        {/* Mid glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[radial-gradient(circle,rgba(61,122,92,0.25)_0%,transparent_70%)]"
        />
        {/* Outer soft bloom */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] bg-[radial-gradient(circle,rgba(61,122,92,0.1)_0%,transparent_70%)]"
        />
      </div>

      {/* Bottom gradient fade — hero to paper transition */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--paper))',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-24 pb-28 md:pt-32 md:pb-36 text-center max-w-2xl mx-auto">
        {/* Two-tone logo — design doc §4, animated by GSAP */}
        <div className="mb-8">
          <Image
            src="/kept-logo-mark-two-tone.svg"
            alt="Kept logo — personal purchase vault"
            width={160}
            height={160}
            priority
            className="hero-stamp select-none opacity-0"
            style={{ transform: 'rotate(-3deg)' }}
          />
        </div>

        {/* Headline — large bold, Geist at pushed scale, animated by GSAP */}
        <h1 className="hero-headline text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight opacity-0">
          Snap a receipt.
        </h1>

        {/* Subheadline — animated by GSAP */}
        <p className="hero-subheadline mt-4 text-lg text-white/70 max-w-md opacity-0">
          Never lose a warranty or a subscription again.
        </p>

        {/* CTA — accent green, landing-page-specific per design doc §7 */}
        <div className="hero-cta mt-8 opacity-0">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-[var(--accent-color)] text-[var(--paper)] font-medium text-base transition-all duration-200 hover:scale-[1.03] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hero-bg)]"
          >
            Get started free
          </Link>
        </div>

        {/* Log in link — not part of the hero animation sequence */}
        <Link
          href="/login"
          className="mt-4 text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          Log in
        </Link>
      </div>
    </section>
  );
}