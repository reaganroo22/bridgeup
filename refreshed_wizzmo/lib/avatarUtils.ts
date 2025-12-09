/**
 * Avatar utility functions
 */

/**
 * Generate initials from a full name
 * @param fullName - The full name to generate initials from
 * @returns The initials (max 2 characters)
 */
export function getInitials(fullName: string | null | undefined): string {
  if (!fullName || typeof fullName !== 'string') {
    return '?';
  }
  
  const parts = fullName.trim().split(' ').filter(Boolean);
  
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  } else if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return '?';
}

/**
 * Generate a consistent color based on a string (like a name)
 * @param str - The string to generate color from
 * @returns A hex color string
 */
export function getColorFromString(str: string): string {
  if (!str) return '#FF4DB8'; // Default pink
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Generate a nice color palette
  const colors = [
    '#FF4DB8', // Pink
    '#8B5CF6', // Purple  
    '#06B6D4', // Cyan
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#6366F1', // Indigo
    '#EC4899', // Pink
  ];
  
  return colors[Math.abs(hash) % colors.length];
}