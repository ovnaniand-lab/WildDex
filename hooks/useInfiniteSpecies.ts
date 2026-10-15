/**
 * Paginated WildDex species results. A replacement (new filter / refresh)
 * invalidates older requests even when they are still in flight.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchSpeciesPage } from '@/src/api/encyclopedia';
import type { EncyclopediaSpecies, ExploreQuery } from '@/src/api/types';

interface InfiniteState {
  items: EncyclopediaSpecies[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  endOfRecords: boolean;
  totalResults?: number;
  refresh: () => void;
  loadMore: () => void;
}

export function useInfiniteSpecies(query: ExploreQuery): InfiniteState {
  const [items, setItems] = useState<EncyclopediaSpecies[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endOfRecords, setEndOfRecords] = useState(false);
  const [totalResults, setTotalResults] = useState<number | undefined>();

  const nextOffsetRef = useRef<number | null>(0);
  const requestVersionRef = useRef(0);
  const pagingRef = useRef(false);
  const queryKey = JSON.stringify(query);

  const runPage = useCallback(async (offset: number, replace: boolean) => {
    // A replacement must not be blocked by the old category's pending request.
    if (!replace && pagingRef.current) return;
    const version = replace ? ++requestVersionRef.current : requestVersionRef.current;
    pagingRef.current = true;
    if (replace) {
      nextOffsetRef.current = 0;
      setItems([]);
      setError(null);
      setTotalResults(undefined);
      setEndOfRecords(false);
      setLoadingMore(false);
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const page = await fetchSpeciesPage(query, offset);
      if (version !== requestVersionRef.current) return;
      setItems((previous) => {
        const base = replace ? [] : previous;
        const seen = new Set(base.map((species) => species.uid));
        const merged = [...base];
        for (const species of page.items) {
          if (!seen.has(species.uid)) {
            seen.add(species.uid);
            merged.push(species);
          }
        }
        return merged;
      });
      // Honor the provider cursor rather than guessing based on result count.
      nextOffsetRef.current = page.nextOffset;
      setEndOfRecords(page.endOfRecords || page.nextOffset === null);
      setTotalResults(page.totalResults);
    } catch (cause) {
      if (version === requestVersionRef.current) {
        setError(cause instanceof Error ? cause.message : 'Failed to load species.');
      }
    } finally {
      // An old request must never unlock or finish a newer request.
      if (version === requestVersionRef.current) {
        pagingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    }
  // The caller memoizes query via the Explore screen; queryKey captures changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  useEffect(() => {
    void runPage(0, true);
    return () => {
      // Invalidate responses on filter change or unmount before they can update state.
      requestVersionRef.current += 1;
      pagingRef.current = false;
    };
  }, [runPage]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || pagingRef.current || error || endOfRecords) return;
    const nextOffset = nextOffsetRef.current;
    if (nextOffset === null) return;
    void runPage(nextOffset, false);
  }, [loading, loadingMore, error, endOfRecords, runPage]);

  const refresh = useCallback(() => {
    void runPage(0, true);
  }, [runPage]);

  return { items, loading, loadingMore, error, endOfRecords, totalResults, refresh, loadMore };
}
