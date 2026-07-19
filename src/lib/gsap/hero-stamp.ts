'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * The signature "stamp lands" hero animation.
 *
 * Design doc §6: the two-tone logo mark animates in as if physically
 * stamped onto the page — starts slightly larger and rotated further
 * off-axis, drops and settles into its resting –3° position with a
 * short, slightly-overshooting ease. Paired with a soft hero-glow
 * radial flash timed to the impact frame. Headline, subheadline, and
 * CTA fade/slide in immediately after — the stamp is the first thing
 * the eye registers.
 *
 * Non-negotiable: wrapped in prefers-reduced-motion check via
 * gsap.matchMedia(). Reduced-motion users get the end state
 * immediately, no animation. (design doc §6, §9)
 *
 * Returns a cleanup function that reverts all matchMedia conditions.
 */
export function initHeroStampAnimation() {
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const tl = gsap.timeline({ defaults: { ease: 'back.out(1.4)' } });

    tl.fromTo(
      '.hero-stamp',
      { scale: 1.15, rotate: -12, opacity: 0 },
      { scale: 1, rotate: -3, opacity: 1, duration: 0.7 }
    )
      .fromTo(
        '.hero-glow',
        { opacity: 0 },
        { opacity: 0.5, duration: 0.3 },
        '-=0.3'
      )
      .fromTo(
        '.hero-headline',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
        '-=0.2'
      )
      .fromTo(
        '.hero-subheadline',
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
        '-=0.2'
      )
      .fromTo(
        '.hero-cta',
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' },
        '-=0.1'
      );
  });

  // Reduced-motion users: set final state immediately
  // Elements should already be visible via CSS fallback (see Hero.tsx)
  mm.add('(prefers-reduced-motion: reduce)', () => {
    gsap.set(
      [
        '.hero-stamp',
        '.hero-glow',
        '.hero-headline',
        '.hero-subheadline',
        '.hero-cta',
      ],
      { opacity: 1, y: 0, scale: 1, rotate: -3 }
    );
  });

  return () => mm.revert();
}