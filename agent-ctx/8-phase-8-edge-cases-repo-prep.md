# Task 8 — Phase 8: Edge Cases, Static Export Sanity, and Repo Prep

## Files Created/Updated

### 1. `src/lib/image-utils.ts` (NEW)
Client-side image handling utilities for §6 and §8 edge cases:
- **convertHeicToJpeg(file)** — Converts HEIC → JPEG using `heic2any`. iPhones default to HEIC which most browsers won't render inline.
- **compressImage(file)** — Compresses to ≤0.5MB, 1600px max dimension using `browser-image-compression`. Raw 4-8MB → 200-400KB (15-20x storage runway).
- **prepareImageForUpload(file)** — Full pipeline: HEIC conversion → compression.
- **getUserTimezone()** — Returns IANA timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`. Used to default profile timezone at signup.
- Handles `heic2any` returning `Blob | Blob[]` union type.

### 2. `src/app/signup/page.tsx` (UPDATED)
Added timezone auto-detection after successful signup:
- Imports `getUserTimezone` from `@/lib/image-utils`
- After `supabase.auth.signUp()` succeeds, calls `supabase.auth.getUser()` to get the new user ID
- Updates `profiles.timezone` with the detected IANA timezone before redirecting to `/dashboard`
- Fire-and-forget pattern — timezone update failure should not block app entry
- The `handle_new_user` trigger creates the profile with default `'UTC'`; this overwrites it immediately

### 3. `.gitignore` (REWRITTEN)
Replaced generic Next.js .gitignore with Kept-specific entries:
- Standard sections: Dependencies, Next.js, Build, Environment, Debug, IDE, OS
- Kept-specific: `supabase/.temp/`, `tool-results/`, `upload/`, `download/`, `db/*.db`, `prisma/`, `*.log`

## Key Decisions
- Both `heic2any` and `browser-image-compression` were already in `package.json` (installed in Phase 0)
- Timezone update uses fire-and-forget — a failed update should never block a new user from entering the app
- Static export sanity check (`next build`) cannot be verified in this sandbox (no real Supabase project, placeholder env vars)

## Verification
- ESLint: zero errors
- Dev server: `/signup` compiles 200