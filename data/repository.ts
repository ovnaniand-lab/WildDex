/**
 * WildDex data repository (Phase 1).
 *
 * The ONLY module screens should import species/region data from. Today it
 * reads the local preview dataset with simulated latency; in Phase 2 its
 * function bodies get replaced by network calls while signatures stay put.
 */

import {
  ACHIEVEMENTS,
  ACTIVE_CHALLENGE,
  CATEGORIES,
  FEATURED_SPECIES_IDS,
  GLOBAL_SPECIES_COUNT,
  REGIONS,
  SPECIES,
} from './previewData';
import type { Achievement, Challenge, Region, Species, SpeciesCategory, ConservationStatus } from './types';

/** Simulates network latency so loading states are exercised in dev. */
const delay = (ms = 350): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface SpeciesFilters {
  query?: string;
  categoryId?: SpeciesCategory['id'] | 'all';
  status?: ConservationStatus | 'all';
  regionId?: string | 'all';
}

export const repository = {
  async getCategories(): Promise<SpeciesCategory[]> {
    await delay(150);
    return CATEGORIES;
  },

  async getRegions(): Promise<Region[]> {
    await delay(150);
    return REGIONS;
  },

  async getSpecies(filters: SpeciesFilters = {}): Promise<Species[]> {
    await delay();
    const q = filters.query?.trim().toLowerCase();
    return SPECIES.filter((s) => {
      if (filters.categoryId && filters.categoryId !== 'all' && s.categoryId !== filters.categoryId) return false;
      if (filters.status && filters.status !== 'all' && s.status !== filters.status) return false;
      if (filters.regionId && filters.regionId !== 'all' && !s.regionIds.includes(filters.regionId)) return false;
      if (q && !(s.commonName.toLowerCase().includes(q) || s.scientificName.toLowerCase().includes(q))) return false;
      return true;
    });
  },

  async getSpeciesById(id: string): Promise<Species | undefined> {
    await delay(200);
    return SPECIES.find((s) => s.id === id);
  },

  async getFeaturedSpecies(): Promise<Species[]> {
    await delay(250);
    return FEATURED_SPECIES_IDS.map((id) => SPECIES.find((s) => s.id === id)).filter(
      (s): s is Species => Boolean(s),
    );
  },

  async getChallenge(): Promise<Challenge> {
    await delay(150);
    return ACTIVE_CHALLENGE;
  },

  async getAchievements(): Promise<Achievement[]> {
    await delay(150);
    return ACHIEVEMENTS;
  },

  getGlobalSpeciesCount(): number {
    return GLOBAL_SPECIES_COUNT;
  },

  getCategoryById(id: string): SpeciesCategory | undefined {
    return CATEGORIES.find((c) => c.id === id);
  },

  getRegionById(id: string): Region | undefined {
    return REGIONS.find((r) => r.id === id);
  },
};
