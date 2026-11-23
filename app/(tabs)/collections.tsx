
import CollectionCard from '@/components/CollectionCard';
import LoadingState from '@/components/LoadingState';
import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { repository } from '@/data/repository';
import type { Region, Species, SpeciesCategory } from '@/data/types';
import { useRepositoryData } from '@/hooks/useRepositories';
import { useWildDex } from '@/hooks/useWildDexState';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CollectionsScreen() {
  const router = useRouter();

  const {
  selectedRegionId,
  discoveries,
  discoveryRecords,
  discoveryCategories,
  hasDiscovery,
} = useWildDex();

  const regionsState = useRepositoryData<Region[]>(() => repository.getRegions(), []);
  const categoriesState = useRepositoryData<SpeciesCategory[]>(() => repository.getCategories(), []);
  const allSpeciesState = useRepositoryData<Species[]>(() => repository.getSpecies(), []);

  const allSpecies = allSpeciesState.data ?? [];

    const regionStats = (regionId: string) => {
    const inRegion = allSpecies.filter((species) =>
      species.regionIds.includes(regionId),
    );

    const foundIds = new Set(
      inRegion
        .filter((species) => hasDiscovery(species.id))
        .map((species) => species.id),
    );

    discoveryRecords
      .filter((record) => record.regionId === regionId)
      .forEach((record) => foundIds.add(record.speciesId));

    return {
      total: Math.max(inRegion.length, 6, foundIds.size),
      found: foundIds.size,
    };
  };

  const categoryStats = (categoryId: string) => {
  const speciesIds = new Set([
    ...discoveries,
    ...discoveryRecords.map((record) => record.speciesId),
  ]);

  const found = [...speciesIds].filter((speciesId) => {
    const record = discoveryRecords.find(
      (item) => item.speciesId === speciesId,
    );

    const savedCategory =
      record?.categoryId ??
      discoveryCategories[speciesId] ??
      allSpecies.find((species) => species.id === speciesId)?.categoryId;

    return savedCategory === categoryId;
  }).length;

  const catalogueTotal = allSpecies.filter(
    (species) => species.categoryId === categoryId,
  ).length;

  return {
    total: Math.max(catalogueTotal, 5, found),
    found,
  };
};

  const loading =
    regionsState.loading ||
    categoriesState.loading ||
    allSpeciesState.loading;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Collections</Text>

        <Text style={styles.subtitle}>
          {discoveries.length} species recorded · Fill your dex to unlock every collection.
        </Text>

        {loading ? (
          <LoadingState message="Opening your field binder..." />
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

            {/* My Discoveries navigation card */}
<Pressable
  style={({ pressed }) => [
    styles.myDiscoveriesCard,
    CardShadow,
    pressed && styles.pressed,
  ]}
  onPress={() => router.push('/discoveries')}
  accessibilityRole="button"
  accessibilityLabel={`Open My Discoveries, ${discoveryRecords.length} saved species`}
>
  <View style={styles.myDiscoveriesIcon}>
    <Text style={styles.myDiscoveriesEmoji}>📖</Text>
  </View>

  <View style={styles.myDiscoveriesInfo}>
    <Text style={styles.myDiscoveriesTitle}>My Discoveries</Text>
    <Text style={styles.myDiscoveriesSubtitle}>
      Your personal field journal
    </Text>
  </View>

  <Text style={styles.myDiscoveriesCount}>
    {discoveryRecords.length}
  </Text>

  <Text style={styles.myDiscoveriesArrow}>›</Text>
</Pressable>

            {/* Existing regional collections */}
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
                      onPress={() => router.push('/(tabs)/explore?category=all')}
                    />
                  </View>
                );
              })}
            </View>

            {/* Existing category collections */}
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
              Your discoveries are stored locally on this device.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  myDiscoveriesCard: {
  backgroundColor: Colors.white,
  borderRadius: Radius.lg,
  padding: Spacing.md,
  flexDirection: 'row',
  alignItems: 'center',
  gap: Spacing.md,
},

myDiscoveriesIcon: {
  width: 52,
  height: 52,
  borderRadius: Radius.md,
  backgroundColor: Colors.leafTint,
  alignItems: 'center',
  justifyContent: 'center',
},

myDiscoveriesEmoji: {
  fontSize: 25,
},

myDiscoveriesInfo: {
  flex: 1,
},

myDiscoveriesTitle: {
  ...Typography.subtitle,
},

myDiscoveriesSubtitle: {
  ...Typography.caption,
  marginTop: 3,
},

myDiscoveriesCount: {
  fontSize: 18,
  fontWeight: '700',
  color: Colors.forestGreen,
},

myDiscoveriesArrow: {
  fontSize: 27,
  color: Colors.textSecondary,
},
  safe: {
    flex: 1,
    backgroundColor: Colors.warmCream,
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  title: {
    ...Typography.display,
    fontSize: 26,
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 14,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.forestGreen,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textOnDark,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textOnDarkSecondary,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(248,245,234,0.25)',
  },
  sectionTitle: {
    ...Typography.subtitle,
    marginTop: Spacing.sm,
  },
  discoveriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discoverySubtitle: {
    ...Typography.caption,
    fontSize: 12,
  },
  discoveryCount: {
    color: Colors.forestGreen,
    fontWeight: '800',
    fontSize: 18,
  },
  discoveryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  discoveryCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  discoveryImage: {
    width: '100%',
    height: 145,
    backgroundColor: Colors.leafTint,
  },
  imagePlaceholder: {
    height: 145,
    backgroundColor: Colors.leafTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 42,
  },
  discoveryInfo: {
    padding: Spacing.sm,
    gap: 4,
  },
  discoveryName: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 14,
  },
  scientificName: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
  discoveryDate: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  emptyDiscoveries: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyEmoji: {
    fontSize: 38,
  },
  emptyTitle: {
    fontWeight: '800',
    color: Colors.textPrimary,
    fontSize: 15,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: '46%',
  },
  previewNote: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  pressed: {
    opacity: 0.88,
  },
});
