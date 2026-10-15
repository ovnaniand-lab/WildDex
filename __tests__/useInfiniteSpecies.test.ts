// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const fetchSpeciesPage = vi.hoisted(() => vi.fn());
vi.mock('../src/api/encyclopedia', () => ({ fetchSpeciesPage }));

import { useInfiniteSpecies } from '../hooks/useInfiniteSpecies';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

const mammal = { uid: 'inat:1', scientificName: 'Vulpes vulpes' } as never;
const bird = { uid: 'inat:2', scientificName: 'Corvus corax' } as never;
const secondBird = { uid: 'inat:3', scientificName: 'Pica pica' } as never;
const page = (items: unknown[], nextOffset: number | null) => ({ items, nextOffset, endOfRecords: nextOffset === null, totalResults: 3 });

afterEach(() => { fetchSpeciesPage.mockReset(); });

describe('useInfiniteSpecies', () => {
  it('starts a new category request even while the previous category is loading and ignores late results', async () => {
    const slowMammals = deferred<ReturnType<typeof page>>();
    const fastBirds = deferred<ReturnType<typeof page>>();
    fetchSpeciesPage.mockImplementation(({ category }: { category: string }) =>
      category === 'mammals' ? slowMammals.promise : fastBirds.promise);

    const { result, rerender } = renderHook(
      ({ category }: { category: 'mammals' | 'birds' }) => useInfiniteSpecies({ category, pageSize: 20 }),
      { initialProps: { category: 'mammals' } },
    );
    expect(fetchSpeciesPage).toHaveBeenCalledTimes(1);

    rerender({ category: 'birds' });
    expect(fetchSpeciesPage).toHaveBeenCalledTimes(2);

    await act(async () => { fastBirds.resolve(page([bird], null)); await fastBirds.promise; });
    await waitFor(() => expect(result.current.items.map((x) => x.uid)).toEqual(['inat:2']));

    await act(async () => { slowMammals.resolve(page([mammal], null)); await slowMammals.promise; });
    expect(result.current.items.map((x) => x.uid)).toEqual(['inat:2']);
    expect(result.current.loading).toBe(false);
  });

  it('uses the provider nextOffset and deduplicates repeated species', async () => {
    fetchSpeciesPage.mockResolvedValueOnce(page([bird], 40))
      .mockResolvedValueOnce(page([bird, secondBird], null));
    const { result } = renderHook(() => useInfiniteSpecies({ category: 'birds', pageSize: 20 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => { result.current.loadMore(); });
    await waitFor(() => expect(result.current.endOfRecords).toBe(true));
    expect(fetchSpeciesPage.mock.calls[1][1]).toBe(40);
    expect(result.current.items.map((x) => x.uid)).toEqual(['inat:2', 'inat:3']);
  });

  it('refreshes even when a previous request has not finished', async () => {
    const first = deferred<ReturnType<typeof page>>();
    fetchSpeciesPage.mockReturnValueOnce(first.promise).mockResolvedValueOnce(page([bird], null));
    const { result } = renderHook(() => useInfiniteSpecies({ category: 'birds' }));
    act(() => { result.current.refresh(); });
    await waitFor(() => expect(result.current.items.map((x) => x.uid)).toEqual(['inat:2']));
    await act(async () => { first.resolve(page([mammal], null)); await first.promise; });
    expect(result.current.items.map((x) => x.uid)).toEqual(['inat:2']);
  });
});
