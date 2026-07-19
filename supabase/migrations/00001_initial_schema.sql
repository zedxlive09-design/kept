-- ============================================================
-- Kept — Database Schema (§5)
-- ============================================================
-- This migration creates the full schema: enums, profiles, items,
-- reminders, indexes, RLS policies, and the profile auto-creation trigger.
--
-- Apply via Supabase Dashboard → SQL Editor, or:
--   supabase migration new initial-schema
--   (paste this into the generated file)
--   supabase db push
-- ============================================================

-- ENUMS
create type item_type as enum ('purchase', 'subscription', 'bill');
create type item_status as enum ('active', 'expiring_soon', 'expired', 'cancelled');
create type reminder_kind as enum ('warranty_expiry', 'subscription_renewal', 'bill_due');

-- ============================================================
-- PROFILES — §5: timezone-correct reminders need each user's
-- IANA timezone; Settings needs an email opt-in toggle.
-- Auto-created on signup so it's never missing.
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'UTC',
  email_reminders_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- ITEMS — the core table. One table with a type discriminator,
-- not three separate tables. See §5 for the full rationale.
-- ============================================================
create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type item_type not null,
  status item_status not null default 'active',

  name text not null,
  merchant text,
  category text not null default 'other',

  amount numeric(12,2),
  currency text not null default 'USD',

  purchase_date date,
  warranty_months smallint,
  warranty_expiry date,

  billing_cycle text,
  next_billing_date date,

  notes text,
  receipt_image_path text,
  ai_extracted jsonb,
  is_ai_extracted boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_purchase_fields check (
    type <> 'purchase' or purchase_date is not null
  ),
  constraint chk_subscription_fields check (
    type not in ('subscription','bill') or (billing_cycle is not null and next_billing_date is not null)
  )
);

create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- ============================================================
-- REMINDERS — generated in application code (§10), not a DB
-- trigger, to keep scheduling logic in one language.
-- ============================================================
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind reminder_kind not null,
  remind_on date not null,
  sent boolean not null default false,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (item_id, kind, remind_on)
);

-- ============================================================
-- INDEXES — §12 rationale
-- ============================================================
create index idx_items_user_id        on public.items (user_id);
create index idx_items_user_status    on public.items (user_id, status);
create index idx_items_user_type      on public.items (user_id, type);
create index idx_items_warranty_exp   on public.items (warranty_expiry) where type = 'purchase';
create index idx_items_next_billing   on public.items (next_billing_date) where type in ('subscription','bill');
create index idx_reminders_due        on public.reminders (remind_on) where sent = false;
create index idx_reminders_user       on public.reminders (user_id);

create extension if not exists pg_trgm;
create index idx_items_name_trgm      on public.items using gin (name gin_trgm_ops);
create index idx_items_merchant_trgm  on public.items using gin (merchant gin_trgm_ops);

-- ============================================================
-- ROW LEVEL SECURITY — the only authorization layer (§5, §11)
-- (select auth.uid()) caches once per statement, not per row.
-- ============================================================
alter table public.profiles  enable row level security;
alter table public.items     enable row level security;
alter table public.reminders enable row level security;

create policy "profiles_select_own" on public.profiles for select using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles for update using (id = (select auth.uid()));

create policy "items_select_own" on public.items for select using (user_id = (select auth.uid()));
create policy "items_insert_own" on public.items for insert with check (user_id = (select auth.uid()));
create policy "items_update_own" on public.items for update using (user_id = (select auth.uid()));
create policy "items_delete_own" on public.items for delete using (user_id = (select auth.uid()));

create policy "reminders_select_own" on public.reminders for select using (user_id = (select auth.uid()));
create policy "reminders_insert_own" on public.reminders for insert with check (user_id = (select auth.uid()));
create policy "reminders_update_own" on public.reminders for update using (user_id = (select auth.uid()));
create policy "reminders_delete_own" on public.reminders for delete using (user_id = (select auth.uid()));

-- ============================================================
-- DASHBOARD RPC — §12: one round trip, not four
-- ============================================================
create or replace function public.get_dashboard_summary()
returns table (
  active_count bigint, expiring_soon_count bigint, expired_count bigint,
  subscription_monthly_total numeric, next_reminder_date date
)
language sql security invoker as $$
  select
    count(*) filter (where status = 'active'),
    count(*) filter (where status = 'expiring_soon'),
    count(*) filter (where status = 'expired'),
    coalesce(sum(amount) filter (where type = 'subscription' and billing_cycle = 'monthly' and status != 'cancelled'), 0),
    (select min(remind_on) from public.reminders r where r.user_id = auth.uid() and r.sent = false)
  from public.items where user_id = auth.uid();
$$;