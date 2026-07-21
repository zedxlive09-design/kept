'use client';

import Link from 'next/link';
import { type Item } from '@/lib/supabase/client';
import { formatDate, formatAmount } from '@/lib/format';
import { StatusStamp } from './StatusStamp';
import { Badge } from '@/components/ui/badge';

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const displayDate =
    item.type === 'purchase'
      ? item.purchase_date
      : item.next_billing_date;

  const amount = formatAmount(item.amount, item.currency);

  return (
    <Link
      href={`/items/detail?id=${item.id}`}
      className="block bg-card border border-border rounded-lg p-4 transition-colors hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-primary truncate">{item.name}</h3>
          {item.merchant && (
            <p className="text-sm text-muted-foreground truncate">{item.merchant}</p>
          )}
        </div>
        <StatusStamp status={item.status} />
      </div>

      <div className="mt-3 flex items-center gap-3 flex-wrap">
        {amount && (
          <span className="font-mono tabular-nums text-sm font-medium">
            {amount}
          </span>
        )}
        {displayDate && (
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {formatDate(displayDate)}
          </span>
        )}
        <Badge variant="secondary" className="text-xs">
          {item.category}
        </Badge>
      </div>
    </Link>
  );
}