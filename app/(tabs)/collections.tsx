/**
 * Collections Screen — regional collections and category collections with
 * discovery progress. A collection is "locked" until the user has recorded
 * at least one species inside it (Phase-1 local rule; Phase 2 will sync).
 */
import CollectionCard from '@/components/CollectionCard';
import LoadingState from '@/components/LoadingState';
import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { repository } from '@/data/repository';
import type { Region, Species, SpeciesCategory } from '@/data/types';
import { useRepositoryData } from '@/hooks/useRepositories';
import { useWildDex } from '@/hooks/useWildDexState';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CollectionsScreen() {
  const router = useRouter();
  const { selectedRegionId, discoveries, hasDiscovery } = useWildDex();

  const regionsState = useRepositoryData<Region[]>(() => repository.getRegions(), []);
  const categoriesState = useRepositoryData<SpeciesCategory[]>(() => repository.getCategories(), []);
  const allSpeciesState = useRepositoryData<Species[]>(() => repository.getSpecies(), []);

  const allSpecies = allSpeciesState.data ?? [];

  const regionStats = (regionId: string) => {
    const inRegion = allSpecies.filter((s) => s.regionIds.includes(regionId));
    const found = inRegion.filter((s) => hasDiscovery(s.id)).length;
    return { total: Math.max(inRegion.length, 6), found };
  };

  const categoryStats = (categoryId: string) => {
    const inCat = allSpecies.filter((s) => s.categoryId === categoryId);
    const found = inCat.filter((s) => hasDiscovery(s.id)).length;
    return { total: Math.max(inCat.length, 5), found };
  };

  const loading = regionsState.loading || categoriesState.loading || allSpeciesState.loading;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Collections</Text>
        <Text style={styles.subtitle}>
          {discoveries.length} species recorded · Fill your dex to unlock every collection.
        </Text>

        {loading ? (
          <LoadingState message="Opening your field binder…" />
        ) : (
          <>
            <View style={[styles.summaryCard, CardShadow]}>
              <Text style={styles.summaryValue}>{discoveries.length}</Text>
              <Text style={styles.summaryLabel}>Total discoveries</Text>
              <View style={styles.summaryDivider} />
              <Text style={styles.summaryValue}>
                {categoriesState.data?.filter((c) => categoryStats(c.id).found > 0).length ?? 0}/
                {categoriesState.data?.length ?? 0}
              </Text>
              <Text style={styles.summaryLabel}>Categories unlocked</Text>
            </View>

            <Text style={styles.sectionTitle}>Regional collections</Text>
            <View style={styles.grid}>
              {(regionsState.data ?? []).map((r) => {
                const stats = regionStats(r.id);
                const locked = stats.found === 0 && r.id !== selectedRegionId;
                return (
                  <View key={r.id} style={styles.gridItem}>
                    <CollectionCard
                      title={r.name}
                      subtitle={`${r.continent} · ${r.country}`}
                      emoji={r.emoji}
                      discovered={stats.found}
                      total={stats.total}
                      locked={locked}
                      onPress={() => router.push(`/(tabs)/explore?category=all`)}
                    />
                  </View>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Category collections</Text>
            <View style={styles.grid}>
              {(categoriesState.data ?? []).map((c) => {
                const stats = categoryStats(c.id);
                const locked = stats.found === 0;
                return (
                  <View key={c.id} style={styles.gridItem}>
                    <CollectionCard
                      title={c.name}
                      subtitle={c.description}
                      emoji={c.emoji}
                      discovered={stats.found}
                      total={stats.total}
                      locked={locked}
                      onPress={() => router.push(`/(tabs)/explore?category=${c.id}`)}
                    />
                  </View>
                );
              })}
            </View>

            <Text style={styles.previewNote}>
              Progress is stored on this device in Phase 1 and will sync to your WildDex account in Phase 2.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmCream },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  title: { ...Typography.display, fontSize: 26 },
  subtitle: { ...Typography.caption, fontSize: 14 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.forestGreen,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
  },
  summaryValue: { fontSize: 24, fontWeight: '800', color: Colors.textOnDark },
  summaryLabel: { fontSize: 12, color: Colors.textOnDarkSecondary, fontWeight: '600' },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(248,245,234,0.25)' },
  sectionTitle: { ...Typography.subtitle, marginTop: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  gridItem: { flexGrow: 1, flexBasis: '46%' },
  previewNote: { textAlign: 'center', fontSize: 11, color: Colors.textSecondary, marginTop: Spacing.sm },
});
