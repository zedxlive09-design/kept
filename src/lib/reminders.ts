/**
 * Kept — Reminder Sync Logic (Phase 6)
 *
 * Generates and regenerates reminders for an item after create or update.
 * See §10 for the full spec.
 *
 * Key rules:
 * - Clears only UNSSENT future reminders before regenerating (sent = audit trail)
 * - Warranty: reminders at 30 and 7 days before expiry
 * - Subscription/Bill: reminder at 3 days before next billing date
 * - Subscription rollover handled by the send-reminders Edge Function
 */

// Phase 6: syncRemindersForItem(), subDays(), todayISO()