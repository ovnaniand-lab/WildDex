import { Colors, Radius, Spacing, Typography, CardShadow } from '@/constants/theme';
import type { Species } from '@/data/types';
import { STATUS_META } from '@/utils/status';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  species: Species;
  onPress: () => void;
  /** Compact rows used in Explore lists; default is the tall card. */
  variant?: 'card' | 'row';
  discovered?: boolean;
}

export default function SpeciesCard({ species, onPress, variant = 'card', discovered }: Props) {
  const status = STATUS_META[species.status];

  if (variant === 'row') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${species.commonName}, ${species.scientificName}`}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <Image
          source={{ uri: species.imageUrl }}
          style={styles.rowImage}
          contentFit="cover"
          transition={200}
          accessibilityLabel={`Photograph of ${species.commonName}`}
        />
        <View style={styles.rowBody}>
          <Text style={styles.name} numberOfLines={1}>
            {species.commonName}
          </Text>
          <Text style={styles.scientific} numberOfLines={1}>
            {species.scientificName}
          </Text>
          <View style={styles.badges}>
            <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
              <Text style={[styles.statusText, { color: status.color }]} numberOfLines={1}>
                {status.label}
              </Text>
            </View>
            {discovered ? <Text style={styles.discoveredMark}>✓ Saved</Text> : null}
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${species.commonName}, ${species.scientificName}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, CardShadow, pressed && styles.pressed]}
    >
      <Image
        source={{ uri: species.imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={250}
        accessibilityLabel={`Photograph of ${species.commonName}`}
      />
      <View style={styles.cardOverlay}>
        <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
          <Text style={[styles.statusText, { color: status.color }]} numberOfLines={1}>
            {status.label}
          </Text>
        </View>
        {discovered ? (
          <View style={styles.savedChip}>
            <Text style={styles.savedChipText}>✓</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={1}>
          {species.commonName}
        </Text>
        <Text style={styles.scientific} numberOfLines={1}>
          {species.scientificName}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    width: '100%',
  },
  image: { width: '100%', height: 150, backgroundColor: Colors.leafTint },
  cardOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardBody: { padding: Spacing.md, gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
    ...CardShadow,
  },
  rowImage: { width: 72, height: 72, borderRadius: Radius.sm, backgroundColor: Colors.leafTint },
  rowBody: { flex: 1, gap: 3 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  name: { ...Typography.subtitle, fontSize: 16 },
  scientific: { ...Typography.caption, fontStyle: 'italic' },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    maxWidth: 190,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  discoveredMark: { fontSize: 12, fontWeight: '700', color: Colors.leafGreen },
  savedChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedChipText: { color: Colors.warmCream, fontWeight: '800' },
  chevron: { fontSize: 22, color: Colors.leafGreen, fontWeight: '700', paddingHorizontal: Spacing.xs },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
});
