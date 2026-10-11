import { Colors, Radius } from '@/constants/theme';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export default function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  loading,
  style,
  accessibilityLabel,
}: Props) {
  const isDark = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' && styles.large,
        isDark ? styles.primary : variant === 'secondary' ? styles.secondary : styles.ghost,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isDark ? Colors.warmCream : Colors.forestGreen} />
      ) : (
        <Text
          style={[
            styles.label,
            size === 'lg' && styles.labelLarge,
            { color: isDark ? Colors.warmCream : variant === 'secondary' ? Colors.forestGreen : Colors.forestGreen },
          ]}
        >
          {icon ? `${icon}  ` : ''}
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: { paddingVertical: 18, borderRadius: Radius.lg },
  primary: { backgroundColor: Colors.forestGreen },
  secondary: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.leafGreen },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
  label: { fontSize: 16, fontWeight: '700' },
  labelLarge: { fontSize: 17 },
});
