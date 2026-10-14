/** WildDex category matching. IDs are provider-specific. */
import type { SpeciesCategoryId } from '@/data/types';

export interface CategoryTaxa { gbifKeys: number[]; inatIds: number[] }

// iNaturalist IDs verified against public taxon pages. Fish is a collection
// of classes, not a single clade (and must never use Chordata as its filter).
export const CATEGORY_TAXA: Record<SpeciesCategoryId, CategoryTaxa> = {
  mammals: { gbifKeys: [], inatIds: [40151] },
  birds: { gbifKeys: [], inatIds: [3] },
  reptiles: { gbifKeys: [], inatIds: [26036] },
  amphibians: { gbifKeys: [], inatIds: [20978] },
  fish: { gbifKeys: [], inatIds: [47178, 196614] },
  'other-insects': { gbifKeys: [], inatIds: [47157] },
  ants: { gbifKeys: [], inatIds: [47336] },
  plants: { gbifKeys: [], inatIds: [47126] },
  fungi: { gbifKeys: [], inatIds: [47170] },
};

const FISH_CLASSES = new Set(['actinopterygii', 'chondrichthyes', 'sarcopterygii', 'myxini', 'petromyzontida']);
const lower = (value?: string) => (value ?? '').toLowerCase().trim();

export function matchesGbifCategory(row: {
  class?: string; family?: string; kingdom?: string; phylum?: string;
}, category: SpeciesCategoryId | 'all'): boolean {
  if (category === 'all') return true;
  const cls = lower(row.class), family = lower(row.family), kingdom = lower(row.kingdom);
  switch (category) {
    case 'mammals': return cls === 'mammalia';
    case 'birds': return cls === 'aves';
    case 'reptiles': return cls === 'reptilia';
    case 'amphibians': return cls === 'amphibia';
    case 'fish': return FISH_CLASSES.has(cls);
    case 'ants': return family === 'formicidae';
    case 'other-insects': return cls === 'insecta';
    case 'plants': return kingdom === 'plantae';
    case 'fungi': return kingdom === 'fungi';
  }
}

export function inatCategoryOf(taxon: {
  iconic_taxon_id?: number; ancestor_ids?: number[]; iconic_taxon_name?: string;
}): SpeciesCategoryId | undefined {
  const chain = new Set([...(taxon.ancestor_ids ?? []), taxon.iconic_taxon_id]);
  if (chain.has(47336)) return 'ants';
  if (chain.has(40151)) return 'mammals';
  if (chain.has(3)) return 'birds';
  if (chain.has(26036)) return 'reptiles';
  if (chain.has(20978)) return 'amphibians';
  if (chain.has(47178) || chain.has(196614)) return 'fish';
  if (chain.has(47157)) return 'other-insects';
  if (chain.has(47126)) return 'plants';
  if (chain.has(47170)) return 'fungi';
  switch (lower(taxon.iconic_taxon_name)) {
    case 'mammalia': return 'mammals';
    case 'aves': return 'birds';
    case 'reptilia': return 'reptiles';
    case 'amphibia': return 'amphibians';
    case 'actinopterygii': return 'fish';
    case 'insecta': return 'other-insects';
    case 'plantae': return 'plants';
    case 'fungi': return 'fungi';
    default: return undefined;
  }
}

export function matchesInatCategory(taxon: Parameters<typeof inatCategoryOf>[0], category: SpeciesCategoryId | 'all'): boolean {
  if (category === 'all') return true;
  const actual = inatCategoryOf(taxon);
  // The Insects chip includes ants; the separate Ants chip is more specific.
  return actual === category || (category === 'other-insects' && actual === 'ants');
}

export function gbifCategoryOf(result: {
  class?: string; family?: string; kingdom?: string;
}): SpeciesCategoryId | undefined {
  const ordered: SpeciesCategoryId[] = ['ants','mammals','birds','reptiles','amphibians','fish','other-insects','plants','fungi'];
  return ordered.find((category) => matchesGbifCategory(result, category));
}
