import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import ProgressBar from './ProgressBar';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  title: string;
  subtitle?: string;
  emoji: string;
  discovered: number;
  total: number;
  locked?: boolean;
  onPress: () => void;
}

/** Collection tile with progress ring bar and locked/unlocked states. */
export default function CollectionCard({
  title,
  subtitle,
  emoji,
  discovered,
  total,
  locked,
  onPress,
}: Props) {
  const progress = total > 0 ? discovered / total : 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}${locked ? ', locked' : ''}, ${discovered} of ${total} discovered`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, CardShadow, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={[styles.iconCircle, locked && styles.iconLocked]}>
          <Text style={styles.emoji}>{locked ? '🔒' : emoji}</Text>
        </View>
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Text style={styles.ratio}>
          {discovered}/{total}
        </Text>
      </View>
      <ProgressBar
        progress={progress}
        height={8}
        color={locked ? Colors.leafGreen : Colors.goldenAmber}
        accessibleLabel={`${Math.round(progress * 100)} percent discovered`}
      />
      {locked ? <Text style={styles.lockNote}>Discover species to unlock this collection</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.leafTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLocked: { backgroundColor: Colors.brownTint },
  emoji: { fontSize: 22 },
  titles: { flex: 1 },
  title: { ...Typography.subtitle, fontSize: 15 },
  subtitle: { ...Typography.caption, fontSize: 12 },
  ratio: { fontWeight: '800', color: Colors.forestGreen, fontSize: 14 },
  lockNote: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic' },
  pressed: { opacity: 0.92 },
});
