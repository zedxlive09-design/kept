'use client';

import { useEffect, type ReactNode } from 'react';
import { initScrollRevealAnimations } from '@/lib/gsap';

/**
 * Client wrapper that initializes scroll-triggered reveal animations
 * for landing page sections below the hero.
 *
 * Wrapped in prefers-reduced-motion via gsap.matchMedia() internally.
 * (design doc §6, §9)
 */
export function LandingAnimations({ children }: { children: ReactNode }) {
  useEffect(() => {
    const cleanup = initScrollRevealAnimations();
    return cleanup;
  }, []);

  return <>{children}</>;
}