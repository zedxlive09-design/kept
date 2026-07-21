'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Subtle ScrollTrigger reveals for sections below the hero.
 *
 * Design doc §6: "restrained ScrollTrigger reveals only — each
 * 'How it works' step and feature card fades/slides up a small
 * amount (12–16px) as it enters the viewport, once, no scrub/pin
 * effects. This is support, not a second signature moment."
 *
 * Targets elements via data attributes: data-reveal="true"
 *
 * Wrapped in prefers-reduced-motion check. Reduced-motion users
 * get the end state immediately. (design doc §6, §9)
 *
 * Returns a cleanup function that reverts all matchMedia conditions.
 */
export function initScrollRevealAnimations() {
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const elements = document.querySelectorAll('[data-reveal="true"]');
    elements.forEach((el) => {
      gsap.fromTo(
        el,
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        }
      );
    });
  });

  // Reduced-motion users: elements already visible via CSS fallback
  mm.add('(prefers-reduced-motion: reduce)', () => {
    gsap.set('[data-reveal="true"]', { opacity: 1, y: 0 });
  });

  return () => mm.revert();
}