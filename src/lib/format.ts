/**
 * Kept — Shared formatting utilities.
 *
 * Centralized to avoid duplicate implementations across pages and components.
 */

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  // Parse date parts manually to avoid UTC-midnight timezone offset bug.
  // new Date('2025-01-15') parses as UTC midnight, which shifts to the
  // previous day for negative-UTC timezones. Splitting and using the
  // local-time Date constructor avoids this entirely.
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(y, m - 1, d));
}

export function formatAmount(amount: number | null | undefined, currency: string = 'USD'): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency,
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amount);
}