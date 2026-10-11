/**
 * GBIF public API service (https://api.gbif.org/v1/).
 *
 * Phase 2 secondary source: authoritative Backbone taxonomy, vernacular
 * names and occurrence records. Anonymous access only — no credentials are
 * shipped in the client. Photo evidence is pulled from occurrence media and
 * always carries licence/attribution fields.
 */

import { getJson, withParams } from './http';
import type {
  EncyclopediaSpecies,
  GbifListResponse,
  GbifOccurrence,
  GbifSpeciesSearchResult,
  GbifSpeciesUsage,
  GbifVernacularName,
  Page,
  SpeciesPhoto,
} from './types';
import { CATEGORY_TAXA, gbifCategoryOf } from './taxonomy';
import type { SpeciesCategoryId } from '@/data/types';

const BASE = 'https://api.gbif.org/v1';

function photoFromMedia(media: GbifOccurrence['media']): SpeciesPhoto[] {
  const out: SpeciesPhoto[] = [];
  for (const m of media ?? []) {
    const url = m.URL ?? m.identifier;
    if (!url || !/\.(jpe?g|png|webp|gif)/i.test(url)) continue;
    const author = m.creators?.[0] ?? m.copyrightHolder ?? 'GBIF contributor';
    out.push({
      url,
      attribution: `${author} — ${m.license ?? 'licence unknown'} (via GBIF)`,
      source: 'gbif',
    });
  }
  return out;
}

/** Normalize a GBIF species-search row into the WildDex model. */
export function normalizeGbifRow(
  row: GbifSpeciesSearchResult,
  categoryId?: SpeciesCategoryId,
): EncyclopediaSpecies | null {
  const nubKey = row.nubKey ?? row.key;
  const scientific = row.canonicalName ?? row.scientificName;
  if (!scientific || row.rank !== 'SPECIES') return null;
  // Dataset-level rows have keys like nameKey != nubKey; prefer backbone usage.
  return {
    uid: `gbif:${nubKey}`,
    source: 'gbif',
    sourceId: nubKey,
    commonName: row.vernacularName || scientific,
    scientificName: scientific,
    categoryId: categoryId ?? gbifCategoryOf(row as never),
    photos: [], // search rows carry no media; detail screen enriches lazily
    taxonomy: {
      kingdom: row.kingdom,
      phylum: row.phylum,
      class: row.class,
      order: row.order,
      family: row.family,
      genus: row.genus ?? row.parent,
      species: row.species,
    },
    gbifNubKey: nubKey,
    profileUrl: `https://www.gbif.org/species/${nubKey}`,
    dataLicense: 'GBIF Backbone Taxonomy (CC BY 4.0)',
  };
}

/** Paginated backbone search restricted to accepted species-level names. */
export async function searchSpecies(
  query: { text?: string; category?: SpeciesCategoryId | 'all'; pageSize?: number },
  offset: number,
): Promise<Page<EncyclopediaSpecies>> {
  const limit = Math.min(query.pageSize ?? 20, 50);
  const params: Record<string, string | number | undefined> = {
    q: query.text?.trim() || undefined,
    rank: 'SPECIES',
    // Taxon-key filter instead of keyword guessing on names:
    taxonKey:
      query.category && query.category !== 'all' ? CATEGORY_TAXA[query.category].gbifKeys[0] : undefined,
    limit,
    offset,
  };
  const res = await getJson<GbifListResponse<GbifSpeciesSearchResult>>(
    withParams(`${BASE}/species/search`, params),
  );
  const seen = new Set<number>();
  const items: EncyclopediaSpecies[] = [];
  for (const row of res.results) {
    const nub = row.nubKey ?? row.key;
    if (seen.has(nub)) continue; // dedupe dataset duplicates of same taxon
    seen.add(nub);
    const norm = normalizeGbifRow(row, query.category === 'all' ? undefined : query.category);
    if (norm) items.push(norm);
  }
  const nextOffset = res.endOfRecords ? null : res.offset + res.limit;
  return { items, nextOffset, totalResults: res.count, endOfRecords: res.endOfRecords };
}

/** Full backbone usage (rank names, descriptions) for the detail screen. */
export async function getGbifUsage(nubKey: number): Promise<GbifSpeciesUsage> {
  return getJson<GbifSpeciesUsage>(`${BASE}/species/${nubKey}`);
}

/** English vernacular names for a taxon. */
export async function getGbifVernacularNames(nubKey: number): Promise<string[]> {
  const res = await getJson<GbifListResponse<GbifVernacularName>>(
    withParams(`${BASE}/species/${nubKey}/vernacularNames`, { limit: 20 }),
  );
  return res.results
    .filter((v) => !v.language || v.language.startsWith('en'))
    .map((v) => v.title ?? v.name ?? '')
    .filter(Boolean);
}

/** Recent georeferenced occurrences with media (photos) for a taxon. */
export async function getGbifEvidence(
  nubKey: number,
  countryCode?: string,
): Promise<{ photos: SpeciesPhoto[]; lastObserved?: string; count: number }> {
  const params: Record<string, string | number | undefined> = {
    taxonKey: nubKey,
    hasCoordinate: 'true',
    hasGeoIssue: 'false',
    limit: 20,
    orderBy: 'occurrenceDate DESC',
    country: countryCode,
  };
  const res = await getJson<GbifListResponse<GbifOccurrence>>(
    withParams(`${BASE}/occurrence/search`, params),
  );
  const photos: SpeciesPhoto[] = [];
  for (const occ of res.results) {
    photos.push(...photoFromMedia(occ.media));
    if (photos.length >= 6) break;
  }
  return {
    photos,
    lastObserved: res.results[0]?.eventDate,
    count: res.count,
  };
}
