/**
 * LiveSpeciesRow — horizontal carousel of real GBIF/iNaturalist species for
 * the Home dashboard (Phase 2). Renders nothing while loading or when the
 * network fails, so the existing Phase-1 sections stay intact.
 */
import EncyclopediaCard from '@/components/EncyclopediaCard';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useWildDex } from '@/hooks/useWildDexState';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { fetchSpeciesPage } from '@/src/api/encyclopedia';
import type { EncyclopediaSpecies } from '@/src/api/types';

interface Props {
  title: string;
  subtitle?: string;
  /** Build the query for this row (e.g. region-based or category-based). */
  buildQuery: () => Promise<EncyclopediaSpecies[]>;
  emptyMessage?: string;
}

export default function LiveSpeciesRow({ title, subtitle, buildQuery, emptyMessage }: Props) {
  const [items, setItems] = useState<EncyclopediaSpecies[] | null>(null);
  const router = useRouter();
  const { hasDiscovery } = useWildDex();

  useEffect(() => {
    let alive = true;
    setItems(null);
    buildQuery()
      .then((list) => {
        if (alive) setItems(list);
      })
      .catch(() => {
        if (alive) setItems([]); // swallow — offline row simply hides itself
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items === null || items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((s) => (
          <View key={s.uid} style={styles.cell}>
            <EncyclopediaCard
              species={s}
              discovered={hasDiscovery(s.uid)}
              onPress={() => router.push({ pathname: '/species/live', params: { uid: s.uid } })}
            />
          </View>
        ))}
      </ScrollView>
      {emptyMessage ? <Text style={styles.note}>{emptyMessage}</Text> : null}
    </View>
  );
}

/** Fetch a bounded page of live species for the given query (used by Home). */
export async function fetchLiveRow(query: Parameters<typeof fetchSpeciesPage>[0], limit = 8): Promise<EncyclopediaSpecies[]> {
  const page = await fetchSpeciesPage({ ...query, pageSize: limit }, 0);
  return page.items.slice(0, limit);
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  title: { ...Typography.subtitle, color: Colors.deepForest },
  subtitle: { ...Typography.caption, color: Colors.textSecondary },
  row: { gap: Spacing.md, paddingVertical: Spacing.xs },
  cell: { width: 230 },
  note: { ...Typography.caption, color: Colors.textSecondary, fontSize: 11 },
});
