'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle, XCircle, CreditCard, Bell, Plus, PackageOpen, Clock } from 'lucide-react';
import { supabase, type Item, type DashboardSummary, type Reminder } from '@/lib/supabase/client';
import { formatDate } from '@/lib/format';
import { ItemCard } from '@/components/items/ItemCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [upcoming, setUpcoming] = useState<Reminder[]>([]);
  const [recent, setRecent] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Summary via RPC
      const { data: rpcData } = await supabase.rpc('get_dashboard_summary');
      if (rpcData) {
        setSummary(rpcData as unknown as DashboardSummary);
      }

      // Upcoming reminders — next 5 unsent, joined with items for name/type
      const { data: reminderData } = await supabase
        .from('reminders')
        .select('*, items!inner(name, type)')
        .eq('user_id', user.id)
        .eq('sent', false)
        .order('remind_on', { ascending: true })
        .limit(5);
      setUpcoming((reminderData ?? []) as unknown as Reminder[]);

      // Recently added items — last 6
      const { data: itemData } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);
      setRecent((itemData ?? []) as unknown as Item[]);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatMonthly = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const summaryCards = summary
    ? [
        {
          label: 'Active',
          value: summary.active_count,
          icon: ShieldCheck,
          color: 'var(--status-active)' as const,
          textColor: 'text-primary',
        },
        {
          label: 'Expiring soon',
          value: summary.expiring_soon_count,
          icon: AlertTriangle,
          color: 'var(--status-expiring)' as const,
          textColor: 'text-primary',
        },
        {
          label: 'Expired',
          value: summary.expired_count,
          icon: XCircle,
          color: 'var(--status-expired)' as const,
          textColor: 'text-primary',
        },
        {
          label: 'Monthly subs',
          value: formatMonthly(summary.subscription_monthly_total),
          icon: CreditCard,
          color: 'var(--status-active)' as const,
          textColor: 'font-mono tabular-nums',
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  const isEmpty = summary && summary.active_count === 0 && summary.expiring_soon_count === 0 && summary.expired_count === 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Button asChild size="sm">
          <Link href="/items/new">
            <Plus className="h-4 w-4 mr-1.5" />
            Add
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <PackageOpen className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Nothing kept yet. Add your first item to get started.</p>
          <Button asChild>
            <Link href="/items/new">Add your first item</Link>
          </Button>
        </div>
      )}

      {/* Summary cards */}
      {summaryCards.length > 0 && !isEmpty && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="relative bg-card border border-border rounded-lg p-4 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
              >
                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                  style={{ backgroundColor: card.color }}
                />
                <Icon
                  className="h-5 w-5 mb-2"
                  style={{ color: card.color }}
                />
                <p className={`text-2xl font-semibold ${card.textColor}`}>
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Coming up */}
      {!isEmpty && (
        <div className="mb-8">
          <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Coming up
          </h2>
          {upcoming.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground">
              No upcoming reminders.
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
              {upcoming.map((r) => {
                const itemData = (r as unknown as Record<string, unknown>).items as
                  | { name: string; type: string }
                  | undefined;
                return (
                  <Link
                    key={r.id}
                    href={`/items/detail?id=${r.item_id}`}
                    className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm truncate">
                        {itemData?.name ?? r.kind.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize shrink-0">
                        {r.kind.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-sm font-mono tabular-nums text-muted-foreground shrink-0 ml-2">
                      {formatDate(r.remind_on)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recently added */}
      {!isEmpty && (
        <div>
          <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recently added
          </h2>
          {recent.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground">
              No items yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}