/**
 * WildDex domain types.
 * These interfaces describe the SHAPE of the future Phase-2 backend API.
 * Preview data (data/previewData.ts) implements them locally for now, so real
 * services can replace the data layer without touching UI code.
 */

export type SpeciesCategoryId =
  | 'mammals'
  | 'birds'
  | 'ants'
  | 'other-insects'
  | 'reptiles'
  | 'amphibians'
  | 'fish'
  | 'plants'
  | 'fungi';

export interface SpeciesCategory {
  id: SpeciesCategoryId;
  name: string;
  emoji: string;
  description: string;
}

export type ConservationStatus =
  | 'least-concern'
  | 'near-threatened'
  | 'vulnerable'
  | 'endangered'
  | 'critically-endangered';

export interface Taxonomy {
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
  species: string;
}

export interface PhotoCredit {
  /** Photographer display name. */
  author: string;
  /** Source platform. */
  source: 'Unsplash';
  /** Human-readable licence. */
  license: string;
  /** Original page URL. */
  url: string;
}

export interface Species {
  id: string;
  commonName: string;
  scientificName: string;
  categoryId: SpeciesCategoryId;
  /** Full-size image URL (wildlife photography). */
  imageUrl: string;
  photoCredit: PhotoCredit;
  status: ConservationStatus;
  shortDescription: string;
  habitat: string;
  distribution: string;
  diet: string;
  facts: string[];
  taxonomy: Taxonomy;
  /** Region ids where this species is preview-listed as findable. */
  regionIds: string[];
}

export interface Region {
  id: string;
  name: string;
  country: string;
  continent: string;
  emoji: string;
  blurb: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  goal: number;
  progress: number;
  reward: string;
  emoji: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
}
