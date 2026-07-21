# Task 7 — Phase 7: Full Design System Pass + GSAP Animation

## Agent: Main

## Summary
Implemented the complete GSAP animation system for the Kept landing page, plus a design system verification pass on StatusStamp.

## What was done

### GSAP Animation Files (NEW)
- **`src/lib/gsap/hero-stamp.ts`** — The signature "stamp lands" hero animation
  - Orchestrated timeline: stamp scales/rotates in → glow flashes → headline/subheadline/CTA fade-slide up
  - `back.out(1.4)` ease for the stamp (physical "thud" feel), `power2.out` for text
  - Fully wrapped in `gsap.matchMedia()` — reduced-motion users get final state immediately
  - Returns cleanup function for React useEffect

- **`src/lib/gsap/scroll-reveal.ts`** — Subtle ScrollTrigger reveals for sections below hero
  - Queries `[data-reveal="true"]` elements
  - `fromTo({ y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })` with `scrollTrigger: { start: 'top 85%', once: true }`
  - No scrub, no pin — just a gentle fade-up as elements enter viewport
  - Same prefers-reduced-motion wrapping

- **`src/lib/gsap/index.ts`** — Barrel export for both initializers

### Component Updates
- **`src/components/landing/Hero.tsx`** — Converted to `'use client'`
  - Added GSAP target classes: `hero-stamp`, `hero-glow`, `hero-headline`, `hero-subheadline`, `hero-cta`
  - Animated elements start with `opacity-0`, revealed by GSAP
  - `<noscript>` fallback ensures content visible without JS
  - CTA wrapped in a `<div className="hero-cta">` for animation targeting

- **`src/components/landing/LandingAnimations.tsx`** (NEW) — Thin client wrapper
  - Calls `initScrollRevealAnimations()` in useEffect
  - Wraps HowItWorks, FeatureGrid, FinalCTA in page.tsx

- **`src/components/landing/HowItWorks.tsx`** — Added `data-reveal="true"` to each step card
- **`src/components/landing/FeatureGrid.tsx`** — Added `data-reveal="true"` to each feature card
- **`src/app/page.tsx`** — Remains server component; wraps animated sections with `<LandingAnimations>`

### Design System Verification
- **`src/components/items/StatusStamp.tsx`** — Verified against design doc §5:
  - Fixed label: `EXPIRING SOON` → `EXPIRING` (exact match with §5 spec)
  - All other properties confirmed correct: circular ring, 2px stroke, -4deg rotation, 10px uppercase tracking-widest, shared status color, minWidth 80px

## Design Rules Followed
- ✅ NO PURPLE anywhere
- ✅ All GSAP animations respect `prefers-reduced-motion` via `gsap.matchMedia()`
- ✅ "Spend the boldness in one place" — hero is the signature moment, scroll reveals are subtle support
- ✅ Dark mode tokens stay legible (no changes needed)
- ✅ noscript fallback for accessibility
- ✅ page.tsx remains a server component (SEO/SSG preserved)
- ✅ ESLint: zero errors