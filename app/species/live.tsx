/**
 * WildDex Species Profile (Phase 2) — live encyclopedia page.
 *
 * Route: /species/live?uid=inat:42007  (or gbif:<nubKey>)
 *
 * Shows only data actually returned by GBIF / iNaturalist: names, full
 * taxonomy, photo gallery with licence attribution, descriptions when a
 * reliable source provides one, observation evidence for the selected
 * region, and links to the original provider records. Missing fields get
 * honest fallbacks — content is never invented.
 */
import EmptyState from '@/components/EmptyState';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import { CardShadow, Colors, Radius, SoftShadow, Spacing, Typography } from '@/constants/theme';
import { useRepositoryData } from '@/hooks/useRepositories';
import { useWildDex } from '@/hooks/useWildDexState';
import { formatCount } from '@/utils/status';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { getSpeciesByUid, recordSpeciesView, type SpeciesDetail } from '@/src/api/encyclopedia';
import type { RegionContext } from '@/src/api/types';

// Semantic aliases so the profile matches the WildDex design system.
const palette = {
  ...Colors,
  muted: Colors.textSecondary,
  surface: Colors.white,
  divider: Colors.border,
  softGreen: Colors.leafTint,
};

const RANK_ORDER: Array<[keyof SpeciesDetail['fullTaxonomy'], string]> = [
  ['kingdom', 'Kingdom'],
  ['phylum', 'Phylum'],
  ['class', 'Class'],
  ['order', 'Order'],
  ['family', 'Family'],
  ['genus', 'Genus'],
  ['species', 'Species'],
];

