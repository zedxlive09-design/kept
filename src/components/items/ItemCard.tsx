'use client';

import Link from 'next/link';
import { type Item, type ItemStatus } from '@/lib/supabase/client';
import { formatDate, formatAmount } from '@/lib/format';
import { StatusStamp } from './StatusStamp';
import { Badge } from '@/components/ui/badge';

interface ItemCardProps {
  item: Item;
}

const STATUS_CSS_VAR: Record<ItemStatus, string> = {
  active: 'status-active',
  expiring_soon: 'status-expiring',
  expired: 'status-expired',
  cancelled: 'status-cancelled',
};

export function ItemCard({ item }: ItemCardProps) {
  const displayDate =
    item.type === 'purchase'
      ? item.purchase_date
      : item.next_billing_date;

  const amount = formatAmount(item.amount, item.currency);
  const borderColor = `var(--${STATUS_CSS_VAR[item.status]})`;

  return (
    <Link
      href={`/items/detail?id=${item.id}`}
      className="block bg-card border border-border border-l-4 rounded-lg p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      style={{ borderLeftColor: borderColor }}
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
          <span className="font-mono tabular-nums text-sm font-semibold">
            {amount}
          </span>
        )}
        {displayDate && (
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {formatDate(displayDate)}
          </span>
        )}
        <Badge variant="secondary" className="text-xs bg-muted">
          {item.category}
        </Badge>
      </div>
    </Link>
  );
}