import { CURRENT_VERTICAL } from '../config/current-vertical';

export default {
  light: {
    // 🔵 BRIDGEUP CLEAN - pure white background with blue highlights
    background: '#FFFFFF',
    surface: CURRENT_VERTICAL.lightColor,
    surfaceElevated: '#E0EFF9',
    surfaceSecondary: '#D1E8F7',
    
    // ✨ Dynamic background variations
    backgroundSoft: '#FEFEFE',
    backgroundRich: CURRENT_VERTICAL.lightColor,
    backgroundWarm: '#E0EFF9',

    // Rich contrast text on blue paradise
    text: '#1A1A1A',
    textSecondary: CURRENT_VERTICAL.darkColor,
    textTertiary: '#6B7280',
    textQuaternary: '#9CA3AF',

    // 🌟 BRIDGEUP BRAND TRUST - professional & approachable
    primary: CURRENT_VERTICAL.primaryColor,
    primaryVibrant: '#3B82F6',
    primarySoft: '#DBEAFE',
    primaryGlow: CURRENT_VERTICAL.accentColor,
    secondary: '#6366F1',
    secondaryVibrant: '#4F46E5',
    accent: CURRENT_VERTICAL.accentColor,
    accentBright: '#3B82F6',
    
    // 🎉 Dynamic emotional colors
    success: '#10B981',        // Professional success
    successWarm: '#059669',    // Warm success
    warning: '#F59E0B',        // Clear warning  
    warningWarm: '#D97706',    // Cozy warning
    error: '#EF4444',          // Clear error
    errorWarm: '#DC2626',      // Gentle error
    danger: '#EF4444',         // Professional danger
    dangerSoft: '#F87171',     // Soft goodbye
    
    // ⚡ Dynamic interactions that feel professional
    interactive: CURRENT_VERTICAL.primaryColor,
    interactiveHover: '#3B82F6',
    interactivePressed: '#1D4ED8',
    interactiveGlow: CURRENT_VERTICAL.accentColor,
    interactivePulse: '#93C5FD',

    // 💼 BridgeUp clean surfaces with blue highlights
    card: CURRENT_VERTICAL.lightColor,
    cardElevated: '#E0EFF9',
    cardForeground: '#1A1A1A',
    cardBorder: 'rgba(74, 144, 226, 0.35)',
    cardShadow: 'rgba(74, 144, 226, 0.15)',
    border: 'rgba(74, 144, 226, 0.30)',

    // 🌈 BRIDGEUP TRUST GRADIENTS - professional & inspiring!
    gradientPrimary: CURRENT_VERTICAL.gradientColors,  // Classic headers
    gradientSecondary: [CURRENT_VERTICAL.accentColor, '#6366F1'],   // Alt headers
    gradientHero: CURRENT_VERTICAL.gradientColors,        // Main hero
    
    // 🎓 Professional gradients for college prep
    gradientSuccess: ['#10B981', '#059669'],     // "Great job!"
    gradientWarning: ['#F59E0B', '#D97706'],     // "Important note"  
    gradientDanger: ['#EF4444', '#DC2626'],      // "Please review"
    gradientAccent: [CURRENT_VERTICAL.primaryColor, CURRENT_VERTICAL.accentColor],      // BridgeUp accent
    gradientMagic: [CURRENT_VERTICAL.primaryColor, '#6C9BD1'],       // Professional vibrant
    gradientSunset: [CURRENT_VERTICAL.accentColor, CURRENT_VERTICAL.lightColor],      // Soft BridgeUp
    gradientDream: ['#93C5FD', '#A5B4FC'],       // Soft dreamy
    gradientEnergy: ['#1D4ED8', '#6366F1'],      // High energy
    
    // 🌟 Interactive gradients that respond to touch
    gradientHover: ['#3B82F6', '#6366F1'],       // Hover state
    gradientPressed: ['#1D4ED8', '#4F46E5'],     // Pressed state
    gradientPulse: ['#93C5FD', '#A5B4FC'],       // Pulse animation

    // ✨ BRIDGEUP CLEAN EFFECTS - professional clarity
    blur: 'rgba(232, 242, 255, 0.95)',
    blurRich: 'rgba(209, 232, 247, 0.90)',
    overlay: 'rgba(224, 239, 249, 0.98)',
    overlayRich: 'rgba(191, 225, 243, 0.96)',
    glass: 'rgba(74, 144, 226, 0.12)',
    glassVibrant: 'rgba(59, 130, 246, 0.15)',
    separator: 'rgba(74, 144, 226, 0.20)',
    separatorBold: 'rgba(59, 130, 246, 0.30)',
    
    // 🌟 Special BridgeUp glow effects
    glow: 'rgba(74, 144, 226, 0.25)',
    glowSoft: 'rgba(147, 197, 253, 0.20)',
    glowBright: 'rgba(59, 130, 246, 0.30)',
    shimmer: 'rgba(123, 179, 240, 0.25)',
    sparkle: 'rgba(29, 78, 216, 0.35)',

    // 🎓 Tab bar professional - clean white with blue highlights
    tabBackground: '#FFFFFF',
    tabBackgroundActive: CURRENT_VERTICAL.lightColor,
    tabBorder: 'rgba(74, 144, 226, 0.25)',
    tabBorderActive: 'rgba(59, 130, 246, 0.40)',
    tabIconDefault: '#6B7280',
    tabIconSelected: CURRENT_VERTICAL.primaryColor,
    tabIconHover: '#3B82F6',
    tint: CURRENT_VERTICAL.primaryColor,
  },
  dark: {
    // Dark brutalism with color accents
    background: '#000000',
    surface: '#0A0A0A',
    surfaceElevated: '#1A1A1A',
    surfaceSecondary: '#111111',

    // High contrast white text
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textTertiary: '#71717A',
    textQuaternary: '#3F3F46',

    // BridgeUp brand on dark
    primary: CURRENT_VERTICAL.primaryColor,
    primarySoft: '#1A2B4A',
    secondary: '#6366F1',
    accent: CURRENT_VERTICAL.accentColor,
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    danger: '#EF4444',

    // Dark interactions
    interactive: CURRENT_VERTICAL.primaryColor,
    interactiveHover: '#3B82F6',
    interactivePressed: '#1D4ED8',

    // Dark surfaces
    card: '#0A0A0A',
    cardElevated: '#1A1A1A',
    cardForeground: '#FFFFFF',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    border: 'rgba(255, 255, 255, 0.12)',

    // Dark gradients
    gradientPrimary: CURRENT_VERTICAL.gradientColors,
    gradientSecondary: [CURRENT_VERTICAL.accentColor, '#6366F1'],
    gradientAccent: [CURRENT_VERTICAL.primaryColor, CURRENT_VERTICAL.accentColor],
    gradientHero: CURRENT_VERTICAL.gradientColors,
    gradientMagic: [CURRENT_VERTICAL.primaryColor, '#6C9BD1'],
    gradientSuccess: ['#10B981', '#059669'],
    gradientWarning: ['#F59E0B', '#D97706'],
    gradientDanger: ['#EF4444', '#DC2626'],
    gradientSunset: [CURRENT_VERTICAL.accentColor, CURRENT_VERTICAL.lightColor],
    gradientDream: ['#93C5FD', '#A5B4FC'],
    gradientEnergy: ['#1D4ED8', '#6366F1'],
    gradientHover: ['#3B82F6', '#6366F1'],
    gradientPressed: ['#1D4ED8', '#4F46E5'],
    gradientPulse: ['#93C5FD', '#A5B4FC'],

    // Dark effects
    blur: 'rgba(0, 0, 0, 0.9)',
    overlay: 'rgba(0, 0, 0, 0.95)',
    glass: 'rgba(255, 255, 255, 0.05)',
    separator: 'rgba(255, 255, 255, 0.08)',

    // Dark tab bar
    tabBackground: '#000000',
    tabBorder: 'rgba(255, 255, 255, 0.08)',
    tabIconDefault: '#71717A',
    tabIconSelected: CURRENT_VERTICAL.primaryColor,
    tint: CURRENT_VERTICAL.primaryColor,
  },
};
