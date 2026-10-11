/**
 * WildDex centralised theme constants.
 * Nature Adventure palette — single source of truth for colours, spacing,
 * typography, radii and shadows. All screens/components must use these
 * instead of hard-coded values.
 */

export const Colors = {
  forestGreen: '#234D36',
  deepForest: '#173B2C',
  leafGreen: '#6F9B65',
  warmCream: '#F8F5EA',
  earthBrown: '#8B6748',
  goldenAmber: '#E9B65B',

  // Derived / semantic tones
  leafTint: '#E7EFE3', // soft background tint derived from Leaf Green
  amberTint: '#FBF0DA', // soft background tint derived from Golden Amber
  brownTint: '#F1E7DC', // soft background tint derived from Earth Brown
  textPrimary: '#173B2C',
  textSecondary: '#5A6B5E',
  textOnDark: '#F8F5EA',
  textOnDarkSecondary: '#C9D6C4',
  white: '#FFFFFF',
  danger: '#B4452F',
  border: '#E3DFD1',
  lockedOverlay: 'rgba(23, 59, 44, 0.55)',
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

export const Typography = {
  display: { fontSize: 30, fontWeight: '800', color: Colors.textPrimary },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400', color: Colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  overline: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.leafGreen,
    textTransform: 'uppercase',
  },
} as const;

/** Plain, spreadable soft-shadow style (no exotic keys). */
export const SoftShadow = {
  shadowColor: Colors.deepForest,
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

export const CardShadow = {
  shadowColor: Colors.deepForest,
  shadowOpacity: 0.12,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
} as const;
