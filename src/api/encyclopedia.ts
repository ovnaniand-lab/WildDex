/**
 * WildDex encyclopedia facade — the ONLY module Phase-2 screens import for
 * live species data. It normalizes GBIF + iNaturalist responses into the
 * shared `EncyclopediaSpecies` model, dedupes taxa across providers, and
 * keeps all network logic out of UI components.
 *
 * Caching: in-memory TTL cache lives in src/api/http.ts; recent views are
 * persisted with AsyncStorage so the Home screen works offline.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SpeciesCategoryId } from '@/data/types';

import * as gbif from './gbif';
import * as inat from './inaturalist';
import type {
  EncyclopediaSpecies,
  ExploreQuery,
  Page,
  RegionContext,
  TaxonomyInfo,
} from './types';

const RECENT_KEY = 'wilddex.recentSpecies';
const RECENT_LIMIT = 12;

export interface RecentSpecies {
  uid: string;
  commonName: string;
  scientificName: string;
  imageUrl?: string;
  categoryId: SpeciesCategoryId;
  viewedAt: number;
}

/* ------------------------------------------------------------------ */
/* Browse / search (paginated)                                        */
/* ------------------------------------------------------------------ */

/**
 * One page of encyclopedia results. iNaturalist is the primary source
 * (photos + descriptions); GBIF supplements worldwide taxonomy searches.
 */
export async function fetchSpeciesPage(query: ExploreQuery, offset: number): Promise<Page<EncyclopediaSpecies>> {
  const pageSize = query.pageSize ?? 20;
  const q: ExploreQuery = { ...query, pageSize };

  // Country/nearby modes have real observation evidence on iNaturalist only,
  // so they must not be mixed with GBIF's backbone rows.
  if (q.region) {
    return inat.searchSpecies(q, offset);
  }

  const [inatPage, gbifPage] = await Promise.all([
    inat.searchSpecies(q, offset).catch(() => null),
    offset === 0 && !q.text ? Promise.resolve(null) : gbif.searchSpecies(q, offset).catch(() => null),
  ]);

  const merged: EncyclopediaSpecies[] = [];
  const seenSci = new Set<string>();
  for (const item of [...(inatPage?.items ?? []), ...(gbifPage?.items ?? [])]) {
    const key = item.scientificName.toLowerCase();
    if (seenSci.has(key)) continue; // avoid duplicate taxa across providers
    seenSci.add(key);
    merged.push(item);
  }

  const nextOffset = inatPage?.nextOffset ?? gbifPage?.nextOffset ?? null;
  return {
    items: merged,
    nextOffset,
    totalResults: Math.max(inatPage?.totalResults ?? 0, gbifPage?.totalResults ?? 0) || undefined,
    endOfRecords: nextOffset === null,
  };
}

/* ------------------------------------------------------------------ */
/* Species detail                                                     */
/* ------------------------------------------------------------------ */

export interface SpeciesDetail extends EncyclopediaSpecies {
  /** Enriched full-rank classification (best effort per provider). */
  fullTaxonomy: TaxonomyInfo;
  /** Extra photos beyond the card thumbnail. */
  gallery: EncyclopediaSpecies['photos'];
  /** Observation dates for the current region context. */
  recentObservations: Array<{ date?: string; where: string }>;
}

/** Load a species by its stable "provider:id" uid, enriched for the profile. */
export async function getSpeciesByUid(uid: string, region?: RegionContext): Promise<SpeciesDetail | null> {
  const [provider, idStr] = uid.split(':');
  const id = Number(idStr);
  if (!Number.isFinite(id)) return null;

  if (provider === 'inat') {
    const taxon = await inat.getInatTaxonById(id);
    if (!taxon) return null;
    const base = inat.normalizeInatTaxon(taxon, undefined, region);
    const ancestors = await inat.getInatAncestors(id).catch(() => []);
    const rank = (r: string) => ancestors.find((a) => a.rank === r)?.name;
    const observations = await inat
      .getInatObservationsFor(id, region)
      .catch(() => []);
    return {
      ...base,
      fullTaxonomy: {
        kingdom: rank('kingdom') ?? taxon.iconic_taxon_name,
        phylum: rank('phylum'),
        class: rank('class'),
        order: rank('order'),
        family: rank('family'),
        genus: rank('genus'),
        species: taxon.name,
      },
      gallery: base.photos,
      recentObservations: observations.slice(0, 5).map((o) => ({
        date: o.observed_on_string,
        where: o.quality_grade ?? 'observation',
      })),
    };
  }

  if (provider === 'gbif') {
    const usage = await gbif.getGbifUsage(id);
    const names = await gbif.getGbifVernacularNames(id).catch(() => []);
    const evidence = await gbif.getGbifEvidence(id, region?.countryCode).catch(() => ({
      photos: [] as EncyclopediaSpecies['photos'],
      lastObserved: undefined as string | undefined,
      count: 0,
    }));
    const base: EncyclopediaSpecies & { lastObserved?: string } = {
      uid,
      source: 'gbif',
      sourceId: id,
      commonName: names[0] ?? usage.canonicalName ?? usage.scientificName ?? String(id),
      scientificName: usage.canonicalName ?? usage.scientificName ?? String(id),
      categoryId: 'other-insects',
      photos: evidence.photos,
      taxonomy: {
        kingdom: usage.kingdom,
        phylum: usage.phylum,
        class: usage.class,
        order: usage.order,
        family: usage.family,
        genus: usage.genus,
        species: usage.species,
      },
      summary: usage.descriptions?.[0]?.description,
      observationCount: evidence.count,
      lastObserved: evidence.lastObserved,
      regionContext: region,
      gbifNubKey: id,
      profileUrl: `https://www.gbif.org/species/${id}`,
      dataLicense: 'GBIF Backbone Taxonomy (CC BY 4.0)',
    };
    return { ...base, fullTaxonomy: base.taxonomy, gallery: evidence.photos, recentObservations: [] };
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Recently viewed (local persistence)                                */
/* ------------------------------------------------------------------ */

export async function getRecentSpecies(): Promise<RecentSpecies[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as RecentSpecies[]) : [];
  } catch {
    return [];
  }
}

export async function recordSpeciesView(species: EncyclopediaSpecies): Promise<void> {
  try {
    const entry: RecentSpecies = {
      uid: species.uid,
      commonName: species.commonName,
      scientificName: species.scientificName,
      imageUrl: species.photos[0]?.url,
      categoryId: species.categoryId,
      viewedAt: Date.now(),
    };
    const list = [entry, ...(await getRecentSpecies()).filter((r) => r.uid !== entry.uid)].slice(0, RECENT_LIMIT);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // Non-critical — silently skip persistence failures.
  }
}
