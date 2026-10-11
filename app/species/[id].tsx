/**
 * Species Details — hero photograph with attribution, names, conservation
 * status, habitat, taxonomy, regional information and a Save Discovery action
 * that persists to local storage (Phase 1) / backend (Phase 2).
 */
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { repository } from '@/data/repository';
import type { Species } from '@/data/types';
import { useRepositoryData } from '@/hooks/useRepositories';
import { useWildDex } from '@/hooks/useWildDexState';
import { STATUS_META } from '@/utils/status';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

export default function SpeciesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { hasDiscovery, saveDiscovery, selectedRegionId } = useWildDex();
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const state = useRepositoryData<Species | undefined>(
    () => repository.getSpeciesById(id ?? ''),
    [id],
  );
  const species = state.data;

  if (state.loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Species" showBack />
        <LoadingState message="Opening the field page…" />
      </SafeAreaView>
    );
  }

  if (!species) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Species" showBack />
        <EmptyState
          emoji="🍂"
          title="Species not found"
          message="This entry is not in the preview dataset yet. The full catalog arrives with the Phase 2 backend."
          actionLabel="Back to Explore"
          onAction={() => router.replace('/(tabs)/explore')}
        />
      </SafeAreaView>
    );
  }

  const status = STATUS_META[species.status];
  const category = repository.getCategoryById(species.categoryId);
  const saved = hasDiscovery(species.id) || justSaved;
  const regions = species.regionIds
    .map((r) => repository.getRegionById(r)?.name)
    .filter((n): n is string => Boolean(n));
  const inMyRegion = species.regionIds.includes(selectedRegionId);

  const onSave = async () => {
    if (saved) return;
    setSaving(true);
    try {
      await saveDiscovery(species.id);
      setJustSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero photo with floating back button + attribution */}
        <View>
          <Image
            source={{ uri: species.imageUrl }}
            style={styles.hero}
            contentFit="cover"
            transition={300}
            accessibilityLabel={`Photograph of ${species.commonName}`}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
            style={styles.floatingBack}
          >
            <Text style={styles.floatingBackText}>‹</Text>
          </Pressable>
          <View style={styles.heroOverlayBottom}>
            <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
              <Ionicons name="shield-checkmark" size={14} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
            <Text style={styles.attribution}>
              📷 {species.photoCredit.author} · {species.photoCredit.source} ·{' '}
              <Text
                onPress={() => Linking.openURL(species.photoCredit.url)}
                style={styles.attributionLink}
              >
                licence &amp; original
              </Text>
            </Text>
          </View>
        </View>

        {/* Names */}
        <View style={styles.namesBlock}>
          <Text style={styles.overline}>
            {category?.emoji ?? '🌿'} {category?.name ?? 'Species'}
          </Text>
          <Text style={styles.commonName}>{species.commonName}</Text>
          <Text style={styles.scientificName}>{species.scientificName}</Text>
          <Text style={styles.description}>{species.shortDescription}</Text>
        </View>

        {/* Habitat */}
        <View style={[styles.sectionCard, CardShadow]}>
          <View style={styles.sectionHead}>
            <Ionicons name="planet-outline" size={20} color={Colors.forestGreen} />
            <Text style={styles.sectionTitle}>Habitat</Text>
          </View>
          <Text style={styles.sectionBody}>{species.habitat}</Text>
          <Text style={styles.dietLine}>🍽️ Diet: {species.diet}</Text>
          {species.facts.map((f) => (
            <Text key={f} style={styles.factLine}>
              ✦ {f}
            </Text>
          ))}
        </View>

        {/* Taxonomy */}
        <View style={[styles.sectionCard, CardShadow]}>
          <View style={styles.sectionHead}>
            <Ionicons name="git-branch-outline" size={20} color={Colors.forestGreen} />
            <Text style={styles.sectionTitle}>Taxonomy</Text>
          </View>
          {Object.entries(species.taxonomy).map(([rank, value]) => (
            <View key={rank} style={styles.taxRow}>
              <Text style={styles.taxRank}>
                {rank.charAt(0).toUpperCase() + rank.slice(1)}
              </Text>
              <Text style={styles.taxValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Regional information */}
        <View style={[styles.sectionCard, CardShadow]}>
          <View style={styles.sectionHead}>
            <Ionicons name="map-outline" size={20} color={Colors.forestGreen} />
            <Text style={styles.sectionTitle}>Regional information</Text>
          </View>
          <Text style={styles.sectionBody}>{species.distribution}</Text>
          <Text style={styles.regionList}>Found in preview regions: {regions.join(' · ')}</Text>
          <View style={[styles.regionTag, { backgroundColor: inMyRegion ? Colors.leafTint : Colors.brownTint }]}>
            <Text style={{ color: inMyRegion ? '#2F6B3A' : Colors.earthBrown, fontWeight: '700', fontSize: 13 }}>
              {inMyRegion
                ? '✓ Lives within your selected region'
                : 'Outside your current region — switch regions to collect it'}
            </Text>
          </View>
        </View>

        {/* Save discovery */}
        <View style={styles.saveWrap}>
          <PrimaryButton
            label={saved ? 'Saved to your collection ✓' : 'Save Discovery'}
            size="lg"
            disabled={saved}
            loading={saving}
            onPress={onSave}
            accessibilityLabel={saved ? 'Already saved' : 'Save this species to your collection'}
          />
        </View>
        <Text style={styles.previewNote}>
          Species page content is Phase-1 preview data served by the local repository layer.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmCream },
  scroll: { paddingBottom: Spacing.xxl },
  hero: { width: '100%', height: 320, backgroundColor: Colors.leafTint },
  floatingBack: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.md,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(248,245,234,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBackText: { fontSize: 26, lineHeight: 28, fontWeight: '700', color: Colors.forestGreen },
  heroOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: 'rgba(23,59,44,0.55)',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  statusText: { fontSize: 12, fontWeight: '800' },
  attribution: { fontSize: 11, color: Colors.textOnDarkSecondary },
  attributionLink: { color: Colors.goldenAmber, textDecorationLine: 'underline' },
  namesBlock: { padding: Spacing.md, gap: 4 },
  overline: { ...Typography.overline },
  commonName: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  scientificName: { fontSize: 15, fontStyle: 'italic', color: Colors.textSecondary },
  description: { fontSize: 15, lineHeight: 22, color: Colors.textPrimary, marginTop: Spacing.sm },
  sectionCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { ...Typography.subtitle, fontSize: 16 },
  sectionBody: { fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
  dietLine: { fontSize: 13, color: Colors.textSecondary },
  factLine: { fontSize: 13, color: Colors.earthBrown },
  taxRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  taxRank: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  taxValue: { fontSize: 13, color: Colors.textPrimary, fontStyle: 'italic' },
  regionList: { fontSize: 13, color: Colors.textSecondary },
  regionTag: { padding: Spacing.sm, borderRadius: Radius.sm },
  saveWrap: { paddingHorizontal: Spacing.md },
  previewNote: { textAlign: 'center', fontSize: 11, color: Colors.textSecondary, paddingHorizontal: Spacing.lg, marginTop: Spacing.sm },
});
