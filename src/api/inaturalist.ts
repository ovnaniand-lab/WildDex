/**
 * iNaturalist public API service (https://api.inaturalist.org/v1/).
 *
 * Phase 2 primary browse/search source: taxa carry photos with licence
 * attribution, Wikipedia summaries and per-taxon observation counts. All
 * requests are anonymous — no API keys are embedded in the client.
 */

import { getJson, withParams } from './http';
import type {
  EncyclopediaSpecies,
  ExploreQuery,
  InatObservation,
  InatResponse,
  InatTaxon,
  Page,
  RegionContext,
  SpeciesPhoto,
} from './types';
import { CATEGORY_TAXA, inatCategoryOf } from './taxonomy';
import type { SpeciesCategoryId } from '@/data/types';

const BASE = 'https://api.inaturalist.org/v1';

/** Rank names we accept as "species-level" results. */
const SPECIES_RANKS = new Set(['species', 'subspecies', 'variety', 'form']);

function photoUrl(p: InatTaxon['default_photo']): string | null {
  if (!p) return null;
  const url = p.large_url ?? p.medium_url ?? p.url;
  return url ? url.replace('square.jpg', 'large.jpg') : null;
}

function toPhotos(taxon: InatTaxon): SpeciesPhoto[] {
  const list = taxon.photos && taxon.photos.length > 0 ? taxon.photos : [taxon.default_photo];
  const out: SpeciesPhoto[] = [];
  for (const p of list) {
    const url = photoUrl(p ?? undefined);
    if (!url) continue;
    out.push({
      url,
      attribution: p?.attribution ?? `iNaturalist contributor (photo ${p?.id ?? ''})`,
      source: 'inaturalist',
      originalUrl: `https://www.inaturalist.org/photos/${p?.id}`,
      license: p?.license_code ?? 'no code — see attribution',
    });
  }
  return out;
}

/** Normalize one iNat taxon into the WildDex species model. */
export function normalizeInatTaxon(
  taxon: InatTaxon,
  categoryId?: SpeciesCategoryId,
  region?: RegionContext,
  observationCount?: number,
): EncyclopediaSpecies {
  return {
    uid: `inat:${taxon.id}`,
    source: 'inaturalist',
    sourceId: taxon.id,
    commonName: taxon.preferred_common_name || taxon.name,
    scientificName: taxon.name,
    categoryId: categoryId ?? inatCategoryOf(taxon),
    photos: toPhotos(taxon),
    taxonomy: {
      kingdom: taxon.iconic_taxon_name,
      // Full rank names are fetched lazily on the detail screen via ancestors.
    },
    summary: taxon.wikipedia_summary ?? undefined,
    observationCount: observationCount ?? taxon.observations_count,
    regionContext: region,
    inatTaxonId: taxon.id,
    profileUrl: `https://www.inaturalist.org/taxa/${taxon.id}`,
    dataLicense: 'CC-BY-NC (photos retain individual licences; see attribution)',
  };
}

interface TaxonSearchArgs {
  text?: string;
  category?: SpeciesCategoryId | 'all';
  page: number;
  pageSize: number;
  signal?: unknown;
}

async function searchTaxa(args: TaxonSearchArgs): Promise<InatResponse<InatTaxon>> {
  const params: Record<string, string | number | undefined> = {
    q: args.text?.trim() || undefined,
    per_page: args.pageSize,
    page: args.page,
    // Always require at least one photo so every Explore card renders real
    // wildlife photography (Phase 2D). Text searches keep the constraint too;
    // taxa without photos are still reachable via GBIF merge + detail fallback.
    media_type: 'photos',
    is_active: 'true',
  };
  if (args.category && args.category !== 'all') {
    const ids = CATEGORY_TAXA[args.category].inatIds;
    if (ids.length === 1) params.taxon_id = ids[0];
    else params.taxon_id = ids.join(',');
  }
  // Text search returns mixed ranks; keep only species-level clientside below.
  return getJson<InatResponse<InatTaxon>>(withParams(`${BASE}/taxa`, params));
}

/**
 * Paginated encyclopedia search. When a region context is supplied we first
 * ask iNaturalist which taxa have actual observations in that area
 * (`/observations/species_counts`), so results are geographically real.
 */
