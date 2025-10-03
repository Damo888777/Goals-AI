import { createClient } from '@supabase/supabase-js';

// Get Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type StyleOption = 'photorealistic' | 'anime' | 'watercolour' | 'cyberpunk';

export interface ImageGenerationRequest {
  userText: string;
  style: StyleOption;
}

export interface ImageGenerationResult {
  success: boolean;
  imageBase64?: string;
  error?: string;
}

class ImageGenerationService {
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    try {
      // Use Expo API route instead of Supabase Edge Function
      const apiUrl = `/api/generate-image?userText=${encodeURIComponent(request.userText)}&style=${encodeURIComponent(request.style)}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET'
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      const data = await response.json();

      if (data?.success && data?.imageBase64) {
        return {
          success: true,
          imageBase64: data.imageBase64
        };
      }

      return {
        success: false,
        error: data?.error || 'No image data received'
      };

    } catch (error) {
      console.error('Image generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const imageGenerationService = new ImageGenerationService();
