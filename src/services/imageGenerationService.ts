import { getApiUrl } from '../constants/config';

export type StyleOption = 'photorealistic' | 'anime' | 'watercolour' | 'cyberpunk';

export interface ImageGenerationRequest {
  userText: string;
  style: StyleOption;
  genderPreference?: 'man' | 'woman' | 'specify';
}

export interface ImageGenerationResult {
  success: boolean;
  imageBase64?: string;
  error?: string;
}

class ImageGenerationService {
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    try {
      console.log('🖼️ [ImageGenerationService] Starting image generation...');
      console.log('🖼️ [ImageGenerationService] Request:', { 
        userText: request.userText, 
        style: request.style, 
        genderPreference: request.genderPreference 
      });
      
      // Use proper API URL for both development and production
      let apiUrl = getApiUrl(`/api/generate-image?userText=${encodeURIComponent(request.userText)}&style=${encodeURIComponent(request.style)}`);
      
      // Add gender preference if provided
      if (request.genderPreference && request.genderPreference !== 'specify') {
        const genderTerm = request.genderPreference === 'man' ? 'man' : 'woman';
        apiUrl += `&genderPreference=${encodeURIComponent(request.genderPreference)}`;
        apiUrl += `&subjectGender=${encodeURIComponent(genderTerm)}`;
        apiUrl += `&gender=${encodeURIComponent(genderTerm)}`;
        console.log('🖼️ [ImageGenerationService] Adding gender preference:', request.genderPreference, 'as', genderTerm);
      } else {
        console.log('🖼️ [ImageGenerationService] No gender preference provided or set to specify');
      }
      
      console.log('🖼️ [ImageGenerationService] Final API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      console.log('🖼️ [ImageGenerationService] Response status:', response.status);
      console.log('🖼️ [ImageGenerationService] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      const data = await response.json();

      if (data?.success && data?.imageBase64) {
        // Track vision image usage after successful generation
        try {
          const { usageTrackingService } = await import('./usageTrackingService');
          const tracked = await usageTrackingService.trackVisionImageUsage();
          if (!tracked) {
            console.warn('⚠️ Vision image usage limit reached');
            return {
              success: false,
              error: 'Vision image generation limit reached for your subscription tier'
            };
          }
          console.log('📊 Vision image usage tracked successfully');
        } catch (error) {
          console.error('❌ Failed to track vision image usage:', error);
          return {
            success: false,
            error: 'Failed to track usage'
          };
        }

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
