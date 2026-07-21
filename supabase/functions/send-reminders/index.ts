/**
 * Kept — Supabase Edge Function: send-reminders (Phase 6, §10)
 *
 * Deno runtime. Triggered daily by pg_cron at 7am UTC:
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
 * Uses SERVICE ROLE key — bypasses RLS by design (§10, §11).
 * Secret set via: supabase secrets set RESEND_API_KEY=...
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Types ──────────────────────────────────────────────────────

interface DueReminder {
  id: string;
  item_id: string;
  user_id: string;
  kind: "warranty_expiry" | "subscription_renewal" | "bill_due";
  remind_on: string;
  timezone: string;
  email_reminders_enabled: boolean;
  display_name: string | null;
  item_name: string;
  item_type: string;
}

interface RolledOverItem {
  item_id: string;
  user_id: string;
  item_type: string;
  billing_cycle: string;
  old_next_billing_date: string;
  new_next_billing_date: string;
  status: string;
}

// ── Helpers ────────────────────────────────────────────────────

const KIND_LABELS: Record<string, string> = {
  warranty_expiry: "Warranty expiring",
  subscription_renewal: "Subscription renewal",
  bill_due: "Bill due",
};

function addInterval(dateStr: string, cycle: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  switch (cycle) {
    case "weekly":
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case "monthly":
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case "yearly":
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
    default:
      return dateStr;
  }
  return d.toISOString().split("T")[0];
}

function formatDateInTimezone(dateStr: string, tz: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    timeZone: tz,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Main handler ───────────────────────────────────────────────

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const todayUTC = new Date().toISOString().split("T")[0];

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysFromNowStr = sevenDaysFromNow.toISOString().split("T")[0];

  // ── Step 1: Query due, unsent reminders joined with profiles ──
  const { data: reminders, error: qErr } = await supabase
    .from("reminders")
    .select(
      `
      id,
      item_id,
      user_id,
      kind,
      remind_on,
      profiles!inner (
        timezone,
        email_reminders_enabled,
        display_name
      ),
      items!inner (
        name,
        type
      )
    `
    )
    .eq("sent", false)
    .lte("remind_on", sevenDaysFromNowStr);

  if (qErr) {
    console.error("Failed to query reminders:", qErr);
    return new Response(JSON.stringify({ error: "Query failed" }), {
      status: 500,
    });
  }

  // Filter to due reminders using each user's timezone
  // In SQL this would be: remind_on <= (now() AT TIME ZONE p.timezone)::date
  // Here we replicate in JS since the join is already done
  const dueReminders: DueReminder[] = (reminders ?? [])
    .map((r: Record<string, unknown>) => ({
      id: r.id as string,
      item_id: r.item_id as string,
      user_id: r.user_id as string,
      kind: r.kind as DueReminder["kind"],
      remind_on: r.remind_on as string,
      timezone: (r.profiles as Record<string, unknown>).timezone as string,
      email_reminders_enabled: (r.profiles as Record<string, unknown>)
        .email_reminders_enabled as boolean,
      display_name: (r.profiles as Record<string, unknown>).display_name as
        | string
        | null,
      item_name: (r.items as Record<string, unknown>).name as string,
      item_type: (r.items as Record<string, unknown>).type as string,
    }))
    .filter((r) => {
      // Get the user's local date today
      const now = new Date();
      const localDate = new Date(
        now.toLocaleString("en-US", { timeZone: r.timezone })
      );
      const localToday = localDate.toISOString().split("T")[0];
      return r.remind_on <= localToday;
    });

  // ── Step 2: Group by user_id ─────────────────────────────────
  const byUser = new Map<string, DueReminder[]>();
  for (const r of dueReminders) {
    const existing = byUser.get(r.user_id) ?? [];
    existing.push(r);
    byUser.set(r.user_id, existing);
  }

  // ── Step 3: Send one email per user ──────────────────────────
  const sentIds: string[] = [];

  for (const [userId, userReminders] of byUser) {
    const first = userReminders[0];
    if (!first.email_reminders_enabled) {
      // Mark as sent even if email is disabled — they opted out of email,
      // but the reminder still counts as "processed"
      sentIds.push(...userReminders.map((r) => r.id));
      continue;
    }

    if (!resendApiKey) {
      console.warn(
        "RESEND_API_KEY not set — skipping email send, still marking reminders as sent"
      );
      sentIds.push(...userReminders.map((r) => r.id));
      continue;
    }

    // Look up the user's email from auth.users
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const userEmail = userData?.user?.email;
    if (!userEmail) {
      console.warn(`No email found for user ${userId}, skipping`);
      sentIds.push(...userReminders.map((r) => r.id));
      continue;
    }

    const displayName = first.display_name ?? "there";
    const count = userReminders.length;

    // Build email body
    const lines = userReminders.map((r) => {
      const kindLabel = KIND_LABELS[r.kind] ?? r.kind;
      const dateStr = formatDateInTimezone(r.remind_on, r.timezone);
      return `• ${r.item_name} — ${kindLabel} — ${dateStr}`;
    });

    const body = `Hi ${displayName},\n\nYou have ${count} item${count === 1 ? "" : "s"} that need${count === 1 ? "s" : ""} your attention:\n\n${lines.join("\n")}\n\nOpen Kept to review your items.\n\n— Kept`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kept <noreply@kept.app>",
        to: userEmail,
        subject: `Kept: ${count} item${count === 1 ? "" : "s"} need${count === 1 ? "s" : ""} your attention`,
        text: body,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error(`Resend API error for ${userId}:`, emailRes.status, errBody);
      // Don't mark as sent if email failed — retry next day
      continue;
    }

    sentIds.push(...userReminders.map((r) => r.id));
  }

  // ── Step 4: Mark sent ────────────────────────────────────────
  if (sentIds.length > 0) {
    // Supabase JS doesn't support IN natively for arrays of UUIDs well,
    // so we batch in groups of 100
    const BATCH_SIZE = 100;
    for (let i = 0; i < sentIds.length; i += BATCH_SIZE) {
      const batch = sentIds.slice(i, i + BATCH_SIZE);
      await supabase
        .from("reminders")
        .update({ sent: true, sent_at: new Date().toISOString() })
        .in("id", batch);
    }
  }

  // ── Step 5: Subscription rollover ────────────────────────────
  // Find subscription/bill items where next_billing_date < today
  const { data: overdueItems, error: rolloverQErr } = await supabase
    .from("items")
    .select("id, user_id, type, billing_cycle, next_billing_date, status")
    .in("type", ["subscription", "bill"])
    .lt("next_billing_date", todayUTC)
    .neq("status", "cancelled");

  if (rolloverQErr) {
    console.error("Failed to query overdue subscriptions:", rolloverQErr);
  }

  if (overdueItems && overdueItems.length > 0) {
    const rolledOver: RolledOverItem[] = [];

    for (const item of overdueItems) {
      const i = item as Record<string, unknown>;
      const cycle = i.billing_cycle as string;
      const oldNext = i.next_billing_date as string;
      const newNext = addInterval(oldNext, cycle);

      // Update the item's next_billing_date
      const updatePayload: Record<string, unknown> = {
        next_billing_date: newNext,
      };
      // Reset status to active if it was expiring_soon
      if (i.status === "expiring_soon") {
        updatePayload.status = "active";
      }

      const { error: updateErr } = await supabase
        .from("items")
        .update(updatePayload)
        .eq("id", i.id);

      if (updateErr) {
        console.error(`Failed to roll over item ${i.id}:`, updateErr);
        continue;
      }

      rolledOver.push({
        item_id: i.id as string,
        user_id: i.user_id as string,
        item_type: i.type as string,
        billing_cycle: cycle,
        old_next_billing_date: oldNext,
        new_next_billing_date: newNext,
        status: i.status as string,
      });
    }

    // Regenerate reminders for rolled-over items (same logic as syncRemindersForItem)
    // Inline here because Edge Functions can't import from the Next.js app
    const RENEWAL_WINDOW_DAYS = 3;

    for (const item of rolledOver) {
      const kind: "subscription_renewal" | "bill_due" =
        item.item_type === "subscription"
          ? "subscription_renewal"
          : "bill_due";

      // Calculate new remind_on: new_next_billing_date - 3 days
      const d = new Date(item.new_next_billing_date + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() - RENEWAL_WINDOW_DAYS);
      const remindOn = d.toISOString().split("T")[0];

      // Only create if it's in the future
      if (remindOn >= todayUTC) {
        const { error: upsertErr } = await supabase
          .from("reminders")
          .upsert(
            {
              item_id: item.item_id,
              user_id: item.user_id,
              kind,
              remind_on: remindOn,
            },
            { onConflict: "item_id,kind,remind_on" }
          );

        if (upsertErr) {
          console.error(
            `Failed to create rollover reminder for ${item.item_id}:`,
            upsertErr
          );
        }
      }
    }
  }

  // ── Step 6: Auto-update item statuses ───────────────────────
  // Transition active → expiring_soon → expired based on date thresholds.
  // Uses a single RPC that runs three targeted UPDATE statements.
  await supabase.rpc('update_item_statuses');

  // ── Response ─────────────────────────────────────────────────
  return new Response(
    JSON.stringify({
      ok: true,
      reminders_sent: sentIds.length,
      users_processed: byUser.size,
      rollovers: overdueItems?.length ?? 0,
    }),
    {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }
  );
});