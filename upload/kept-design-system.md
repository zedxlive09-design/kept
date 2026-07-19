# Kept — Design & Brand System

**Companion to:** `kept-master-architecture.md`
**Brief:** attractive and clean, no purple, no art budget.
**Attached alongside this doc:** `kept-logo-mark.svg`, `kept-logo-mark-two-tone.svg`, `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` — starter assets built from the spec below, ready to drop into `/public`.

---

## 1. Brand Rationale

Kept exists to hold proof — that you bought something, that it's covered, that a bill is due. The entire visual language comes from that one idea: **a seal.** A wax seal or a rubber stamp is the physical-world version of "this is verified, this is on record." Every distinctive choice below — the ring-and-monogram logo, the tick-marked "coin edge" texture, the rotated status stamps in the app itself — is the same idea reused, not three unrelated decorations.

This deliberately steers away from the three looks that read as "AI-generated template" right now: warm cream + high-contrast serif + terracotta; near-black + neon accent; broadsheet hairline-rule layouts. None of those say "a place where your proof of purchase lives." A seal does.

**No purple, anywhere** — hero gradients included. This is a hard constraint from the brief, not just an aesthetic default.

---

## 2. Color System

Two contexts, two moods, same palette — the dashboard is a tool you use for ten seconds a day and should get out of your way; the landing page has one job (convert a stranger) and is allowed to be bolder. This split is intentional: using the identical restrained palette on both would make the landing page forgettable, and using the bolder landing treatment inside the dashboard would make daily use tiring.

### Core tokens (used everywhere)

| Token | Hex | Use |
|---|---|---|
| `paper` | `#F6F5F2` | App background — cool, quiet neutral. Deliberately not the cliché warm cream (`#F4F1EA`-family). |
| `surface` | `#FFFFFF` | Cards, modals |
| `ink` | `#1B2430` | Primary text, primary buttons, the logo — "seal ink" |
| `ink-muted` | `#5B6470` | Secondary text |
| `border` | `#E3E1DB` | Hairlines, dividers |
| `accent` | `#2F5D45` | Deep pine-green — the one confident color in the restrained palette. Links, focus rings, primary actions in the dashboard. |

### Status tokens (functional, not decorative — this is the core information the app communicates)

| Token | Hex | Meaning |
|---|---|---|
| `status-active` | `#2F5D45` | Covered / safe |
| `status-expiring` | `#B8752B` | Muted amber — action needed soon |
| `status-expired` | `#A6402F` | Muted brick red |
| `status-cancelled` | `#8B8478` | Warm gray |

### Landing-page-only extension

The dashboard never uses these — they exist to give the hero section the visual weight a marketing page needs without touching purple:

| Token | Hex | Use |
|---|---|---|
| `hero-bg` | `#141B24` | Near-`ink`, slightly deeper — the one full-bleed dark section on the site, hero only |
| `hero-glow` | `#3D7A5C` | A lighter tint of `accent`, used only as a soft radial glow behind the stamp animation |

Pattern: **dark hero, light everything else.** One section of contrast, not a dark-mode-everywhere theme — that's the "spend your boldness in one place" principle applied to layout, not just color.

---

## 3. Typography

- **UI/body:** Geist (fallback: Inter), via `next/font`. One grotesque sans for all interface chrome — no display serif. This is a utility app wearing a marketing page, not an editorial site; restraint here is a choice, not a gap.
- **Money, dates, and only money and dates:** Geist Mono with tabular figures (`font-variant-numeric: tabular-nums`). This is a real financial-app convention — columns of amounts need to align — not decoration. Applies to list rows, dashboard totals, item detail. Nowhere else.
- **Landing page headline:** same Geist family, just pushed larger and heavier (700–800 weight) than anything the dashboard uses. The type *scale* is where the landing page gets its visual energy, not a second typeface.

---

## 4. Logo & Favicon

### Concept
A circular seal: two concentric rings with a tick-marked band between them (the "milled coin edge" of a stamp), a bold monogram **K** centered inside, the whole mark rotated **–3°** as one rigid unit — like an impression pressed slightly off-true, the way a real stamp actually lands. Rotating the *whole* mark together (not just part of it) is what keeps this reading as "intentional" rather than "broken."

### Files attached, and when to use each

| File | Use |
|---|---|
| `kept-logo-mark.svg` | Primary mark — full detail with the tick-mark ring. Website header, app-store listing, large contexts. Ink-only (`#1B2430`), works on the light `paper` background. |
| `kept-logo-mark-two-tone.svg` | Same mark, inner ring in `accent` green instead of ink. Use only on the landing page hero, next to the bolder palette — not in the dashboard header. |
| `favicon.svg` / `favicon.ico` / `apple-touch-icon.png` | Simplified mark — **no tick marks, thicker ring, bigger letter.** Fine detail disappears below ~32px; a favicon needs to read instantly as a shape, not a texture. |
| `icon-192.png` / `icon-512.png` | Full detailed mark rendered large, for the PWA manifest / Android app icon — plenty of room for the tick-mark detail at that size. |

