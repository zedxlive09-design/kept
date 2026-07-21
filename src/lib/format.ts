/**
 * Kept — Shared formatting utilities.
 *
 * Centralized to avoid duplicate implementations across pages and components.
 */

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(dateStr));
}

export function formatAmount(amount: number | null | undefined, currency: string = 'USD'): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency,
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amount);
}