/**
 * EncyclopediaCard — species card for Phase-2 live results.
 * Renders the normalized `EncyclopediaSpecies` model with photo, names,
 * provider badge and observation evidence; falls back gracefully when a
 * taxon has no photograph (monogram tile instead of a broken image).
 */

import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { SpeciesCategoryId } from '@/data/types';
import { CATEGORIES } from '@/data/previewData';
import type { EncyclopediaSpecies } from '@/src/api/types';
import { formatCount } from '@/utils/status';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  species: EncyclopediaSpecies;
  onPress: () => void;
  discovered?: boolean;
}

function categoryEmoji(id: SpeciesCategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.emoji ?? '🌱';
}

function EncyclopediaCardBase({ species, onPress, discovered }: Props) {
  const photo = species.photos[0];
  const initial = (species.commonName || species.scientificName)[0]?.toUpperCase() ?? '?';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${species.commonName}, ${species.scientificName}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {photo ? (
        <Image
          source={{ uri: photo.url }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          recyclingKey={species.uid}
          accessibilityLabel={`Photograph of ${species.commonName}`}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>{categoryEmoji(species.categoryId)}</Text>
          <Text style={styles.placeholderInitial}>{initial}</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.common} numberOfLines={1}>
            {species.commonName}
          </Text>
          {discovered ? (
            <Ionicons name="checkmark-circle" size={18} color={Colors.goldenAmber} />
          ) : null}
        </View>
        <Text style={styles.scientific} numberOfLines={1}>
          {species.scientificName}
        </Text>
        <View style={styles.footer}>
          <View style={[styles.badge, species.source === 'gbif' ? styles.badgeGbif : styles.badgeInat]}>
            <Text style={styles.badgeText}>{species.source === 'gbif' ? 'GBIF' : 'iNaturalist'}</Text>
          </View>
          {species.observationCount !== undefined ? (
            <Text style={styles.count}>
              📍 {formatCount(species.observationCount)} obs recorded
            </Text>
          ) : (
            <Text style={styles.count}>{categoryEmoji(species.categoryId)} species record</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const EncyclopediaCard = memo(EncyclopediaCardBase);
export default EncyclopediaCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...CardShadow,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  image: { width: '100%', height: 168, backgroundColor: Colors.leafTint },
  placeholder: {
    width: '100%',
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.leafTint,
    gap: 4,
  },
  placeholderEmoji: { fontSize: 40 },
  placeholderInitial: { ...Typography.title, color: Colors.deepForest, fontSize: 20 },
  body: { padding: Spacing.md, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  common: { ...Typography.title, flex: 1 },
  scientific: { ...Typography.caption, fontStyle: 'italic', fontSize: 13 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: Spacing.sm },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  badgeInat: { backgroundColor: '#E4EEF7' },
  badgeGbif: { backgroundColor: Colors.amberTint },
  badgeText: { fontSize: 10, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 0.4 },
  count: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, flexShrink: 1 },
});
