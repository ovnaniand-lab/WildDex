/**
 * Explore Screen — Phase 2 living encyclopedia.
 *
 * Live search + taxonomic category filters over GBIF / iNaturalist via the
 * encyclopedia facade (no API logic in this file). Supports worldwide browse,
 * free-text search by common or scientific name, pagination and explicit
 * loading / empty / network-error states. The "My region" toggle restricts
 * results to species *recorded* in the selected country or GPS area — the
 * label never implies guaranteed current presence.
 */
import EmptyState from '@/components/EmptyState';
import EncyclopediaCard from '@/components/EncyclopediaCard';
import LoadingState from '@/components/LoadingState';
import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { SpeciesCategoryId } from '@/data/types';
import { useWildDex } from '@/hooks/useWildDexState';
import { useInfiniteSpecies } from '@/hooks/useInfiniteSpecies';
import { CATEGORIES } from '@/data/previewData';
import type { ExploreQuery, RegionContext } from '@/src/api/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Category chips: All + WildDex buckets (Ants stays inside Insects too). */
const CHIPS: Array<{ id: SpeciesCategoryId | 'all'; name: string; emoji: string }> = [
  { id: 'all', name: 'All', emoji: '✨' },
  ...CATEGORIES.map((c) => ({ id: c.id as SpeciesCategoryId, name: c.name, emoji: c.emoji })),
];

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const { hasDiscovery, regionMode, selectedCountryCode, gpsPoint, radiusKm } = useWildDex();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState<SpeciesCategoryId | 'all'>(
    (params.category as SpeciesCategoryId) ?? 'all',
  );
  const [regionOnly, setRegionOnly] = useState(false);

  // Keep chip selection in sync when navigating from Home shortcuts.
  useEffect(() => {
    if (params.category) setCategory(params.category as SpeciesCategoryId);
  }, [params.category]);

  // Debounce search input so we don't hammer the public APIs on each keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const region = useMemo<RegionContext | undefined>(() => {
    if (!regionOnly) return undefined;
    if (regionMode === 'gps' && gpsPoint) {
      return { kind: 'nearby', lat: gpsPoint.lat, lon: gpsPoint.lon, radiusKm };
    }
    if (selectedCountryCode) {
      return { kind: 'country', countryCode: selectedCountryCode };
    }
    return undefined;
  }, [regionOnly, regionMode, gpsPoint, radiusKm, selectedCountryCode]);

  const exploreQuery = useMemo<ExploreQuery>(
    () => ({
      text: debouncedQuery.trim() || undefined,
      category,
      region,
      pageSize: 20,
    }),
    [debouncedQuery, category, region],
  );

  const { items, loading, loadingMore, error, endOfRecords, totalResults, refresh, loadMore } =
    useInfiniteSpecies(exploreQuery);

  const onEndReached = useCallback(() => {
    loadMore();
  }, [loadMore]);

  const clearFilters = () => {
    setCategory('all');
    setRegionOnly(false);
    setQuery('');
  };

  const hasActiveFilters = category !== 'all' || regionOnly || debouncedQuery.length > 0;
  const regionLabel =
    region?.kind === 'nearby' ? `within ${region.radiusKm ?? 50} km of you` : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        {/* Search bar */}
        <View style={[styles.searchBox, CardShadow]}>
          <Ionicons name="search" size={20} color={Colors.leafGreen} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search common or scientific name…"
            placeholderTextColor={Colors.textSecondary}
            style={styles.searchInput}
            accessibilityLabel="Search species"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {/* Category chips (taxon-key filtered, not keyword guessing) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CHIPS.map((c) => {
            const active = category === c.id;
            return (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${c.name}`}
                onPress={() => setCategory(c.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {c.emoji} {c.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Filter controls */}
        <View style={styles.filterRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Toggle selected region filter"
            onPress={() => setRegionOnly((v) => !v)}
            style={[styles.filterPill, regionOnly && styles.filterPillActive]}
          >
            <Ionicons name="locate-outline" size={16} color={regionOnly ? Colors.warmCream : Colors.textSecondary} />
            <Text style={[styles.filterText, regionOnly && styles.filterTextActive]}>
              {regionOnly ? (regionLabel ?? 'Selected region only') : 'My region'}
            </Text>
          </Pressable>
          {!regionOnly ? (
            <Text style={styles.scopeHint}>🌍 Worldwide results</Text>
          ) : !region ? (
            <Text style={styles.scopeHint}>Set a region in “Change region” first</Text>
          ) : null}
          {hasActiveFilters ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Reset all filters" onPress={clearFilters} style={styles.reset}>
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          ) : null}
        </View>
        {totalResults !== undefined && !loading && !error ? (
          <Text style={styles.countHint}>
            {totalResults.toLocaleString()} taxa match · showing {items.length}. Results are species
            recorded by GBIF / iNaturalist contributors.
          </Text>
        ) : null}
      </View>

      {loading ? (
        <LoadingState message="Searching the living encyclopedia…" />
      ) : error ? (
        <EmptyState
          emoji="📡"
          title="Couldn’t reach nature’s database"
          message={`${error} Your filters are kept — try again.`}
          actionLabel="Retry"
          onAction={refresh}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.uid}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.list}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <EmptyState
              emoji="🌾"
              title="No species found"
              message="Nothing matches your search right now. Try fewer words, another category, or browsing worldwide."
              actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
              onAction={hasActiveFilters ? clearFilters : undefined}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={Colors.forestGreen} />
                <Text style={styles.footerText}>Loading more species…</Text>
              </View>
            ) : endOfRecords && items.length > 0 ? (
              <View style={styles.footer}>
                <Text style={styles.footerText}>🌿 That’s everything for this search.</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <EncyclopediaCard
                species={item}
                discovered={hasDiscovery(item.uid)}
                onPress={() => router.push(`/species/${encodeURIComponent(item.uid)}`)}
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmCream },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.sm },
  title: { ...Typography.display, fontSize: 26 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 16, color: Colors.textPrimary, padding: 0 },
  chipRow: { gap: Spacing.sm, paddingVertical: 4 },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.forestGreen, borderColor: Colors.forestGreen },
  chipText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  chipTextActive: { color: Colors.textOnDark },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingBottom: Spacing.xs, flexWrap: 'wrap' },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: { backgroundColor: Colors.leafGreen, borderColor: Colors.leafGreen },
  filterText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  filterTextActive: { color: Colors.textOnDark },
  scopeHint: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, flexShrink: 1 },
  reset: { paddingHorizontal: Spacing.sm, paddingVertical: 7 },
  resetText: { fontSize: 12, fontWeight: '800', color: Colors.earthBrown },
  countHint: { fontSize: 11, color: Colors.textSecondary, lineHeight: 15 },
  list: { padding: Spacing.md, paddingTop: Spacing.xs, paddingBottom: Spacing.xxl },
  columnWrapper: { gap: Spacing.sm },
  cell: { flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: Spacing.lg },
  footerText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
});