### If you need to regenerate or adjust it
The mark is pure geometry (two circles, radial tick lines computed from center + angle, centered text) — no illustration skill needed, which is exactly why it works within a zero-art-budget constraint. To adjust: change the letter, the two ring radii, or the tick count/spacing; the rotation should stay a single transform on the outermost group so ring, ticks, and letter move together.

### Dark backgrounds
For the rare dark-surface use (e.g. inside the two-tone hero), a light variant is just the same file with `ink` swapped for `paper` on strokes/text — don't redraw it from scratch.

---

## 5. The Signature Element: Status Stamps

This is the one place the seal motif shows up *inside the product*, and it's functional, not decorative: status is the single most important thing a user scans for on any item.

- A circular ring, ~2px stroke, slight rotation (~–4°) — same "pressed impression" logic as the logo, at UI scale.
- Small, letter-spaced, uppercase label inside: `ACTIVE`, `EXPIRING`, `EXPIRED`, `CANCELLED`.
- Color from the status tokens in §2 — the ring and label share the one status color, nothing else on the card competes with it.
- Used on item cards, item detail, and nowhere else — it's a status indicator, not a general decorative badge. Don't reuse the stamp shape for things that aren't status (e.g. category tags should be plain text or a simple flat pill, not a second stamp — one signature element, used consistently, beats two competing ones).

---

## 6. Landing Page Animation (GSAP)

GSAP + ScrollTrigger, both fully free since April 2025 (Webflow's acquisition of GreenSock ended the paid "Club GreenSock" plugin tier) — no licensing cost or workaround needed.

**Spend the boldness in one place:** one orchestrated hero moment, not scattered scroll effects on every section. Scattered micro-animations are exactly what makes a page feel AI-generated; one deliberate moment reads as designed.

**The signature moment — "the stamp lands":** on load, the two-tone logo mark animates in as if it's being physically stamped onto the page: starts slightly larger and rotated further off-axis (~–12°), drops and settles into its resting –3° position with a short, slightly-overshooting ease (`elastic.out` or `back.out`, low amplitude — a real stamp doesn't bounce, it thuds once and settles), paired with a soft `hero-glow` radial flash timed to the impact frame. Headline text fades/slides in immediately after, not simultaneously — the stamp is the first thing the eye registers.

```javascript
// lib/gsap/hero-stamp.ts — sketch, not final code
gsap.timeline()
  .fromTo(".hero-stamp",
    { scale: 1.15, rotate: -12, opacity: 0 },
    { scale: 1, rotate: -3, opacity: 1, duration: 0.7, ease: "back.out(1.4)" }
  )
  .fromTo(".hero-glow", { opacity: 0 }, { opacity: 0.5, duration: 0.3 }, "-=0.3")
  .fromTo(".hero-headline", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.2");
```

**Below the hero:** restrained `ScrollTrigger` reveals only — each "How it works" step and feature card fades/slides up a small amount (12–16px) as it enters the viewport, once, no scrub/pin effects. This is support, not a second signature moment.

**Non-negotiable:** wrap all of it in a `prefers-reduced-motion` check (`gsap.matchMedia()`) — reduced-motion users get the end state immediately, no animation, not a slower version of the same animation.

---

## 7. Component Patterns

- **Cards:** `surface` background, `border` hairline, no drop shadow beyond a very soft 1–2px — flat and quiet, the stamp/status color is what should draw the eye, not card elevation.
- **Buttons:** primary = `ink` background / `paper` text (dashboard), `accent` background / `paper` text on the landing page CTA specifically, to differentiate "convert" from "manage."
- **Empty states:** one lucide icon + one direct sentence + the primary action, no illustration. "Nothing kept yet." + `[+ Add your first item]`.
- **Loading state during AI extraction:** a skeleton of the form itself filling in field-by-field, not a generic spinner — it should read as "reading your receipt," not "something is loading."
- **Dark mode:** via `next-themes`, built in the initial pass. Status tokens stay legible in dark mode by lightening, not changing hue.

---

## 8. Copy Voice

- Active voice, plain verbs: "Save item," not "Submit." A button labeled "Save" produces a toast that says "Saved" — same word through the whole flow.
- Errors state what happened and how to fix it, never apologize, never stay vague: "Couldn't read this image — try a clearer photo," not "Something went wrong."
- Empty states are an invitation to act, not a mood.

---

## 9. Quality Floor

Responsive down to mobile width. Visible keyboard focus rings (don't override what Radix/shadcn already gives you). `prefers-reduced-motion` respected everywhere, GSAP included. Contrast-check the status colors against both `paper` and `surface` before shipping — muted amber in particular can read too close to `ink-muted` at small sizes if not checked.
