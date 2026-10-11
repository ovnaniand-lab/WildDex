/**
 * WildDex Phase 2 — normalized species model + external API response types.
 *
 * UI code consumes `EncyclopediaSpecies` only. The raw interfaces below mirror
 * the JSON shapes returned by the public GBIF and iNaturalist APIs so that
 * normalization stays type-safe.
 */

import type { SpeciesCategoryId } from '@/data/types';

/* ------------------------------------------------------------------ */
/* Normalized internal model                                          */
/* ------------------------------------------------------------------ */

export type SourceKind = 'gbif' | 'inaturalist';

/** Stable cross-provider identifier: "gbif:2435099" / "inat:42007". */
export type SpeciesUid = string;

export interface SpeciesPhoto {
  url: string;
  /** Free-text attribution required by the licence (author + license). */
  attribution: string;
  source: SourceKind;
  /** Original photo page, when the provider gives one. */
  originalUrl?: string;
}

export interface TaxonomyInfo {
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
}

export interface RegionContext {
  kind: 'country' | 'nearby';
  /** ISO 3166-1 alpha-2 code (country mode). */
  countryCode?: string;
  countryName?: string;
  lat?: number;
  lon?: number;
  /** Search radius in kilometres (nearby mode). */
  radiusKm?: number;
}

export interface EncyclopediaSpecies {
  uid: SpeciesUid;
  source: SourceKind;
  /** Provider-native numeric id (GBIF nubKey / iNat taxon id). */
  sourceId: number;
  commonName: string;
  scientificName: string;
  categoryId: SpeciesCategoryId;
  photos: SpeciesPhoto[];
  taxonomy: TaxonomyInfo;
  /** Short description ONLY when a reliable source provides one. */
  summary?: string;
  /** Observation evidence for the current region context. */
  observationCount?: number;
  lastObserved?: string;
  regionContext?: RegionContext;
  gbifNubKey?: number;
  inatTaxonId?: number;
  profileUrl: string;
  /** Data licence text supplied by the provider. */
  dataLicense?: string;
}

export interface Page<T> {
  items: T[];
  /** Opaque cursor/offset for the next page; null = no more pages. */
  nextOffset: number | null;
  totalResults?: number;
  endOfRecords: boolean;
}

export type ExploreQuery = {
  text?: string;
  category?: SpeciesCategoryId | 'all';
  /** Where to look. Undefined = worldwide. */
  region?: RegionContext;
  pageSize?: number;
};

/* ------------------------------------------------------------------ */
/* Raw GBIF response shapes (subset of fields we use)                 */
/* ------------------------------------------------------------------ */

export interface GbifSpeciesSearchResult {
  key: number;
  nameKey?: number;
  nubKey?: number;
  datasetKey?: string;
  parent?: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  scientificName?: string;
  canonicalName?: string;
  vernacularName?: string;
  rank?: string;
  status?: string;
  taxonomicStatus?: string;
}

export interface GbifListResponse<T> {
  offset: number;
  limit: number;
  endOfRecords: boolean;
  count: number;
  results: T[];
}

export interface GbifMedia {
  identifier?: string;
  URL?: string;
  formats?: string[];
  license?: string;
  creators?: string[];
  copyrightHolder?: string;
}

export interface GbifSpeciesUsage {
  key: number;
  nubKey?: number;
  scientificName?: string;
  canonicalName?: string;
  rank?: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  taxonomicStatus?: string;
  descriptions?: Array<{ description?: string; type?: string; source?: string }>;
}

export interface GbifVernacularName {
  title?: string;
  name?: string;
  language?: string;
}

export interface GbifOccurrence {
  key: number;
  taxonKey?: number;
  speciesKey?: number;
  media?: GbifMedia[];
  eventDate?: string;
  country?: string;
  decimalLatitude?: number;
  decimalLongitude?: number;
}

/* ------------------------------------------------------------------ */
/* Raw iNaturalist response shapes                                    */
/* ------------------------------------------------------------------ */

export interface InatPhoto {
  id: number;
  license_code?: string | null;
  attribution?: string;
  url?: string; // square
  medium_url?: string;
  large_url?: string;
  original_dimensions?: { width: number; height: number };
}

export interface InatTaxon {
  id: number;
  rank: string;
  rank_level?: number;
  name: string;
  preferred_common_name?: string;
  iconic_taxon_id?: number;
  iconic_taxon_name?: string;
  ancestor_ids?: number[];
  is_active?: boolean;
  default_photo?: InatPhoto | null;
  photos?: InatPhoto[];
  ancestry?: string;
  wikipedia_summary?: string | null;
  observations_count?: number;
}

export interface InatTaxonSummary {
  taxon_id: number;
  taxon?: InatTaxon;
}

export interface InatResponse<T> {
  total_results: number;
  page: number;
  per_page: number;
  results: T[];
}

export interface InatObservation {
  id: number;
  observed_on_string?: string;
  location?: [number, number] | null;
  quality_grade?: string;
  taxon?: InatTaxon;
}
