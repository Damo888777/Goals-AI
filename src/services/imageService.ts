import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface ImageUploadResult {
  id: string;
  url: string;
  type: 'vision' | 'generated' | 'uploaded';
}

class ImageService {
  // Upload image to Supabase Storage
  async uploadImage(uri: string, goalId: string, type: 'vision' | 'generated' | 'uploaded' = 'uploaded'): Promise<ImageUploadResult | null> {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured, storing image locally only');
      return {
        id: `local-${Date.now()}`,
        url: uri,
        type
      };
    }

    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Generate unique filename
      const fileName = `${goalId}/${type}-${Date.now()}.jpg`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('goal-images')
        .upload(fileName, decode(base64), {
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('goal-images')
        .getPublicUrl(fileName);

      // Save image record to database
      const { data: imageRecord, error: dbError } = await supabase
        .from('images')
        .insert({
          goal_id: goalId,
          image_url: publicUrl,
          image_type: type,
          file_size: base64.length,
          mime_type: 'image/jpeg'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        id: imageRecord.id,
        url: publicUrl,
        type
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  }

  // Pick image from gallery
  async pickImage(): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission to access media library denied');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }

    return null;
  }

  // Take photo with camera
  async takePhoto(): Promise<string | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission to access camera denied');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }

    return null;
  }

  // Generate image using AI (placeholder for future implementation)
  async generateImage(prompt: string, goalId: string): Promise<ImageUploadResult | null> {
    console.log('AI image generation not yet implemented');
    // TODO: Implement AI image generation API call
    return null;
  }

  // Get images for a goal
  async getGoalImages(goalId: string): Promise<ImageUploadResult[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(img => ({
        id: img.id,
        url: img.image_url,
        type: img.image_type as 'vision' | 'generated' | 'uploaded'
      }));
    } catch (error) {
      console.error('Error fetching goal images:', error);
      return [];
    }
  }
}

// Helper function to decode base64
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const imageService = new ImageService();
