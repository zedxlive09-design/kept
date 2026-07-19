'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bell, BellOff, CheckCircle2 } from 'lucide-react';
import { supabase, type Reminder, type ReminderKind } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ── Types ──────────────────────────────────────────────────────

interface ReminderWithItem extends Reminder {
  item_name: string;
}

// ── Helpers ────────────────────────────────────────────────────

const KIND_LABELS: Record<ReminderKind, string> = {
  warranty_expiry: 'Warranty',
  subscription_renewal: 'Renewal',
  bill_due: 'Bill due',
};

const KIND_VARIANTS: Record<
  ReminderKind,
  'outline' | 'secondary' | 'destructive'
> = {
  warranty_expiry: 'outline',
  subscription_renewal: 'secondary',
  bill_due: 'destructive',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getRelativeTime(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `in ${diffDays} days`;
  if (diffDays > 7 && diffDays <= 30) return `in ${Math.ceil(diffDays / 7)} weeks`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  return `in ${diffDays} days`;
}

/**
 * Determine urgency color class for an unsent reminder.
 * - Today or past: red (expired status color)
 * - This week: amber (expiring status color)
 * - Later: default/muted
 */
function getUrgencyClass(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) return 'text-[var(--status-expired)]';
  if (diffDays <= 7) return 'text-[var(--status-expiring)]';
  return 'text-muted-foreground';
}

// ── Skeleton rows ──────────────────────────────────────────────

function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-3 px-1">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Skeleton className="h-4 w-28 shrink-0" />
            <Skeleton className="h-5 w-16 shrink-0" />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Upcoming reminder row ──────────────────────────────────────

function UpcomingRow({ reminder }: { reminder: ReminderWithItem }) {
  const urgencyClass = getUrgencyClass(reminder.remind_on);

  return (
    <Link
      href={`/items/detail?id=${reminder.item_id}`}
      className="flex items-center justify-between py-3 px-1 transition-colors hover:bg-accent/5 -mx-1 px-1 rounded"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-sm font-medium text-primary truncate">
          {reminder.item_name}
        </span>
        <Badge variant={KIND_VARIANTS[reminder.kind]} className="shrink-0">
          {KIND_LABELS[reminder.kind]}
        </Badge>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <span className="text-sm font-mono tabular-nums">{formatDate(reminder.remind_on)}</span>
        <span className={`text-xs font-mono tabular-nums w-20 text-right ${urgencyClass}`}>
          {getRelativeTime(reminder.remind_on)}
        </span>
      </div>
    </Link>
  );
}

// ── Past reminder row ──────────────────────────────────────────

function PastRow({ reminder }: { reminder: ReminderWithItem }) {
  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-sm text-primary truncate">
          {reminder.item_name}
        </span>
        <Badge variant="outline" className="shrink-0">
          {KIND_LABELS[reminder.kind]}
        </Badge>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <span className="text-sm font-mono tabular-nums text-muted-foreground">
          {formatDate(reminder.remind_on)}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground w-20 justify-end">
          <CheckCircle2 className="h-3 w-3" />
          <span className="font-mono tabular-nums">
            {reminder.sent_at
              ? new Date(reminder.sent_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : '—'}
          </span>
        </span>
      </div>
    </div>
  );
}

// ── Page component ─────────────────────────────────────────────

export default function RemindersPage() {
  const [upcoming, setUpcoming] = useState<ReminderWithItem[]>([]);
  const [past, setPast] = useState<ReminderWithItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch unsent (upcoming) reminders joined with item name
      const { data: upcomingData } = await supabase
        .from('reminders')
        .select('*, items!inner(name)')
        .eq('user_id', user.id)
        .eq('sent', false)
        .order('remind_on', { ascending: true });

      const upcomingMapped = (upcomingData ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        item_id: r.item_id as string,
        user_id: r.user_id as string,
        kind: r.kind as ReminderKind,
        remind_on: r.remind_on as string,
        sent: r.sent as boolean,
        sent_at: r.sent_at as string | null,
        created_at: r.created_at as string,
        item_name: ((r.items as Record<string, unknown>).name ?? 'Unknown') as string,
      }));
      setUpcoming(upcomingMapped);

      // Fetch sent (past) reminders joined with item name
      const { data: pastData } = await supabase
        .from('reminders')
        .select('*, items!inner(name)')
        .eq('user_id', user.id)
        .eq('sent', true)
        .order('sent_at', { ascending: false });

      const pastMapped = (pastData ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        item_id: r.item_id as string,
        user_id: r.user_id as string,
        kind: r.kind as ReminderKind,
        remind_on: r.remind_on as string,
        sent: r.sent as boolean,
        sent_at: r.sent_at as string | null,
        created_at: r.created_at as string,
        item_name: ((r.items as Record<string, unknown>).name ?? 'Unknown') as string,
      }));
      setPast(pastMapped);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold mb-6">Reminders</h1>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Upcoming
            {!loading && upcoming.length > 0 && (
              <span className="ml-0.5 text-xs font-mono tabular-nums">
                {upcoming.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-1.5">
            <BellOff className="h-3.5 w-3.5" />
            Past
          </TabsTrigger>
        </TabsList>

        {/* ── Upcoming tab ──────────────────────────────────── */}
        <TabsContent value="upcoming">
          {loading ? (
            <div className="pt-2">
              <SkeletonRows count={5} />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Bell className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                No upcoming reminders. You&apos;re all set.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border pt-2 max-h-[32rem] overflow-y-auto">
              {upcoming.map((r) => (
                <UpcomingRow key={r.id} reminder={r} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Past tab ──────────────────────────────────────── */}
        <TabsContent value="past">
          {loading ? (
            <div className="pt-2">
              <SkeletonRows count={5} />
            </div>
          ) : past.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <BellOff className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                No reminder history yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border pt-2 max-h-[32rem] overflow-y-auto">
              {past.map((r) => (
                <PastRow key={r.id} reminder={r} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}