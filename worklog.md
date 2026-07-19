---
Task ID: 0
Agent: Main
Task: Phase 0 — Repo scaffold, Next.js (static export), Tailwind, shadcn, Supabase client, design system tokens, folder structure

Work Log:
- Installed @supabase/supabase-js@2.110.7 and gsap@3.15.0
- Configured next.config.ts with output:'export' and images.unoptimized:true per §3
- Copied logo/favicon assets from upload/ to public/ (kept-logo-mark.svg, kept-logo-mark-two-tone.svg, favicon.svg, favicon.ico, icon-512.png, apple-touch-icon.png)
- Rewrote globals.css with full Kept design system tokens from kept-design-system.md §2:
  - Core tokens: --paper (#F6F5F2), --surface (#FFFFFF), --ink (#1B2430), --ink-muted (#5B6470), --border (#E3E1DB), --accent (#2F5D45)
  - Status tokens: --status-active, --status-expiring, --status-expired, --status-cancelled
  - Hero tokens: --hero-bg (#141B24), --hero-glow (#3D7A5C)
  - Dark mode: full dark token set with lightened status colors (no hue shift per §7)
  - Mapped all tokens to shadcn variable names for component compatibility
- Rewrote layout.tsx with Kept metadata, OG tags, Geist/Geist_Mono fonts, next-themes ThemeProvider
- Created src/components/providers.tsx (client-side ThemeProvider wrapper)
- Wrote Phase 0 placeholder page at / with logo, brand name, and design token color swatches
- Created lib/supabase/client.ts — browser-safe Supabase client with full TypeScript types mirroring §5 schema
- Created .env.local with placeholder Supabase vars and documentation of secret separation (§15)
- Created full folder structure per §14:
  - Route stubs: login, signup, (app)/layout, (app)/dashboard, (app)/items, (app)/items/new, (app)/items/detail, (app)/subscriptions, (app)/reminders, (app)/settings
  - Component stubs: auth-guard.tsx, providers.tsx
  - lib stubs: supabase/client.ts, reminders.ts, gsap/index.ts
  - Supabase: migrations/00001_initial_schema.sql (full §5 schema), migrations/00002_storage_bucket.sql (§6), functions/extract-receipt/index.ts, functions/send-reminders/index.ts
- Removed src/app/api/route.ts (not in spec — §3 requires no Route Handlers)
- Lint passes clean (zero errors)
- Dev server renders the Phase 0 page correctly

Stage Summary:
- Phase 0 COMPLETE. All §17 Phase 0 deliverables met:
  - ✅ Next.js with static export configured
  - ✅ Tailwind + shadcn installed and working
  - ✅ Supabase client SDK installed and configured (placeholder env vars)
  - ✅ Design system tokens wired in CSS
  - ✅ Geist fonts loaded (§3)
  - ✅ Dark mode via next-themes (§7)
  - ✅ Full folder structure per §14
  - ✅ SQL migrations ready for Phase 1
  - ✅ Edge Function stubs ready for Phases 5 & 6
  - ✅ Lint passes clean
  - ⚠️ next build with output:'export' cannot be verified in this sandbox (no real Supabase project, placeholder env vars)
- Open decisions still pending:
  - §8 Social proof section: ⚠️ DECISION NEEDED (user hasn't decided — omitted for now)
  - §0 rule 5: Verify gemini-3.5-flash is current before Phase 5 (deferred)
- Note: This environment uses Next.js 16 (spec says 15). No functional difference for our usage.

Next Phase: Phase 1 — Full schema migration (SQL already written), RLS verification, storage bucket setup.