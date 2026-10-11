/**
 * Explore Screen — search, category chips, filters and species results.
 * Data comes from the Phase-1 preview repository (loading/empty states shown).
 */
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import SpeciesCard from '@/components/SpeciesCard';
import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { repository, type SpeciesFilters } from '@/data/repository';
import type { ConservationStatus, Species, SpeciesCategory } from '@/data/types';
import { useRepositoryData } from '@/hooks/useRepositories';
import { useWildDex } from '@/hooks/useWildDexState';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STATUS_OPTIONS: Array<{ id: ConservationStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All statuses' },
  { id: 'least-concern', label: 'Least Concern' },
  { id: 'near-threatened', label: 'Near Threatened' },
  { id: 'vulnerable', label: 'Vulnerable' },
  { id: 'endangered', label: 'Endangered' },
  { id: 'critically-endangered', label: 'Critically Endangered' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const { selectedRegionId, hasDiscovery } = useWildDex();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState<string>(params.category ?? 'all');
  const [status, setStatus] = useState<ConservationStatus | 'all'>('all');
  const [regionOnly, setRegionOnly] = useState(false);

  // Keep chip selection in sync when navigating from Home shortcuts.
  useEffect(() => {
    if (params.category) setCategory(params.category);
  }, [params.category]);

  // Debounce search input so we don't hammer the (future) API on each keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const categoriesState = useRepositoryData<SpeciesCategory[]>(() => repository.getCategories(), []);

  const filters = useMemo<SpeciesFilters>(
    () => ({
      query: debouncedQuery,
      categoryId: (category === 'all' ? 'all' : category) as SpeciesFilters['categoryId'],
      status,
      regionId: regionOnly ? selectedRegionId : 'all',
    }),
    [debouncedQuery, category, status, regionOnly, selectedRegionId],
  );

  const resultsState = useRepositoryData<Species[]>(
    () => repository.getSpecies(filters),
    [filters.query, filters.categoryId, filters.status, filters.regionId],
  );

  const chips = [{ id: 'all', name: 'All', emoji: '✨' } as unknown as SpeciesCategory].concat(
    categoriesState.data ?? [],
  );

  const clearFilters = () => {
    setCategory('all');
    setStatus('all');
    setRegionOnly(false);
    setQuery('');
  };

  const hasActiveFilters = category !== 'all' || status !== 'all' || regionOnly || debouncedQuery.length > 0;

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
            placeholder="Search species…"
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

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {chips.map((c) => {
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
                  {'emoji' in c ? `${c.emoji} ` : ''}
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Filter controls */}
        <View style={styles.filterRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cycle conservation status filter"
            onPress={() => {
              const idx = STATUS_OPTIONS.findIndex((o) => o.id === status);
              setStatus(STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length].id);
            }}
            style={[styles.filterPill, status !== 'all' && styles.filterPillActive]}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color={status === 'all' ? Colors.textSecondary : Colors.warmCream} />
            <Text style={[styles.filterText, status !== 'all' && styles.filterTextActive]}>
              {STATUS_OPTIONS.find((o) => o.id === status)?.label ?? 'Status'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Toggle my region only filter"
            onPress={() => setRegionOnly((v) => !v)}
            style={[styles.filterPill, regionOnly && styles.filterPillActive]}
          >
            <Ionicons name="locate-outline" size={16} color={regionOnly ? Colors.warmCream : Colors.textSecondary} />
            <Text style={[styles.filterText, regionOnly && styles.filterTextActive]}>My region</Text>
          </Pressable>
          {hasActiveFilters ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Reset all filters" onPress={clearFilters} style={styles.reset}>
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {resultsState.loading ? (
        <LoadingState message="Searching the field guide…" />
      ) : resultsState.error ? (
        <EmptyState
          emoji="📡"
          title="Something went wrong"
          message={resultsState.error}
          actionLabel="Try again"
          onAction={resultsState.refetch}
        />
      ) : (
        <FlatList
          data={resultsState.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              emoji="🌾"
              title="No species found"
              message="Nothing matches your search and filters yet. Try broadening them — full regional catalogs arrive with the Phase 2 backend."
              actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
              onAction={hasActiveFilters ? clearFilters : undefined}
            />
          }
          renderItem={({ item }) => (
            <SpeciesCard
              species={item}
              variant="row"
              discovered={hasDiscovery(item.id)}
              onPress={() => router.push(`/species/${item.id}`)}
            />
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
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingBottom: Spacing.sm },
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
  reset: { paddingHorizontal: Spacing.sm, paddingVertical: 7 },
  resetText: { fontSize: 12, fontWeight: '800', color: Colors.earthBrown },
  list: { padding: Spacing.md, paddingTop: Spacing.xs, gap: Spacing.sm, paddingBottom: Spacing.xxl },
});