export async function searchSpecies(query: ExploreQuery, offset: number): Promise<Page<EncyclopediaSpecies>> {
  const pageSize = Math.min(query.pageSize ?? 20, 30);
  const page = Math.floor(offset / pageSize) + 1;

  if (query.region) {
    const counts = await speciesCountsForRegion(query, page, pageSize);
    const items = counts.flatMap((obs) =>
      obs.taxon && SPECIES_RANKS.has(obs.taxon.rank)
        ? [normalizeInatTaxon(obs.taxon, query.category === 'all' ? undefined : query.category, query.region, obs.count)]
        : [],
    );
    const end = items.length < pageSize && page * pageSize >= counts.length;
    return {
      items,
      nextOffset: end ? null : offset + pageSize,
      totalResults: counts.length,
      endOfRecords: end,
    };
  }

  const res = await searchTaxa({ text: query.text, category: query.category, page, pageSize });
  const items = res.results
    .filter((t) => t.is_active !== false && (query.text ? true : SPECIES_RANKS.has(t.rank)))
    .map((t) => normalizeInatTaxon(t, query.category === 'all' ? undefined : query.category));
  const hasMore = res.page * res.per_page < res.total_results;
  return {
    items,
    nextOffset: hasMore ? offset + pageSize : null,
    totalResults: res.total_results,
    endOfRecords: !hasMore,
  };
}

interface CountedObservation extends InatObservation {
  count: number;
}

/** Species observed in the selected country or within radius of GPS point. */
async function speciesCountsForRegion(
  query: ExploreQuery,
  page: number,
  perPage: number,
): Promise<CountedObservation[]> {
  const r = query.region!;
  const params: Record<string, string | number | undefined> = {
    per_page: perPage,
    page,
    quality_grade: 'research,needs_id',
  };
  if (r.kind === 'country' && r.countryCode) {
    params.country_code = r.countryCode.toUpperCase();
  } else if (r.kind === 'nearby' && r.lat !== undefined && r.lon !== undefined) {
    const km = r.radiusKm ?? 50;
    params.lat = r.lat;
    params.lon = r.lon;
    params.radius = km;
  }
  if (query.category && query.category !== 'all') {
    params.taxon_id = CATEGORY_TAXA[query.category].inatIds.join(',');
  }
  if (query.text?.trim()) {
    // species_counts has no free-text param: resolve the name via /taxa first.
    const taxa = await searchTaxa({ text: query.text, category: query.category, page: 1, pageSize: 10 });
    const ids = taxa.results.filter((t) => SPECIES_RANKS.has(t.rank)).map((t) => t.id);
    if (ids.length === 0) return [];
    params.taxon_id = ids.slice(0, 10).join(',');
  }
  const res = await getJson<InatResponse<CountedObservation>>(
    withParams(`${BASE}/observations/species_counts`, params),
  );
  return res.results;
}

/** Lazy taxonomy chain (kingdom → species) for the detail screen. */
export async function getInatAncestors(taxonId: number): Promise<InatTaxon[]> {
  const res = await getJson<InatResponse<InatTaxon>>(`${BASE}/taxa/${taxonId}/ancestors?lang=en`);
  return res.results;
}

/** Single taxon by id (used when opening an inat:<id> deep link). */
export async function getInatTaxonById(taxonId: number): Promise<InatTaxon | undefined> {
  const res = await getJson<InatResponse<InatTaxon>>(`${BASE}/taxa/${taxonId}?lang=en&extras=photos,identifications`);
  return res.results[0];
}

/** Recent research-grade observations of a taxon within a region context. */
export async function getInatObservationsFor(
  taxonId: number,
  region?: RegionContext,
): Promise<InatObservation[]> {
  const params: Record<string, string | number | undefined> = {
    taxon_id: taxonId,
    quality_grade: 'research',
    per_page: 10,
    order_by: 'observed_on',
    // Hide precise locations for threatened taxa, as iNat's terms require.
    verifiable: 'true',
  };
  if (region?.kind === 'country' && region.countryCode) {
    params.country_code = region.countryCode.toUpperCase();
  } else if (region?.kind === 'nearby' && region.lat !== undefined && region.lon !== undefined) {
    params.lat = region.lat;
    params.lon = region.lon;
    params.radius = region.radiusKm ?? 50;
  }
  const res = await getJson<InatResponse<InatObservation>>(
    withParams(`${BASE}/observations`, params),
  );
  return res.results;
}
