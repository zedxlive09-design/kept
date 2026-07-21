# Phase 6 — Reminders System

**Task ID:** 6
**Agent:** Phase 6 Reminders Agent

## Files Created/Updated

### 1. `supabase/functions/send-reminders/index.ts` (REPLACED stub)
Full Deno Edge Function implementing §10:

- **Service role client:** Creates Supabase client with `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS (by design — §10, §11)
- **Query due reminders:** Fetches all unsent reminders joined with profiles (timezone, email_reminders_enabled, display_name) and items (name, type) via inner joins
- **Timezone-aware filtering:** Filters reminders where `remind_on <= user's local today date` (replicating the SQL `now() AT TIME ZONE p.timezone` in JS)
- **Group by user:** Groups all due reminders by `user_id` for batch email processing
- **One email per user:** For each user with `email_reminders_enabled = true`:
  - Looks up email from `auth.users` via `supabase.auth.admin.getUserById()`
  - Composes plain text email listing all due items: name, kind label, date formatted in user's timezone
  - Subject: "Kept: X item(s) need your attention"
  - Sends via Resend API (`POST https://api.resend.com/emails`)
- **Mark sent:** Updates all processed reminders to `sent=true, sent_at=now()` in batches of 100
- **Subscription rollover (§10):**
  - Queries subscription/bill items where `next_billing_date < today` and status != 'cancelled'
  - Advances `next_billing_date` by billing_cycle (weekly: +7d, monthly: +1mo, yearly: +1yr)
  - Resets status to 'active' if it was 'expiring_soon'
  - Generates next cycle's reminder (same 3-day-before logic as `syncRemindersForItem`)
- **Graceful degradation:** If `RESEND_API_KEY` is unset, marks reminders as sent without sending. If email lookup fails, skips that user.

### 2. `supabase/migrations/00003_daily_cron.sql` (NEW)
- pg_cron schedule: `'send-daily-reminders'` at `'0 7 * * *'` (7am UTC daily)
- Calls the Edge Function via `net.http_post` with service role authorization
- Includes deployment comments explaining the `<project-ref>` and `<service-role-key>` placeholders

### 3. `src/app/(app)/reminders/page.tsx` (REPLACED stub)
Full reminders center page per §9.6:

- **Two tabs** using shadcn `Tabs`: "Upcoming" and "Past"
- **Upcoming tab:**
  - Fetches unsent reminders joined with item name via `reminders!inner(items(name))`
  - Ordered by `remind_on` ascending
  - Each row: item name (linked to `/items/detail?id=`), kind badge (Warranty/Renewal/Bill due with variant coloring), `remind_on` date (font-mono tabular-nums), relative time string ("Today", "Tomorrow", "in 3 days", etc.)
  - Color-coded urgency: today/past = `var(--status-expired)` red, this week = `var(--status-expiring)` amber, later = muted
  - Hover state with accent/5 background
- **Past tab:**
  - Fetches sent reminders, ordered by `sent_at` descending
  - Each row: item name, kind badge, remind_on date, sent_at date with CheckCircle2 icon and "Sent" label
  - Non-clickable (past history, no link)
- **Empty states:**
  - Upcoming: Bell icon + "No upcoming reminders. You're all set."
  - Past: BellOff icon + "No reminder history yet."
- **Loading:** Skeleton rows matching the row layout (name skeleton, badge skeleton, date skeletons)
- **Scroll:** Both tabs use `max-h-[32rem] overflow-y-auto` with `divide-y divide-border` separators
- **Badge count:** Upcoming tab trigger shows count badge when items exist

## Design Rules Followed
- ✅ Zero purple anywhere
- ✅ Design tokens (CSS vars) used throughout
- ✅ `font-mono tabular-nums` on all dates
- ✅ Clean list layout with `divide-y divide-border` separators
- ✅ Mobile-first responsive
- ✅ shadcn Tabs, Badge, Skeleton components used
- ✅ Lint passes clean (zero errors)

## Lint Result
```
$ eslint .
(no output — zero errors)
```