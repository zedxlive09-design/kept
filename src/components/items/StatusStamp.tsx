'use client';

import { type ItemStatus } from '@/lib/supabase/client';

const STATUS_LABEL: Record<ItemStatus, string> = {
  active: 'ACTIVE',
  expiring_soon: 'EXPIRING',
  expired: 'EXPIRED',
  cancelled: 'CANCELLED',
};

const STATUS_CSS_VAR: Record<ItemStatus, string> = {
  active: 'status-active',
  expiring_soon: 'status-expiring',
  expired: 'status-expired',
  cancelled: 'status-cancelled',
};

interface StatusStampProps {
  status: ItemStatus;
}

export function StatusStamp({ status }: StatusStampProps) {
  const cssVar = STATUS_CSS_VAR[status];
  const label = STATUS_LABEL[status];

  return (
    <span
      className="inline-flex items-center justify-center rounded-full border-[2px] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest"
      style={{
        color: `var(--${cssVar})`,
        borderColor: `var(--${cssVar})`,
        transform: 'rotate(-4deg)',
        minWidth: '80px',
      }}
    >
      {label}
    </span>
  );
}