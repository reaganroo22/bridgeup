/**
 * Image Service for loading images from Supabase Storage
 * Reduces app bundle size by serving images remotely
 */

// Base URL for Supabase storage bucket
const BASE_URL = 'https://miygmdboiesbxwlqgnsx.supabase.co/storage/v1/object/public/girl-images';

/**
 * Get the public URL for a girl image from Supabase storage
 * @param imageName - Name of the image file (e.g., 'girl2.png')
 * @returns Public URL for the image
 */
export function getGirlImageUrl(imageName: string): string {
  return `${BASE_URL}/${imageName}`;
}

/**
 * Girl image URLs for easy access in paywall
 */
export const GIRL_IMAGES = {
  girl1: getGirlImageUrl('girl1.png'),
  girl2: getGirlImageUrl('girl2.png'),
  girl3: getGirlImageUrl('girl3.png'),
  girl4: getGirlImageUrl('girl4.jpeg'), 
  girl5: getGirlImageUrl('girl5.png'),
  girl6: getGirlImageUrl('girl6.png'),
  girl7: getGirlImageUrl('girl7.png'),
  girl8: getGirlImageUrl('girl8.png'),
  girl9: getGirlImageUrl('girl9.png'),
  girl10: getGirlImageUrl('girl10.jpeg'),
  girl11: getGirlImageUrl('girl11.png'),
  girl12: getGirlImageUrl('girl12.png'),
} as const;

/**
 * Preload girl images for better performance
 * Call this when the app starts
 */
export function preloadGirlImages() {
  const imageUrls = Object.values(GIRL_IMAGES);
  
  // Preload images for React Native by creating Image objects
  if (typeof window !== 'undefined') {
    imageUrls.forEach(imageUrl => {
      const img = new Image();
      img.src = imageUrl;
    });
  }
}