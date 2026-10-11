import { Colors, Spacing, Typography } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';
import PrimaryButton from './PrimaryButton';

interface Props {
  emoji?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  emoji = '🍃',
  title,
  message,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} variant="secondary" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.leafTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emoji: { fontSize: 40 },
  title: { ...Typography.subtitle },
  message: { ...Typography.caption, textAlign: 'center', maxWidth: 280 },
  action: { marginTop: Spacing.sm },
});
