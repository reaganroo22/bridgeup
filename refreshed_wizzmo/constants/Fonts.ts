import { Platform } from 'react-native';

export const FontFamily = {
  // Primary modern style font 
  primary: Platform.select({
    ios: 'SF Pro Text', // Modern system UI font
    android: 'Roboto',
    default: 'system',
  }),
  
  // Secondary font for modern elements
  secondary: Platform.select({
    ios: 'SF Pro Text', // Clean, professional sans-serif
    android: 'Roboto',
    default: 'system',
  }),
  
  // Headers - Modern sans-serif style
  heading: Platform.select({
    ios: 'SF Pro Text', // Modern system UI font
    android: 'Roboto',
    default: 'system',
  }),
  
  // UI elements - Clean and readable
  ui: Platform.select({
    ios: 'SF Pro Text', // Modern system UI font
    android: 'Roboto',
    default: 'system',
  }),
  
  // Monospace for special cases
  mono: 'SpaceMono',
};

export const FontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

// Common font combinations for Bridge Up - Collegiate Style
export const Typography = {
  // Headers - Use elegant serif fonts
  h1: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['4xl'] * 1.2,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['3xl'] * 1.2,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize['2xl'] * 1.3,
    letterSpacing: -0.2,
  },
  h4: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize.xl * 1.3,
  },
  
  // Body text - Academic serif for readability
  body: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.base * 1.6, // Better readability
  },
  bodyMedium: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.base * 1.6,
  },
  bodySmall: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * 1.5,
  },
  
  // UI Elements - Clean sans-serif
  button: {
    fontFamily: FontFamily.secondary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize.base * 1.2,
    letterSpacing: 0.5,
  },
  buttonSmall: {
    fontFamily: FontFamily.secondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.sm * 1.2,
    letterSpacing: 0.3,
  },
  caption: {
    fontFamily: FontFamily.ui,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.xs * 1.4,
  },
  
  // Special cases
  tabBar: {
    fontFamily: FontFamily.ui,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.5,
  },
  navTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    letterSpacing: -0.2,
  },
  
  // Academic specific styles
  quote: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.lg * 1.6,
    fontStyle: 'italic',
  },
  academic: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.base * 1.7,
  },
};

export default {
  FontFamily,
  FontWeight,
  FontSize,
  Typography,
};