
/**
 * WildDex Design System
 * Modern Nature Explorer
 *
 * Central source of truth for colours, typography,
 * spacing, radii and shadows.
 */

export const Colors = {
  // Brand palette
  forestGreen: '#173F32',
  deepForest: '#173F32',
  leafGreen: '#78927B',
  warmCream: '#F4F0E5',
  earthBrown: '#B77B45',
  goldenAmber: '#D9C9A5',

  // Derived and semantic colours
  leafTint: '#E6ECE4',
  amberTint: '#F1E8D5',
  brownTint: '#EFE5D9',

  textPrimary: '#243B30',
  textSecondary: '#68766B',
  textOnDark: '#F4F0E5',
  textOnDarkSecondary: '#C7D2C7',

  white: '#FFFFFF',
  danger: '#B4452F',
  border: '#E3DED1',
  lockedOverlay: 'rgba(23, 63, 50, 0.58)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

/**
 * Editorial typography:
 * Lora for prominent headings.
 * DM Sans for interface text.
 */
export const Typography = {
  display: {
    fontFamily: 'Lora_700Bold',
    fontSize: 32,
    color: Colors.textPrimary,
  },
  title: {
    fontFamily: 'Lora_700Bold',
    fontSize: 24,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 17,
    color: Colors.textPrimary,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  caption: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  overline: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    letterSpacing: 1.2,
    color: Colors.leafGreen,
    textTransform: 'uppercase',
  },
} as const;

/** Subtle shadow for lightweight interface elements. */
export const SoftShadow = {
  shadowColor: Colors.deepForest,
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const;

/** Slightly stronger shadow for featured cards. */
export const CardShadow = {
  shadowColor: Colors.deepForest,
  shadowOpacity: 0.10,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 5 },
  elevation: 3,
} as const;
