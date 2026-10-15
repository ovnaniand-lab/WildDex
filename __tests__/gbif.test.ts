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
import { searchSpecies } from '../src/api/gbif';

beforeEach(() => getJson.mockReset());
describe('GBIF source category checks', () => {
  it('rejects a bird returned for Fish and retains a genuine ray-finned fish', async () => {
    getJson.mockResolvedValue({
      results: [
        { key: 10, rank: 'SPECIES', canonicalName: 'Gadus morhua', class: 'Actinopterygii', kingdom: 'Animalia' },
        { key: 11, rank: 'SPECIES', canonicalName: 'Corvus corax', class: 'Aves', kingdom: 'Animalia' },
      ], offset: 0, limit: 20, count: 2, endOfRecords: true,
    });
    const page = await searchSpecies({ category: 'fish', text: 'fish', pageSize: 20 }, 0);
    expect(page.items.map((s) => s.scientificName)).toEqual(['Gadus morhua']);
  });

  it('preserves offset and requested category on later pages', async () => {
    getJson.mockResolvedValue({ results: [], offset: 20, limit: 20, count: 50, endOfRecords: false });
    const page = await searchSpecies({ category: 'birds', text: 'raven', pageSize: 20 }, 20);
    const url = new URL(getJson.mock.calls[0][0]);
    expect(url.searchParams.get('offset')).toBe('20');
    expect(url.searchParams.get('q')).toBe('raven');
    expect(page.nextOffset).toBe(40);
  });
});
