import { beforeEach, describe, expect, it, vi } from 'vitest';

const getJson = vi.hoisted(() => vi.fn());
vi.mock('../src/api/http', () => ({
  getJson,
  withParams: (base: string, params: Record<string, string | number | undefined>) => {
    const url = new URL(base);
    Object.entries(params).forEach(([key, value]) => { if (value !== undefined) url.searchParams.set(key, String(value)); });
    return url.toString();
  },
}));

import { searchSpecies } from '../src/api/inaturalist';

const fox = { id: 1, name: 'Vulpes vulpes', rank: 'species', is_active: true, iconic_taxon_id: 40151, ancestor_ids: [40151], default_photo: { id: 2, url: 'https://example.org/square.jpg' } };
const bird = { id: 3, name: 'Corvus corax', rank: 'species', is_active: true, iconic_taxon_id: 3, ancestor_ids: [3] };

beforeEach(() => {
  getJson.mockReset();
});

describe('iNaturalist requests', () => {
  it('sends a mammal filter and rejects a bird even when provider results are mixed', async () => {
    getJson.mockResolvedValue({ results: [fox, bird], page: 1, per_page: 20, total_results: 2 });
    const page = await searchSpecies({ category: 'mammals', pageSize: 20 }, 0);
    const url = new URL(getJson.mock.calls[0][0]);
    expect(url.searchParams.get('taxon_id')).toBe('40151');
    expect(url.searchParams.get('media_type')).toBe('photos');
    expect(page.items.map((s) => s.scientificName)).toEqual(['Vulpes vulpes']);
  });

  it('resolves Finland to a place ID and never quietly falls back to worldwide species', async () => {
  getJson.mockImplementation(async (value: string) => {
    const url = new URL(value);

    if (url.pathname.endsWith('/places/autocomplete')) {
      return {
        results: [{ id: 123, name: 'Finland', place_type: 12 }],
      };
    }

    if (url.pathname.endsWith('/observations/species_counts')) {
      return {
        results: [
          { taxon: fox, count: 9 },
          { taxon: bird, count: 2 },
        ],
        page: 1,
        per_page: 20,
        total_results: 2,
      };
    }

    throw new Error(`Unexpected request: ${value}`);
  });

  const page = await searchSpecies(
    {
      region: { kind: 'country', countryCode: 'FI' },
      category: 'mammals',
      pageSize: 20,
    },
    0
  );

  const requests = getJson.mock.calls
    .filter((call) => typeof call[0] === 'string')
    .map((call) => new URL(call[0]));

  const countCall = requests.find((url) =>
    url.pathname.endsWith('/observations/species_counts')
  );

  expect(countCall).toBeDefined();
  expect(countCall?.searchParams.get('place_id')).toBe('123');
  expect(countCall?.searchParams.get('country_code')).toBeNull();

  expect(page.items.map((s) => s.uid)).toEqual(['inat:1']);
});
    
  it('rejects unknown country places rather than displaying worldwide results', async () => {
    getJson.mockResolvedValue({ results: [], page: 1, per_page: 20, total_results: 0 });
    await expect(searchSpecies({ region: { kind: 'country', countryCode: 'AU' }, pageSize: 20 }, 0)).rejects.toThrow(/country boundary/);
    expect(getJson).toHaveBeenCalledTimes(1);
  });

  it('passes GPS radius and coordinates to the species-count endpoint', async () => {
    getJson.mockResolvedValue({ results: [], page: 1, per_page: 20, total_results: 0 });
    await searchSpecies({ region: { kind: 'nearby', lat: 60.2, lon: 24.9, radiusKm: 15 } }, 0);
    const url = new URL(getJson.mock.calls[0][0]);
    expect(url.searchParams.get('lat')).toBe('60.2');
    expect(url.searchParams.get('lon')).toBe('24.9');
    expect(url.searchParams.get('radius')).toBe('15');
  });

  it('preserves category and advances provider page on pagination', async () => {
    getJson.mockResolvedValue({ results: [fox], page: 2, per_page: 20, total_results: 50 });
    const page = await searchSpecies({ category: 'mammals', pageSize: 20 }, 20);
    const url = new URL(getJson.mock.calls[0][0]);
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('taxon_id')).toBe('40151');
    expect(page.nextOffset).toBe(40);
  });
});
