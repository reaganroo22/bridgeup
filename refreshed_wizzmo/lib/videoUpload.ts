import { supabase } from './supabase';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Uploads a video to Supabase Storage
 * @param videoUri - The local URI of the video to upload
 * @param userId - The user's ID for naming the file
 * @returns Promise with upload result containing public URL or error
 */
export async function uploadVideo(
  videoUri: string,
  userId: string
): Promise<UploadResult> {
  try {
    // Fetch the video as blob
    const response = await fetch(videoUri);
    const blob = await response.blob();

    // Create file name with timestamp
    const timestamp = Date.now();
    const fileName = `${userId}-${timestamp}.mp4`;

    // Convert blob to ArrayBuffer for Supabase
    const arrayBuffer = await blob.arrayBuffer();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(fileName, arrayBuffer, {
        contentType: 'video/mp4',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Supabase video upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload video',
      };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error('Video upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}