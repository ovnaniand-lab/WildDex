import { Colors, Spacing, Typography } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  title: string;
  subtitle?: string;
  /** Show a back chevron (for stack screens). */
  showBack?: boolean;
  rightSlot?: React.ReactNode;
}

export default function ScreenHeader({ title, subtitle, showBack, rightSlot }: Props) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={styles.back}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        ) : null}
        <View style={styles.titles}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightSlot}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.leafTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  backText: { fontSize: 24, lineHeight: 26, color: Colors.forestGreen, fontWeight: '700' },
  titles: { flex: 1 },
  title: { ...Typography.title },
  subtitle: { ...Typography.caption, marginTop: 2 },
});
