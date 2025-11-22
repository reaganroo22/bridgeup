import { Platform } from 'react-native';

export const FontFamily = {
  // Primary readable serif font for academic feel
  primary: Platform.select({
    ios: 'Georgia', // Highly readable academic serif
    android: 'serif',
    default: 'serif',
  }),
  
  // Secondary font for UI elements  
  secondary: Platform.select({
    ios: 'Avenir Next', // Clean, readable sans-serif
    android: 'Roboto',
    default: 'sans-serif',
  }),
  
  // Headers - Readable academic serif
  heading: Platform.select({
    ios: 'Georgia', // Use Georgia for better readability
    android: 'serif',
    default: 'serif',
  }),
  
  // UI elements - Clean and readable
  ui: Platform.select({
    ios: 'Avenir Next', // Highly readable sans-serif
    android: 'Roboto',
    default: 'sans-serif',
  }),
  
  // Monospace for special cases
  mono: 'Courier',
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
  // Headers - Academic serif fonts for prestige
  h1: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['4xl'] * 1.1,
    letterSpacing: 0.2, // Slightly spaced for elegance
  },
  h2: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize['3xl'] * 1.2,
    letterSpacing: 0.1,
  },
  h3: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.medium,
    lineHeight: FontSize['2xl'] * 1.3,
    letterSpacing: 0,
  },
  h4: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.xl * 1.3,
    letterSpacing: 0,
  },
  
  // Body text - Readable academic serif
  body: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.base * 1.5, // Readable line spacing
    letterSpacing: 0.05, // Subtle letter spacing
  },
  bodyMedium: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.base * 1.5,
    letterSpacing: 0.05,
  },
  bodySmall: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * 1.4,
    letterSpacing: 0.05,
  },
  
  // UI Elements - Professional sans-serif for clarity
  button: {
    fontFamily: FontFamily.secondary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize.base * 1.2,
    letterSpacing: 0.8, // More spaced for buttons
    textTransform: 'uppercase',
  },
  buttonSmall: {
    fontFamily: FontFamily.secondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize.sm * 1.2,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  caption: {
    fontFamily: FontFamily.secondary, // Use sans-serif for readability
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.xs * 1.4,
    letterSpacing: 0.3,
  },
  
  // Special cases - Academic styling
  tabBar: {
    fontFamily: FontFamily.secondary, // Clean sans-serif for UI
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    letterSpacing: 1.0, // Wide spacing for academic feel
    textTransform: 'uppercase',
  },
  navTitle: {
    fontFamily: FontFamily.heading, // Serif for headers
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.3, // Positive spacing for elegance
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