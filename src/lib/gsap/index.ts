/**
 * Kept — GSAP Animation Setup (Phase 7)
 *
 * All GSAP and ScrollTrigger setup lives here.
 * Every animation MUST be wrapped in a prefers-reduced-motion check
 * using gsap.matchMedia() — reduced-motion users get the end state
 * immediately, no animation, not a slower version. (design doc §6, §9)
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger once centrally — both hero-stamp and
// scroll-reveal depend on it. Registering twice is harmless but
// unnecessary; centralising avoids future confusion.
gsap.registerPlugin(ScrollTrigger);

export { initHeroStampAnimation } from './hero-stamp';
export { initScrollRevealAnimations } from './scroll-reveal';