'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Search, Plus, PackageOpen } from 'lucide-react';
import { supabase, type Item, type ItemType, type ItemStatus } from '@/lib/supabase/client';
import { ItemCard } from '@/components/items/ItemCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Escapes PostgREST filter special characters so user input cannot
 * alter the filter logic (injection prevention).
 */
function escapePostgrestFilter(value: string): string {
  return value.replace(/[.,)(*'%\\]/g, '\\$&');
}

const PAGE_SIZE = 20;

type TypeFilter = 'all' | ItemType;
type StatusFilter = 'all' | ItemStatus;

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search: update debouncedSearch after 300ms of inactivity
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchItems = useCallback(async (cursor: { created_at: string; id: string } | null, append: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      let query = supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(PAGE_SIZE + 1); // fetch one extra to know if there are more

      if (cursor) {
        query = query.or(
          `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
        );
      }

      // Type filter
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      // Status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Search filter (client-side on the fetched results for trigram, but we use ilike for MVP)
      if (debouncedSearch.trim()) {
        const safe = escapePostgrestFilter(debouncedSearch.trim());
        query = query.or(`name.ilike.%${safe}%,merchant.ilike.%${safe}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const fetched: Item[] = (data ?? []) as unknown as Item[];
      const more = fetched.length > PAGE_SIZE;
      const page = more ? fetched.slice(0, PAGE_SIZE) : fetched;

      if (append) {
        setItems((prev) => [...prev, ...page]);
      } else {
        setItems(page);
      }
      setHasMore(more);
    } catch {
      // silently handle — items will remain empty
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [typeFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchItems(null, false);
  }, [fetchItems]);

  const handleLoadMore = () => {
    if (items.length === 0) return;
    const last = items[items.length - 1];
    fetchItems({ created_at: last.created_at, id: last.id }, true);
  };

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'purchase', label: 'Purchase' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'bill', label: 'Bill' },
  ];

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'expiring_soon', label: 'Expiring' },
    { value: 'expired', label: 'Expired' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Items</h1>
        <Button asChild size="sm">
          <Link href="/items/new">
            <Plus className="h-4 w-4 mr-1.5" />
            Add
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <label htmlFor="items-search" className="sr-only">Search items</label>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          id="items-search"
          placeholder="Search items..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div role="radiogroup" aria-label="Filter by type" className="flex flex-wrap gap-2 mb-6">
        {typeOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={typeFilter === opt.value}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              typeFilter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
            onClick={() => setTypeFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div role="radiogroup" aria-label="Filter by status" className="flex flex-wrap gap-2 mb-6">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={statusFilter === opt.value}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
            onClick={() => setStatusFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <PackageOpen className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-medium">No items yet</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Add your first purchase, subscription, or bill to start tracking.
          </p>
          <Button asChild>
            <Link href="/items/new">Add item</Link>
          </Button>
        </div>
      )}

      {/* Item list */}
      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}

          {hasMore && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}