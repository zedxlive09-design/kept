-- ============================================================
-- Kept — Daily Reminder Cron Schedule (§10)
--
-- Schedules the send-reminders Edge Function to run daily at
-- 7am UTC via pg_cron. The function uses the SERVICE_ROLE_KEY
-- to bypass RLS and access all users' reminders (by design — §10, §11).
--
-- IMPORTANT: Before deploying, replace these placeholders:
--   <project-ref>     → your Supabase project reference
--                       (e.g. abcdefghijklm from your project URL)
--   <service-role-key> → your Supabase service role key
--                        (found in Dashboard → Settings → API)
--
-- pg_cron is enabled by default on Supabase projects (free tier included).
-- The cron job keeps the project "active" to prevent Supabase's
-- inactivity pause (§10).
-- ============================================================

SELECT cron.schedule(
  'send-daily-reminders',
  '0 7 * * *',
  $$ SELECT net.http_post(
       url := 'https://<project-ref>.supabase.co/functions/v1/send-reminders',
       headers := jsonb_build_object(
         'Authorization',
         'Bearer ' || '<service-role-key>'
       )
     ); $$
);