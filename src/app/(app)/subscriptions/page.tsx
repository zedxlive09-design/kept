'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CreditCard, PackageOpen } from 'lucide-react';
import { supabase, type Item } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusStamp } from '@/components/items/StatusStamp';

import { formatDate, formatAmount } from '@/lib/format';

export default function SubscriptionsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'subscription')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setItems((data ?? []) as unknown as Item[]);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Monthly equivalent total: yearly ÷ 12, monthly as-is, weekly × 4.33
  const monthlyTotal = items.reduce((sum, item) => {
    if (item.status === 'cancelled' || item.amount == null) return sum;
    const amt = item.amount;
    switch (item.billing_cycle) {
      case 'yearly': return sum + amt / 12;
      case 'monthly': return sum + amt;
      case 'weekly': return sum + amt * 4.33;
      default: return sum;
    }
  }, 0);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <Skeleton className="h-7 w-36" />
        {/* Monthly total card */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        {/* Subscription list skeletons */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold mb-6">Subscriptions</h1>

      {/* Monthly total card */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <CreditCard className="h-4 w-4" />
          <span className="text-sm">Monthly total</span>
        </div>
        <p className="text-2xl font-semibold font-mono tabular-nums">
          {formatAmount(monthlyTotal)}
        </p>
      </div>

      {/* Subscription list */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <PackageOpen className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No subscriptions tracked yet.</p>
          <Button asChild>
            <Link href="/items/new">Add a subscription</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/items/detail?id=${item.id}`}
              className="block bg-card border border-border rounded-lg p-4 transition-colors hover:bg-accent/5"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <h3 className="font-medium text-primary truncate">{item.name}</h3>
                  {item.merchant && (
                    <p className="text-sm text-muted-foreground truncate">{item.merchant}</p>
                  )}
                </div>
                <StatusStamp status={item.status} />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono tabular-nums text-sm font-medium">
                  {formatAmount(item.amount, item.currency)}
                </span>
                {item.billing_cycle && (
                  <span className="text-xs text-muted-foreground capitalize">{item.billing_cycle}</span>
                )}
                <span className="text-xs text-muted-foreground font-mono tabular-nums">
                  Next: {formatDate(item.next_billing_date)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}