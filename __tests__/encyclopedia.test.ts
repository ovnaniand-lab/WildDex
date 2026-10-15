import { beforeEach, describe, expect, it, vi } from 'vitest';
const { inatSearch, gbifSearch } = vi.hoisted(() => ({ inatSearch: vi.fn(), gbifSearch: vi.fn() }));
vi.mock('../src/api/inaturalist', () => ({ searchSpecies: inatSearch }));
vi.mock('../src/api/gbif', () => ({ searchSpecies: gbifSearch }));
vi.mock('../src/api/wikipedia', () => ({ enrichFromWikimedia: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: vi.fn(), setItem: vi.fn() } }));
import { fetchSpeciesPage } from '../src/api/encyclopedia';

const species = (source: 'gbif' | 'inaturalist', id: number, scientificName: string, taxonomy: Record<string, string> = {}) => ({
  uid: `${source === 'gbif' ? 'gbif' : 'inat'}:${id}`,
  source, sourceId: id, commonName: scientificName, scientificName,
  categoryId: 'mammals', photos: [], taxonomy, profileUrl: 'https://example.org',
});
const page = (items: ReturnType<typeof species>[], nextOffset: number | null = null) => ({ items, nextOffset, endOfRecords: nextOffset === null, totalResults: items.length });

beforeEach(() => { inatSearch.mockReset(); gbifSearch.mockReset(); });
describe('Encyclopedia facade', () => {
  it('uses observations only for region-scoped results', async () => {
    inatSearch.mockResolvedValue(page([species('inaturalist', 1, 'Vulpes vulpes')]));
    const q = { category: 'mammals' as const, region: { kind: 'country' as const, countryCode: 'FI' } };
    const result = await fetchSpeciesPage(q, 0);
    expect(result.items).toHaveLength(1);
    expect(inatSearch).toHaveBeenCalledWith(expect.objectContaining({ region: q.region }), 0);
    expect(gbifSearch).not.toHaveBeenCalled();
  });

  it('deduplicates scientific names and discards GBIF taxa outside requested class', async () => {
    inatSearch.mockResolvedValue(page([species('inaturalist', 1, 'Vulpes vulpes')]));
    gbifSearch.mockResolvedValue(page([
      species('gbif', 2, 'Vulpes vulpes', { class: 'Mammalia' }),
      species('gbif', 3, 'Corvus corax', { class: 'Aves' }),
      species('gbif', 4, 'Canis lupus', { class: 'Mammalia' }),
    ]));
    const result = await fetchSpeciesPage({ category: 'mammals', text: 'can', pageSize: 20 }, 0);
    expect(result.items.map((s) => s.scientificName)).toEqual(['Vulpes vulpes', 'Canis lupus']);
  });

  it('does not query GBIF during unfiltered browse without a search term', async () => {
    inatSearch.mockResolvedValue(page([]));
    await fetchSpeciesPage({ category: 'all' }, 0);
    expect(gbifSearch).not.toHaveBeenCalled();
  });
});
