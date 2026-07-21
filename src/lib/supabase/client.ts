/**
 * Kept — Supabase Browser Client (§3, §11, §14)
 *
 * This is the ONLY Supabase client in the app — browser-safe, used everywhere.
 * It reads the public URL and anon key from environment variables that are
 * safe to expose because RLS, not key secrecy, is what protects the data (§11).
 *
 * The client is created in a module-level variable so it's shared across
 * all imports (singleton pattern) rather than re-created on every render.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Lazy-initialized Supabase client.
 *
 * We defer creation (and the env-var guard) to first access so that
 * Turbopack can pre-compile routes that *import* this module (e.g. the
 * app layout) without crashing the dev server when env vars are absent.
 * In production the vars are always present at build time.
 */
let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (_client) return _client;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
  }
  _client = createClient(supabaseUrl, supabaseAnonKey);
  return _client;
}

// Named re-export so existing `import { supabase }` continues to work.
// Uses a getter so every access goes through getClient().
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});

// Type helpers — mirror the SQL schema from §5 for use in application code.
// These are NOT a separate source of truth; the SQL migrations (supabase/migrations/)
// are the canonical schema definition.

export type ItemType = "purchase" | "subscription" | "bill";
export type ItemStatus = "active" | "expiring_soon" | "expired" | "cancelled";
export type ReminderKind = "warranty_expiry" | "subscription_renewal" | "bill_due";

export interface Profile {
  id: string;
  display_name: string | null;
  timezone: string;
  email_reminders_enabled: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  user_id: string;
  type: ItemType;
  status: ItemStatus;
  name: string;
  merchant: string | null;
  category: string;
  amount: number | null;
  currency: string;
  purchase_date: string | null;
  warranty_months: number | null;
  warranty_expiry: string | null;
  billing_cycle: string | null;
  next_billing_date: string | null;
  notes: string | null;
  receipt_image_path: string | null;
  ai_extracted: Record<string, unknown> | null;
  is_ai_extracted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  item_id: string;
  user_id: string;
  kind: ReminderKind;
  remind_on: string;
  sent: boolean;
  sent_at: string | null;
  created_at: string;
}

export interface DashboardSummary {
  active_count: number;
  expiring_soon_count: number;
  expired_count: number;
  subscription_monthly_total: number;
  next_reminder_date: string | null;
}