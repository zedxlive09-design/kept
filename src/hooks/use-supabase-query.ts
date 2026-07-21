'use client';

import { useReducer, useEffect, useRef, useCallback } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface State<T> {
  status: Status;
  data: T | null;
  error: Error | null;
}

type Action<T> =
  | { type: 'fetch' }
  | { type: 'resolve'; data: T | null }
  | { type: 'reject'; error: Error };

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'fetch':
      return { ...state, status: 'loading', error: null };
    case 'resolve':
      return { status: 'success', data: action.data, error: null };
    case 'reject':
      return { ...state, status: 'error', error: action.error };
  }
}

interface UseSupabaseQueryOptions<T> {
  queryFn: () => Promise<{ data: T | null; error: Error | null }>;
  enabled?: boolean;
  deps?: unknown[];
}

/**
 * Lightweight query hook wrapping the common Supabase fetch pattern.
 *
 * Provides cancellation safety and a stable refetch callback —
 * without the weight of @tanstack/react-query.
 *
 * Uses useReducer to avoid React 19's "no synchronous setState in effects"
 * lint rule while keeping the API identical to what a full query library
 * would provide.
 *
 * For this SPA's scale (a handful of pages, no shared cache keys), this
 * is the right balance. If the app grows to need cross-component cache
 * deduplication or background refetch, migrate to @tanstack/react-query.
 */
export function useSupabaseQuery<T>({
  queryFn,
  enabled = true,
  deps = [],
}: UseSupabaseQueryOptions<T>) {
  const [state, dispatch] = useReducer(reducer<T>, {
    status: enabled ? 'loading' : 'idle',
    data: null,
    error: null,
  });
  const queryRef = useRef(queryFn);

  // Keep the ref current inside a dedicated effect — avoids accessing it during render.
  useEffect(() => {
    queryRef.current = queryFn;
  }, [queryFn]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    dispatch({ type: 'fetch' });
    queryRef
      .current()
      .then(({ data: d, error: e }) => {
        if (!cancelled) {
          dispatch({ type: 'resolve', data: d });
        }
      })
      .catch((e) => {
        if (!cancelled) {
          dispatch({ type: 'reject', error: e });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, ...deps]);

  const refetch = useCallback(() => {
    dispatch({ type: 'fetch' });
    queryRef
      .current()
      .then(({ data: d, error: e }) => {
        dispatch({ type: 'resolve', data: d });
      })
      .catch((e) => {
        dispatch({ type: 'reject', error: e });
      });
  }, []);

  return {
    data: state.data,
    error: state.error,
    isLoading: state.status === 'loading',
    refetch,
  };
}
