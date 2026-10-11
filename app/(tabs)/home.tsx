/**
 * Home Dashboard — greeting, region card, featured wildlife, category
 * shortcuts, discovery statistics and the active challenge preview.
 * All content comes from the Phase-1 preview repository.
 */
import CategoryCard from '@/components/CategoryCard';
import EncyclopediaCard from '@/components/EncyclopediaCard';
import LiveSpeciesRow, { fetchLiveRow } from '@/components/LiveSpeciesRow';
import LoadingState from '@/components/LoadingState';
import PrimaryButton from '@/components/PrimaryButton';
import ProgressBar from '@/components/ProgressBar';
import SpeciesCard from '@/components/SpeciesCard';
import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { repository } from '@/data/repository';
import type { Challenge, Species, SpeciesCategory } from '@/data/types';
import { useRepositoryData } from '@/hooks/useRepositories';
import { useWildDex } from '@/hooks/useWildDexState';
import { getRecentSpecies, type RecentSpecies } from '@/src/api/encyclopedia';
import type { EncyclopediaSpecies, RegionContext } from '@/src/api/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const {
    selectedRegionId,
    discoveries,
    hasDiscovery,
    regionMode,
    selectedCountryCode,
    gpsPoint,
    radiusKm,
  } = useWildDex();

  // Phase-2 live region context (manual country or one-shot GPS nearby mode).
  const liveRegion: RegionContext | undefined =
    regionMode === 'gps' && gpsPoint
      ? { kind: 'nearby', lat: gpsPoint.lat, lon: gpsPoint.lon, radiusKm }
      : regionMode === 'manual' && selectedCountryCode
        ? { kind: 'country', countryCode: selectedCountryCode }
        : undefined;

  const [recents, setRecents] = useState<RecentSpecies[]>([]);
  useEffect(() => {
    let alive = true;
    getRecentSpecies().then((r) => alive && setRecents(r));
    return () => {
      alive = false;
    };
  }, []);

  const region = repository.getRegionById(selectedRegionId);
  const categoriesState = useRepositoryData<SpeciesCategory[]>(() => repository.getCategories(), []);
  const featuredState = useRepositoryData<Species[]>(() => repository.getFeaturedSpecies(), []);
  const challengeState = useRepositoryData<Challenge>(() => repository.getChallenge(), []);
  const regionSpeciesState = useRepositoryData<Species[]>(
    () => repository.getSpecies({ regionId: selectedRegionId }),
    [selectedRegionId],
  );

  const regionSpecies = regionSpeciesState.data ?? [];
  const discoveredCount = discoveries.length;
  const regionProgress = regionSpecies.length > 0 ? regionSpecies.filter((s) => hasDiscovery(s.id)).length : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header: logo + greeting */}
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Text style={styles.logoEmoji}>🦊</Text>
            </View>
            <View>
              <Text style={styles.logoText}>WildDex</Text>
              <Text style={styles.greeting}>Good day, explorer 👋</Text>
            </View>
          </View>
          <Link href="/(tabs)/collections" asChild>
            <View style={styles.dexChip}>
              <Ionicons name="book" size={16} color={Colors.forestGreen} />
              <Text style={styles.dexChipText}>{discoveredCount}</Text>
            </View>
          </Link>
        </View>

        {/* Current region card */}
        <View style={[styles.regionCard, CardShadow]}>
          <View style={styles.regionInfo}>
            <Text style={styles.overline}>Your adventure region</Text>
            <Text style={styles.regionName}>
              {region?.emoji ?? '🌍'} {region?.name ?? 'Unknown region'}
            </Text>
            <Text style={styles.regionBlurb}>{region?.blurb}</Text>
          </View>
          <PrimaryButton label="Change Region" onPress={() => router.push('/location')} />
        </View>

        {/* Discovery statistics */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, CardShadow]}>
            <Text style={styles.statValue}>{discoveredCount}</Text>
            <Text style={styles.statLabel}>Discoveries</Text>
          </View>
          <View style={[styles.statCard, CardShadow]}>
            <Text style={styles.statValue}>{regionSpecies.length}</Text>
            <Text style={styles.statLabel}>In your region</Text>
          </View>
          <View style={[styles.statCard, CardShadow]}>
            <Text style={styles.statValue}>{repository.getGlobalSpeciesCount().toLocaleString()}</Text>
            <Text style={styles.statLabel}>Worldwide</Text>
          </View>
        </View>

        {/* Phase 2 — live biodiversity rows (GBIF / iNaturalist). Each row
            hides itself while loading or offline so the dashboard never
            shows spinners that block Phase-1 content. */}
        <LiveSpeciesRow
          title={liveRegion ? 'Observed in your region' : 'Explore your region'}
          subtitle={
            liveRegion
              ? 'Species recorded by GBIF & iNaturalist contributors here — historical records, not guaranteed presence.'
              : 'Pick a country or nearby mode to see locally recorded species.'
          }
          buildQuery={() => fetchLiveRow({ category: 'all', region: liveRegion })}
        />

        {recents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recently viewed</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
              {recents.slice(0, 6).map((r) => (
                <EncyclopediaMini key={r.uid} recent={r} onPress={() => router.push({ pathname: '/species/live', params: { uid: r.uid } })} />
              ))}
            </ScrollView>
          </View>
        )}

        <LiveSpeciesRow
          title="Discover birds worldwide"
          subtitle="Real observations from the iNaturalist community."
          buildQuery={() => fetchLiveRow({ category: 'birds' })}
        />

        <LiveSpeciesRow
          title="Plants & fungi spotlight"
          subtitle="Green records from the global encyclopedia."
          buildQuery={() => fetchLiveRow({ category: 'plants' })}
        />

        {/* Featured wildlife */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured wildlife</Text>
            <Link href="/(tabs)/explore">
              <Text style={styles.seeAll}>See all</Text>
            </Link>
          </View>
          {featuredState.loading ? (
            <LoadingState message="Fetching today's highlights…" />
          ) : (
            <View style={styles.featuredRow}>
              {(featuredState.data ?? []).map((s) => (
                <View key={s.id} style={styles.featuredItem}>
                  <SpeciesCard
                    species={s}
                    discovered={hasDiscovery(s.id)}
                    onPress={() => router.push(`/species/${s.id}`)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Category shortcuts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by category</Text>
          {categoriesState.loading ? (
            <LoadingState />
          ) : (
            <View style={styles.categoryGrid}>
              {(categoriesState.data ?? []).map((c) => (
                <View key={c.id} style={styles.categoryCell}>
                  <CategoryCard
                    category={c}
                    onPress={() => router.push(`/(tabs)/explore?category=${c.id}`)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Active challenge preview */}
        {challengeState.data ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active challenge</Text>
            <View style={[styles.challengeCard, CardShadow]}>
              <View style={styles.challengeHeader}>
                <View style={styles.challengeEmoji}>
                  <Text style={{ fontSize: 28 }}>{challengeState.data.emoji}</Text>
                </View>
                <View style={styles.challengeTexts}>
                  <Text style={styles.challengeTitle}>{challengeState.data.title}</Text>
                  <Text style={styles.challengeDesc}>{challengeState.data.description}</Text>
                </View>
              </View>
              <ProgressBar progress={challengeState.data.progress / challengeState.data.goal} height={8} />
              <Text style={styles.challengeMeta}>
                {challengeState.data.progress} of {challengeState.data.goal} done · Reward:{' '}
                {challengeState.data.reward}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Regional progress + CTA */}
        <View style={[styles.progressCard, CardShadow]}>
          <Text style={styles.sectionTitle}>Regional collection progress</Text>
          <ProgressBar
            progress={regionSpecies.length ? regionProgress / regionSpecies.length : 0}
            color={Colors.leafGreen}
          />
          <Text style={styles.challengeMeta}>
            {regionProgress} of {regionSpecies.length} species recorded in {region?.name ?? 'your region'}
          </Text>
        </View>

        <PrimaryButton
          label="Explore Nature 🌿"
          size="lg"
          onPress={() => router.push('/(tabs)/explore')}
          style={styles.exploreCta}
          accessibilityLabel="Explore nature species"
        />

        <Text style={styles.previewNote}>
          Phase 1 preview data — live species services arrive in Phase 2.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmCream },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoMark: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 24 },
  logoText: { fontSize: 22, fontWeight: '800', color: Colors.forestGreen },
  greeting: { ...Typography.caption },
  dexChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.leafTint,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  dexChipText: { fontWeight: '800', color: Colors.forestGreen },
  regionCard: {
    backgroundColor: Colors.deepForest,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  regionInfo: { gap: 4 },
  overline: { ...Typography.overline, color: Colors.goldenAmber },
  regionName: { fontSize: 20, fontWeight: '800', color: Colors.textOnDark },
  regionBlurb: { fontSize: 13, color: Colors.textOnDarkSecondary },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.forestGreen },
  statLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...Typography.subtitle },
  seeAll: { color: Colors.leafGreen, fontWeight: '700' },
  featuredRow: { flexDirection: 'row', gap: Spacing.sm },
  featuredItem: { flex: 1 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryCell: { flexGrow: 1, flexBasis: '29%', minWidth: 96 },
  challengeCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
  challengeHeader: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  challengeEmoji: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.amberTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeTexts: { flex: 1 },
  challengeTitle: { fontWeight: '800', fontSize: 16, color: Colors.textPrimary },
  challengeDesc: { fontSize: 13, color: Colors.textSecondary },
  challengeMeta: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  progressCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
  exploreCta: { marginTop: Spacing.xs },
  previewNote: { textAlign: 'center', fontSize: 11, color: Colors.textSecondary, marginTop: Spacing.sm },
});


/** Small recently-viewed tile (local data only — works offline). */
function EncyclopediaMini({ recent, onPress }: { recent: RecentSpecies; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [miniStyles.tile, pressed && { opacity: 0.8 }]}>
      {recent.imageUrl ? (
        <Image source={{ uri: recent.imageUrl }} style={miniStyles.img} contentFit="cover" recyclingKey={recent.uid} />
      ) : (
        <View style={miniStyles.imgFallback}>
          <Text style={{ fontSize: 26 }}>🌿</Text>
        </View>
      )}
      <Text style={miniStyles.name} numberOfLines={1}>{recent.commonName}</Text>
      <Text style={miniStyles.sci} numberOfLines={1}>{recent.scientificName}</Text>
    </Pressable>
  );
}

const miniStyles = StyleSheet.create({
  tile: { width: 130, backgroundColor: Colors.white, borderRadius: Radius.md, ...CardShadow, overflow: 'hidden', padding: Spacing.sm, gap: 2 },
  img: { width: '100%', height: 90, borderRadius: Radius.sm, backgroundColor: Colors.leafTint },
  imgFallback: { width: '100%', height: 90, borderRadius: Radius.sm, backgroundColor: Colors.leafTint, alignItems: 'center', justifyContent: 'center' },
  name: { ...Typography.caption, color: Colors.textPrimary, fontWeight: '700' },
  sci: { fontSize: 11, color: Colors.textSecondary, fontStyle: 'italic' },
});
