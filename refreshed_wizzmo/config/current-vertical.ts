import { VERTICAL_CONFIG } from './verticals';

export const CURRENT_VERTICAL_KEY = 'wizzmo' as const;
export const CURRENT_VERTICAL = VERTICAL_CONFIG[CURRENT_VERTICAL_KEY];

// Export commonly used values for convenience
export const APP_NAME = CURRENT_VERTICAL.name;
export const APP_DESCRIPTION = CURRENT_VERTICAL.description;
export const APP_TAGLINE = CURRENT_VERTICAL.tagline;
export const PRIMARY_COLOR = CURRENT_VERTICAL.primaryColor;
export const ACCENT_COLOR = CURRENT_VERTICAL.accentColor;
export const LIGHT_COLOR = CURRENT_VERTICAL.lightColor;
export const DARK_COLOR = CURRENT_VERTICAL.darkColor;