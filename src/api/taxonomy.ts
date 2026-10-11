/**
 * Taxonomic category mapping — WildDex categories ⇄ provider taxon keys.
 *
 * Filters use taxon identifiers (GBIF nubKeys / iNaturalist iconic taxa and
 * taxon ids), never keyword guessing on names. Ants are a subcategory of
 * Insects: Formicidae (family) is its own filter while the Insecta class
 * filter includes ants as well.
 */

import type { SpeciesCategoryId } from '@/data/types';

export interface CategoryTaxa {
  /** GBIF Backbone nubKeys at class/order/family level. */
  gbifKeys: number[];
  /** iNaturalist taxon ids used for `taxon_id=` observation filters. */
  inatIds: number[];
}

export const CATEGORY_TAXA: Record<SpeciesCategoryId, CategoryTaxa> = {
  mammals: { gbifKeys: [359], inatIds: [1] }, // Mammalia
  birds: { gbifKeys: [212], inatIds: [3] }, // Aves
  reptiles: { gbifKeys: [109], inatIds: [4] }, // Reptilia
  amphibians: { gbifKeys: [130], inatIds: [20] }, // Amphibia
  fish: { gbifKeys: [720], inatIds: [10339] }, // Chordata incl. Actinopterygii etc.
  'other-insects': { gbifKeys: [1468], inatIds: [47220] }, // Insecta
  ants: { gbifKeys: [1833, 4603225], inatIds: [47210] }, // Formicidae (family)
  plants: { gbifKeys: [6], inatIds: [47126] }, // Plantae
  fungi: { gbifKeys: [5], inatIds: [47170] }, // Fungi
};

/** iNaturalist iconic_taxon_id values we can map back to WildDex buckets. */
const INAT_ICONIC_TO_CATEGORY: Record<number, SpeciesCategoryId> = {
  1: 'mammals',
  3: 'birds',
  4: 'reptiles',
  20: 'amphibians',
  10339: 'fish',
  47220: 'other-insects',
  47210: 'ants',
  47126: 'plants',
  47170: 'fungi',
};

/** GBIF Backbone class/order keys → WildDex bucket (coarse fallback). */
const GBIF_RANK_KEYS: Array<{ keys: number[]; id: SpeciesCategoryId }> = [
  { keys: [359], id: 'mammals' },
  { keys: [212], id: 'birds' },
  { keys: [109], id: 'reptiles' },
  { keys: [130], id: 'amphibians' },
  { keys: [720, 1379, 1380, 1381, 1382, 1383, 1384, 1385, 1386, 1387, 1388, 1389, 1390, 1391, 1392, 1393, 1394, 1395, 1396, 1397, 1398, 1399, 1400, 1401, 1402, 1403, 1404, 1405, 1406, 1407, 1408, 1409, 1410, 1411, 1412, 1413, 1414, 1415, 1416, 1417, 1418, 1419, 1420, 1421, 1422, 1423, 1424, 1425, 1426, 1427, 1428, 1429, 1430, 1431, 1432, 1433, 1434, 1435, 1436, 1437, 1438, 1439, 1440, 1441, 1442, 1443, 1444, 1445, 1446, 1447, 1448, 1449, 1450, 1451, 1452, 1453, 1454, 1455, 1456, 1457, 1458, 1459, 1460, 1461, 1462, 1463, 1464, 1465, 1466, 1467], id: 'fish' },
  { keys: [1468], id: 'other-insects' },
  { keys: [6], id: 'plants' },
  { keys: [5], id: 'fungi' },
];

/** Map an iNaturalist taxon's ancestry/iconic id to a WildDex category. */
export function inatCategoryOf(taxon: {
  iconic_taxon_id?: number;
  ancestor_ids?: number[];
}): SpeciesCategoryId {
  if (taxon.iconic_taxon_id === 47210) return 'ants';
  if (taxon.iconic_taxon_id && INAT_ICONIC_TO_CATEGORY[taxon.iconic_taxon_id]) {
    return INAT_ICONIC_TO_CATEGORY[taxon.iconic_taxon_id];
  }
  // Fall back to ancestry: e.g. an ant within Insecta still has Formicidae id 47210.
  const ancestors = taxon.ancestor_ids ?? [];
  if (ancestors.includes(47210)) return 'ants';
  for (const [idStr, cat] of Object.entries(INAT_ICONIC_TO_CATEGORY)) {
    if (ancestors.includes(Number(idStr))) return cat;
  }
  return 'other-insects';
}

/** Map a GBIF search result (class/family keys present) to a WildDex category. */
export function gbifCategoryOf(result: {
  familyKey?: number;
  classKey?: number;
  orderKey?: number;
  kingdom?: string;
}): SpeciesCategoryId {
  if (result.familyKey === 1833 || result.familyKey === 4603225) return 'ants';
  for (const entry of GBIF_RANK_KEYS) {
    if (
      (result.classKey !== undefined && entry.keys.includes(result.classKey)) ||
      (result.orderKey !== undefined && entry.keys.includes(result.orderKey))
    ) {
      return entry.id;
    }
  }
  if (result.kingdom === 'Plantae') return 'plants';
  if (result.kingdom === 'Fungi') return 'fungi';
  return 'other-insects';
}
