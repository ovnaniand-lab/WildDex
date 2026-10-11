import { Colors, Radius } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';

interface Props {
  /** 0..1 */
  progress: number;
  height?: number;
  color?: string;
  trackColor?: string;
  accessibleLabel?: string;
}

export default function ProgressBar({
  progress,
  height = 10,
  color = Colors.goldenAmber,
  trackColor = Colors.leafTint,
  accessibleLabel,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={[styles.track, { height, backgroundColor: trackColor, borderRadius: height / 2 }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibleLabel ?? `${Math.round(clamped * 100)} percent complete`}
    >
      <View
        style={{
          height,
          width: `${clamped * 100}%`,
          backgroundColor: color,
          borderRadius: Radius.pill,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
});
