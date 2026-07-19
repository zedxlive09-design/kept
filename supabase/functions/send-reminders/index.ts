/**
 * Kept — Supabase Edge Function: send-reminders (Phase 6)
 *
 * Deno runtime. Triggered daily by pg_cron (§10):
 *   select cron.schedule(
 *     'send-daily-reminders', '0 7 * * *',
 *     $$ select net.http_post(
 *          url := 'https://<project-ref>.supabase.co/functions/v1/send-reminders',
 *          headers := jsonb_build_object('Authorization', 'Bearer ' || '<service-role-key>')
 *        ); $$
 *   );
 *
 * Logic:
 * 1. Query due, unsent reminders against each user's LOCAL date (not UTC)
 * 2. Group by user, send ONE email per user listing all due items
 * 3. Mark sent rows sent=true, sent_at=now()
 * 4. Subscription rollover: advance next_billing_date by billing_cycle
 *    and regenerate reminders for the next cycle
 *
 * Uses SERVICE ROLE key — bypasses RLS by design (§10).
 * Secret set via: supabase secrets set RESEND_API_KEY=...
 */

// Deno.serve(async (req: Request) => {
//   // Implementation in Phase 6
//   return new Response("Not yet implemented", { status: 501 });
// });