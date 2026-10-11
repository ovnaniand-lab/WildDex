/**
 * useInfiniteSpecies — paginated hook over the encyclopedia facade.
 *
 * Behaviour:
 *  - resets when the query (text/category/region) changes
 *  - onEndReached paging with a guard against duplicate concurrent requests
 *  - keeps all previously loaded pages while resetting, dedupes by uid so
 *    the same taxon is never shown twice
 *  - surfaces loading / error / retry separately from "loading more"
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchSpeciesPage } from '@/src/api/encyclopedia';
import type { EncyclopediaSpecies, ExploreQuery } from '@/src/api/types';

interface InfiniteState {
  items: EncyclopediaSpecies[];
  loading: boolean; // first page in flight
  loadingMore: boolean; // subsequent page in flight
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

  const offsetRef = useRef(0);
  const requestIdRef = useRef(0);
  const inFlightRef = useRef(false);
  const queryKey = JSON.stringify(query);

  const runPage = useCallback(
    async (offset: number, replace: boolean) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      const id = ++requestIdRef.current;
      replace ? setLoading(true) : setLoadingMore(true);
      if (replace) setError(null);
      try {
        const page = await fetchSpeciesPage(query, offset);
        if (id !== requestIdRef.current) return; // stale response
        setItems((prev) => {
          const base = replace ? [] : prev;
          const seen = new Set(base.map((s) => s.uid));
          const merged = [...base];
          for (const item of page.items) {
            if (!seen.has(item.uid)) {
              seen.add(item.uid);
              merged.push(item);
            }
          }
          return merged;
        });
        offsetRef.current = offset + (page.items.length || (query.pageSize ?? 20));
        setEndOfRecords(page.endOfRecords || page.nextOffset === null);
        setTotalResults(page.totalResults);
      } catch (e) {
        if (id === requestIdRef.current) {
          setError(e instanceof Error ? e.message : 'Failed to load species.');
        }
      } finally {
        if (id === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
        inFlightRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryKey],
  );

  // Reset + load first page whenever the query changes.
  useEffect(() => {
    offsetRef.current = 0;
    setEndOfRecords(false);
    void runPage(0, true);
  }, [runPage]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || error || endOfRecords) return;
    void runPage(offsetRef.current, false);
  }, [loading, loadingMore, error, endOfRecords, runPage]);

  const refresh = useCallback(() => {
    offsetRef.current = 0;
    setEndOfRecords(false);
    void runPage(0, true);
  }, [runPage]);

  return { items, loading, loadingMore, error, endOfRecords, totalResults, refresh, loadMore };
}
