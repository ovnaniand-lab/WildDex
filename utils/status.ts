import { Colors } from '@/constants/theme';
import type { ConservationStatus } from '@/data/types';

/** Human label + badge colour for each IUCN-style conservation status. */
export const STATUS_META: Record<
  ConservationStatus,
  { label: string; color: string; background: string }
> = {
  'least-concern': { label: 'Least Concern', color: '#2F6B3A', background: Colors.leafTint },
  'near-threatened': { label: 'Near Threatened', color: '#8A6D1F', background: Colors.amberTint },
  vulnerable: { label: 'Vulnerable', color: '#9A5B2B', background: Colors.brownTint },
  endangered: { label: 'Endangered', color: '#A03E22', background: '#F7E3DB' },
  'critically-endangered': { label: 'Critically Endangered', color: '#7E1F14', background: '#F4D5CF' },
};

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}
