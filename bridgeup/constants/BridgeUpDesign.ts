// BridgeUp Professional Academic Design System
// Creates a trustworthy, approachable aesthetic for college admissions guidance

export const BridgeUpDesign = {
  // 📐 BORDER RADIUS - Friendly, professional curves
  borderRadius: {
    small: 6,      // Input fields, small buttons
    medium: 8,     // Cards, most components  
    large: 12,     // Hero sections, major cards
    xlarge: 16,    // Modal corners, major containers
    full: 50,      // Pills, avatars
  },

  // 📝 TYPOGRAPHY - Scholarly, readable, trustworthy
  fontWeight: {
    light: '300',      // Subtle text
    regular: '400',    // Body text
    medium: '500',     // Emphasis
    semibold: '600',   // Headings
    bold: '700',       // Strong headings
    heavy: '800',      // Only for major titles
  },

  // 🎨 SHADOWS - Subtle, professional depth
  shadow: {
    subtle: '0 1px 3px rgba(74, 144, 226, 0.1)',
    soft: '0 2px 8px rgba(74, 144, 226, 0.12)',
    medium: '0 4px 16px rgba(74, 144, 226, 0.15)',
    strong: '0 8px 24px rgba(74, 144, 226, 0.2)',
  },

  // 📏 SPACING - Comfortable, academic proportions
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // 🔤 TEXT SIZES - Clear hierarchy for educational content
  fontSize: {
    caption: 12,
    small: 14,
    body: 16,
    subheading: 18,
    heading: 22,
    title: 28,
    hero: 34,
  },
};

// Helper functions for consistent styling
export const createCard = (elevated = false) => ({
  borderRadius: BridgeUpDesign.borderRadius.medium,
  backgroundColor: elevated ? '#F8FAFC' : '#FFFFFF',
  shadowColor: '#4A90E2',
  shadowOffset: { width: 0, height: elevated ? 4 : 2 },
  shadowOpacity: elevated ? 0.15 : 0.08,
  shadowRadius: elevated ? 8 : 4,
  elevation: elevated ? 4 : 2,
});

export const createButton = (variant: 'primary' | 'secondary' | 'outline' = 'primary') => ({
  borderRadius: BridgeUpDesign.borderRadius.medium,
  paddingVertical: 12,
  paddingHorizontal: 24,
  fontWeight: BridgeUpDesign.fontWeight.semibold,
  fontSize: BridgeUpDesign.fontSize.body,
});

export const createInput = () => ({
  borderRadius: BridgeUpDesign.borderRadius.small,
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderWidth: 1,
  borderColor: '#E2E8F0',
  fontSize: BridgeUpDesign.fontSize.body,
  fontWeight: BridgeUpDesign.fontWeight.regular,
});

export const createHeading = (level: 1 | 2 | 3 | 4 = 2) => {
  const sizes = {
    1: { fontSize: BridgeUpDesign.fontSize.hero, fontWeight: BridgeUpDesign.fontWeight.bold },
    2: { fontSize: BridgeUpDesign.fontSize.title, fontWeight: BridgeUpDesign.fontWeight.semibold },
    3: { fontSize: BridgeUpDesign.fontSize.heading, fontWeight: BridgeUpDesign.fontWeight.semibold },
    4: { fontSize: BridgeUpDesign.fontSize.subheading, fontWeight: BridgeUpDesign.fontWeight.medium },
  };
  return sizes[level];
};