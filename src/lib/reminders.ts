/**
 * Kept — Reminder Sync Logic (§10)
 *
 * Generates and regenerates reminders for an item after create or update.
 *
 * Key rules:
 * - Clears only UNSSENT future reminders before regenerating (sent = audit trail)
 * - Warranty: reminders at 30 and 7 days before expiry
 * - Subscription/Bill: reminder at 3 days before next billing date
 * - Subscription rollover handled by the send-reminders Edge Function
 */

import { supabase, type Item } from './supabase/client';

const WARRANTY_WINDOWS_DAYS = [30, 7];
const RENEWAL_WINDOW_DAYS = 3;

function subDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export async function syncRemindersForItem(
  supabaseClient: typeof supabase,
  item: Item
) {
  // Clear only unsent future reminders for this item
  await supabaseClient
    .from('reminders')
    .delete()
    .eq('item_id', item.id)
    .eq('sent', false);

  const rows: {
    item_id: string;
    user_id: string;
    kind: 'warranty_expiry' | 'subscription_renewal' | 'bill_due';
    remind_on: string;
  }[] = [];

  if (item.type === 'purchase' && item.warranty_expiry) {
    for (const days of WARRANTY_WINDOWS_DAYS) {
      rows.push({
        item_id: item.id,
        user_id: item.user_id,
        kind: 'warranty_expiry',
        remind_on: subDays(item.warranty_expiry, days),
      });
    }
  }

  if (
    (item.type === 'subscription' || item.type === 'bill') &&
    item.next_billing_date
  ) {
    rows.push({
      item_id: item.id,
      user_id: item.user_id,
      kind:
        item.type === 'subscription' ? 'subscription_renewal' : 'bill_due',
      remind_on: subDays(item.next_billing_date, RENEWAL_WINDOW_DAYS),
    });
  }

  const future = rows.filter((r) => r.remind_on >= todayISO());
  if (future.length) {
    await supabaseClient
      .from('reminders')
      .upsert(future, { onConflict: 'item_id,kind,remind_on' });
  }
}