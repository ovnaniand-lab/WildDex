import { CardShadow, Colors, Radius, Spacing } from '@/constants/theme';
import type { SpeciesCategory } from '@/data/types';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  category: SpeciesCategory;
  onPress: () => void;
  count?: number;
  selected?: boolean;
}

/** Rounded nature-icon shortcut tile (Home grid / Explore chips). */
export default function CategoryCard({ category, onPress, count, selected }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${category.name}${count !== undefined ? `, ${count} species` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        CardShadow,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.emoji}>{category.emoji}</Text>
      </View>
      <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
        {category.name}
      </Text>
      {count !== undefined ? <Text style={styles.count}>{count} species</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    gap: 6,
    minWidth: 100,
  },
  selected: { backgroundColor: Colors.forestGreen },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.leafTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  name: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  nameSelected: { color: Colors.textOnDark },
  count: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});
