import { Colors, Spacing, Typography } from '@/constants/theme';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface Props {
  message?: string;
}

/** Full-area spinner used while preview data "loads". */
export default function LoadingState({ message = 'Gathering field data…' }: Props) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={Colors.leafGreen} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  text: { ...Typography.caption },
});