export default function LiveSpeciesProfileScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { hasDiscovery, saveDiscovery, regionMode, selectedCountryCode, gpsPoint, radiusKm } = useWildDex();

  const region: RegionContext | undefined =
    regionMode === 'gps' && gpsPoint
      ? { kind: 'nearby', lat: gpsPoint.lat, lon: gpsPoint.lon, radiusKm }
      : regionMode === 'manual' && selectedCountryCode
        ? { kind: 'country', countryCode: selectedCountryCode }
        : undefined;

  const state = useRepositoryData<SpeciesDetail | null>(() => (uid ? getSpeciesByUid(uid, region) : Promise.resolve(null)), [uid]);
  const species = state.data;

  const [galleryIndex, setGalleryIndex] = useState(0);
  useEffect(() => setGalleryIndex(0), [uid]);

  // Record view for Home's "Recently viewed" (fire-and-forget).
  useEffect(() => {
    if (species) void recordSpeciesView(species);
  }, [species]);

  if (state.loading) {
    return (
      <View style={styles.safe}>
        <ScreenHeader title="Species" showBack />
        <View style={styles.loadingCenter}>
          <Text style={styles.loadingText}>Loading from the encyclopedia…</Text>
        </View>
      </View>
    );
  }

  if (!uid || !species) {
    return (
      <View style={styles.safe}>
        <ScreenHeader title="Species" showBack />
        <EmptyState
          emoji="🍃"
          title="Profile unavailable"
          message="This species could not be loaded from GBIF or iNaturalist. The record may have been merged or removed."
          actionLabel="Try another species"
          onAction={() => router.push('/(tabs)/explore')}
        />
      </View>
    );
  }

  const heroH = Math.round(width * 0.62);
  const photo = species.photos[galleryIndex] ?? species.photos[0];
  const saved = hasDiscovery(species.uid);

  return (
    <View style={styles.safe}>
      <ScreenHeader title={species.commonName.length > 18 ? 'Species' : species.commonName} showBack />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero photograph */}
        {photo ? (
          <View style={styles.heroWrap}>
            <Image
              source={{ uri: photo.url }}
              style={[styles.hero, { height: heroH }]}
              contentFit="cover"
              transition={250}
              recyclingKey={`${species.uid}-${galleryIndex}`}
              accessibilityLabel={`Photograph of ${species.commonName}`}
            />
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{species.source === 'gbif' ? 'GBIF' : 'iNaturalist'}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.heroFallback, { height: Math.round(heroH * 0.6) }]}>
            <Text style={styles.heroFallbackEmoji}>🌿</Text>
            <Text style={styles.heroFallbackText}>No photograph available yet</Text>
          </View>
        )}

        {/* Names */}
        <View style={styles.nameCard}>
          <Text style={styles.common}>{species.commonName}</Text>
          <Text style={styles.scientific}>{species.scientificName}</Text>
          {!!species.observationCount && (
            <Text style={styles.evidenceNote}>
              📋 {formatCount(species.observationCount)} contributor observations recorded in{' '}
              {region?.kind === 'nearby' ? `your nearby area (~${region.radiusKm ?? 50} km)` : region?.countryName ?? 'the selected region'}
            </Text>
          )}
        </View>

        {/* Gallery thumbnails */}
        {species.gallery.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photographs</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
              {species.gallery.slice(0, 8).map((p, i) => (
                <Pressable key={`${p.url}-${i}`} onPress={() => setGalleryIndex(i)} style={[styles.thumbWrap, i === galleryIndex && styles.thumbActive]}>
                  <Image source={{ uri: p.url }} style={styles.thumb} contentFit="cover" recyclingKey={`${species.uid}-t-${i}`} />
                </Pressable>
              ))}
            </ScrollView>
            {photo && (
              <Text style={styles.attribution} accessibilityRole="text">
                📷 {photo.attribution}
                {photo.originalUrl ? ' · tap the source link below to view the original' : ''}
              </Text>
            )}
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          {species.summary ? (
            <Text style={styles.paragraph}>{species.summary}</Text>
          ) : (
            <Text style={styles.fallback}>No description is available from a reliable source for this taxon yet.</Text>
          )}
        </View>

        {/* Taxonomy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Classification</Text>
          <View style={styles.taxonomyCard}>
            {RANK_ORDER.map(([key, label], idx) => {
              const value = species.fullTaxonomy[key];
              if (!value) return null;
              return (
                <View key={label} style={[styles.taxRow, idx > 0 && styles.taxRowBorder]}>
                  <Text style={styles.taxLabel}>{label}</Text>
                  <Text style={[styles.taxValue, key === 'species' && styles.taxItalic]}>{value}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Habitat & distribution (honest sourcing) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where it has been observed</Text>
          <View style={styles.infoCard}>
            {region ? (
              <>
                <InfoLine icon="map-outline" text={region.kind === 'nearby'
                    ? `Observed within ~${region.radiusKm ?? 50} km of your location.`
                    : `Records from ${region.countryName ?? region.countryCode ?? 'selected country'}.`} />
                <InfoLine icon="time-outline" text={species.lastObserved ? `Most recent record: ${species.lastObserved}.` : 'Recent observation date not returned by the provider.'} />
                <InfoLine icon="information-circle-outline" muted text="Occurrence records show historical observations — they do not guarantee the species is present right now." />
              </>
            ) : (
              <InfoLine icon="globe-outline" text="Worldwide records. Choose a country or enable nearby mode to see local observations." />
            )}
            {species.recentObservations.length > 0 && (
              <InfoLine
                icon="images-outline"
                text={`Sample recent observations: ${species.recentObservations
                  .slice(0, 3)
                  .map((o) => o.date ?? 'undated')
                  .join(', ')}.`}
              />
            )}
          </View>
        </View>

        {/* Conservation status — only shown when sourced */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conservation status</Text>
          <Text style={styles.fallback}>
            Not shown because neither GBIF nor iNaturalist returned a sourced status for this taxon. WildDex never estimates this field.
          </Text>
        </View>

        {/* Data & attribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data sources</Text>
          <View style={styles.infoCard}>
            <SourceLink
              icon="leaf-outline"
              label={`GBIF Backbone Taxonomy${species.gbifNubKey ? ` (record ${species.gbifNubKey})` : ''}`}
              href={species.gbifNubKey ? `https://www.gbif.org/species/${species.gbifNubKey}` : 'https://www.gbif.org'}
            />
            <SourceLink
              icon="camera-reverse-outline"
              label={`iNaturalist taxon page${species.inatTaxonId ? ` (#${species.inatTaxonId})` : ''}`}
              href={species.inatTaxonId ? `https://www.inaturalist.org/taxa/${species.inatTaxonId}` : 'https://www.inaturalist.org'}
            />
            {!!photo?.originalUrl && <SourceLink icon="image-outline" label="Original photograph" href={photo.originalUrl} />}
            <InfoLine icon="document-text-outline" muted text={`Dataset licence: ${species.dataLicense ?? 'see provider pages'}. Photos keep their individual CC licences.`} />
          </View>
        </View>

        {/* Save discovery */}
        <View style={styles.cta}>
          <PrimaryButton
            label={saved ? '✓ Saved to your collections' : '💾 Save Discovery'}
            onPress={() => {
              if (!saved) void saveDiscovery(species.uid);
            }}
            disabled={saved}
          />
        </View>
        <Text style={styles.footnote}>Species recorded by the global biodiversity community. Help us keep nature wonder full →</Text>
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

function InfoLine({ icon, text, muted }: { icon: keyof typeof ION_MAP; text: string; muted?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={ION_MAP[icon]} size={18} color={muted ? palette.muted : Colors.leafGreen} />
      <Text style={[styles.infoText, muted && styles.infoMuted]}>{text}</Text>
    </View>
  );
}

const ION_MAP = {
  'map-outline': 'map-outline',
  'time-outline': 'time-outline',
  'information-circle-outline': 'information-circle-outline',
  'globe-outline': 'globe-outline',
  'images-outline': 'images-outline',
  'document-text-outline': 'document-text-outline',
  'leaf-outline': 'leaf-outline',
  'camera-reverse-outline': 'camera-reverse-outline',
  'image-outline': 'image-outline',
} as const;

function SourceLink({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => void Linking.openURL(href)}
      style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icon as never} size={18} color={Colors.goldenAmber} />
      <Text style={styles.linkText} numberOfLines={1}>{label}</Text>
      <Ionicons name="open-outline" size={16} color={palette.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmCream },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.caption, color: palette.muted },
  scroll: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  heroWrap: { marginTop: Spacing.sm },
  hero: { width: '100%', borderRadius: Radius.lg, backgroundColor: Colors.deepForest },
  heroBadge: { position: 'absolute', top: Spacing.sm, left: Spacing.sm, backgroundColor: 'rgba(23,59,44,0.85)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  heroBadgeText: { color: Colors.warmCream, fontSize: Typography.caption.fontSize, fontWeight: '700' },
  heroFallback: { alignItems: 'center', justifyContent: 'center', borderRadius: Radius.lg, backgroundColor: palette.softGreen },
  heroFallbackEmoji: { fontSize: 44 },
  heroFallbackText: { ...Typography.caption, color: palette.muted, marginTop: 4 },
  nameCard: { ...SoftShadow, backgroundColor: palette.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 2 },
  common: { ...Typography.title, color: Colors.deepForest },
  scientific: { ...Typography.caption, color: palette.muted, fontStyle: 'italic' },
  evidenceNote: { ...Typography.caption, color: Colors.earthBrown, marginTop: 6 },
  section: { gap: Spacing.sm },
  sectionTitle: { ...Typography.subtitle, color: Colors.forestGreen },
  paragraph: { ...Typography.body, color: Colors.textPrimary },
  fallback: { ...Typography.caption, color: palette.muted, fontStyle: 'italic' },
  taxonomyCard: { ...SoftShadow, backgroundColor: palette.surface, borderRadius: Radius.lg, overflow: 'hidden' },
  taxRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 10 },
  taxRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.divider },
  taxLabel: { ...Typography.caption, color: palette.muted },
  taxValue: { ...Typography.caption, color: Colors.textPrimary, fontWeight: '600' },
  taxItalic: { fontStyle: 'italic' },
  infoCard: { ...SoftShadow, backgroundColor: palette.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
  infoRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  infoText: { ...Typography.caption, color: Colors.textPrimary, flex: 1 },
  infoMuted: { color: palette.muted },
  galleryRow: { gap: Spacing.sm },
  thumbWrap: { borderRadius: Radius.md, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: Colors.goldenAmber },
  thumb: { width: 72, height: 72 },
  attribution: { ...Typography.caption, color: palette.muted },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkText: { ...Typography.caption, color: Colors.forestGreen, fontWeight: '600', flex: 1 },
  cta: { marginTop: Spacing.sm },
  footnote: { ...Typography.caption, color: palette.muted, textAlign: 'center', marginTop: Spacing.sm },
});
