import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Uploads an avatar image to Supabase Storage
 * @param imageUri - The local URI of the image to upload
 * @param userId - The user's ID for naming the file
 * @returns Promise with upload result containing public URL or error
 */
export async function uploadAvatar(
  imageUri: string,
  userId: string
): Promise<UploadResult> {
  try {
    // Compress and resize image to max 500KB
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 800 } }], // Resize to max width of 800px
      {
        compress: 0.7, // 70% quality
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    // Fetch the compressed image as blob
    const response = await fetch(manipulatedImage.uri);
    const blob = await response.blob();

    // Check if size is still over 500KB, compress more if needed
    let finalBlob = blob;
    let quality = 0.7;

    while (finalBlob.size > 500000 && quality > 0.1) {
      quality -= 0.1;
      const recompressed = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      const recompressedResponse = await fetch(recompressed.uri);
      finalBlob = await recompressedResponse.blob();
    }

    // Create file name with timestamp
    const timestamp = Date.now();
    const fileName = `${userId}-${timestamp}.jpg`;

    // Convert blob to ArrayBuffer for Supabase
    const arrayBuffer = await finalBlob.arrayBuffer();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image',
      };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from('users')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      // Still return success since image was uploaded
      // User can manually refresh or we can handle this in the component
    }

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error('Avatar upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Requests camera permissions
 * @returns Promise<boolean> - true if permission granted
 */
export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

/**
 * Requests photo library permissions
 * @returns Promise<boolean> - true if permission granted
 */
export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * Launches camera to take a photo
 * @returns Promise<string | null> - Local URI of captured image or null if cancelled
 */
export async function takePhoto(): Promise<string | null> {
  const hasPermission = await requestCameraPermission();

  if (!hasPermission) {
    throw new Error('Camera permission not granted');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1], // Square aspect ratio for avatar
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return result.assets[0].uri;
}

/**
 * Opens photo library to select an image
 * @returns Promise<string | null> - Local URI of selected image or null if cancelled
 */
export async function pickImageFromLibrary(): Promise<string | null> {
  const hasPermission = await requestMediaLibraryPermission();

  if (!hasPermission) {
    throw new Error('Photo library permission not granted');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1], // Square aspect ratio for avatar
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return result.assets[0].uri;
}
