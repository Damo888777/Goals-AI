import { serverApiKeyService } from '../../src/services/apiKeyService-server';

// Import the prompt library
const PROMPT_LIBRARY = {
  "cyberpunk": {
    "style": "cyberpunk, futuristic, neon-noir, digital art",
    "lighting": "dramatic split lighting, neon accents, motion blur light trails, dynamic beams",
    "color_palette": [
      "electric blue",
      "hot pink", 
      "cyan",
      "magenta",
      "warm orange",
      "deep purple"
    ],
    "mood": "contemplative, dynamic, high-energy, immersive",
    "technical_elements": [
      "chromatic aberration",
      "motion blur",
      "light streaks",
      "RGB color separation",
      "high contrast",
      "photorealistic rendering"
    ],
    "composition": "profile perspective, rule of thirds, leading lines from light trails, depth of field",
    "atmosphere": "futuristic urban environment, speed and movement, cyberpunk aesthetic, neon-lit corridor"
  },
  "watercolour": {
    "style": {
      "inspiration": "watercolor portrait painting",
      "features": [
        "expressive brush strokes",
        "soft blending of colors with visible watercolor textures",
        "splashes and drips adding artistic spontaneity",
        "rich earthy tones mixed with vibrant highlights",
        "high contrast lighting on the face",
        "realistic yet painterly rendering"
      ],
      "overall_mood": "powerful, dignified, expressive, artistic"
    },
    "composition": {
      "focus": "single subject portrait",
      "framing": "centered, shoulders-up view",
      "background": "minimal, mostly white with watercolor splashes"
    }
  },
  "anime": {
    "style": {
      "inspiration": "Studio Ghibli, anime film aesthetic",
      "features": [
        "soft pastel-like colors",
        "clean and smooth line art",
        "expressive and large anime-style eyes",
        "gentle shading with subtle gradients",
        "warm, inviting atmosphere",
        "slightly whimsical and storybook-like tone",
        "natural light and soft highlights"
      ],
      "overall_mood": "wholesome, cheerful, relaxed"
    }
  },
  "photorealistic": {
    "camera": {
      "body": "Hasselblad H6D-400c",
      "lens": "HC 80mm f/2.8",
      "settings": {
        "aperture": "f/2.8",
        "shutter_speed": "1/125",
        "iso": 100,
        "focal_length": "80mm"
      }
    },
    "lighting": {
      "setup": "natural golden hour light",
      "direction": "soft directional from left",
      "quality": "diffused through overcast sky",
      "shadows": {
        "density": "deep but detailed",
        "softness": "medium soft edge transition",
        "color_temperature": "slightly warm, 4500K"
      },
      "highlights": {
        "exposure": "preserved detail, no clipping",
        "rolloff": "smooth gradation",
        "specular": "subtle with natural catchlights"
      }
    },
    "color_grading": {
      "style": "cinematic natural",
      "color_temperature": "4800K warm",
      "tint": "+2 magenta",
      "lift": "crushed blacks with slight blue tint",
      "gamma": "0.95 for midtone contrast",
      "gain": "highlights pulled -0.3 stops",
      "saturation": {
        "global": "105%",
        "skin_tones": "natural, slightly desaturated",
        "shadows": "80% to enhance depth"
      },
      "curves": {
        "rgb": "subtle S-curve for contrast",
        "red": "lifted in shadows",
        "green": "reduced in highlights",
        "blue": "boosted in shadows for coolness"
      }
    },
    "image_quality": {
      "resolution": "400 megapixels",
      "bit_depth": "16-bit RAW",
      "dynamic_range": "14+ stops",
      "sharpness": "edge-to-edge clarity",
      "grain": "minimal, ISO 100 native texture",
      "lens_characteristics": {
        "bokeh": "creamy out-of-focus areas",
        "vignetting": "subtle natural falloff",
        "chromatic_aberration": "corrected",
        "distortion": "none"
      }
    },
    "post_processing": {
      "contrast": "medium-high with retained shadow detail",
      "clarity": "+15 for micro-contrast",
      "vibrance": "+10",
      "tone_mapping": "natural HDR look without halos",
      "color_harmony": "complementary warm-cool balance",
      "black_point": "0.15 for rich blacks",
      "white_point": "0.95 to preserve highlight texture"
    }
  }
};

type StyleOption = 'photorealistic' | 'anime' | 'watercolour' | 'cyberpunk';

function buildPrompt(userText: string, style: StyleOption): string {
  const styleConfig = PROMPT_LIBRARY[style];
  
  switch (style) {
    case 'cyberpunk': {
      const config = styleConfig as typeof PROMPT_LIBRARY.cyberpunk;
      return `Create an image of: ${userText}

Style: ${config.style}
Lighting: ${config.lighting}
Color palette: ${config.color_palette.join(', ')}
Mood: ${config.mood}
Technical elements: ${config.technical_elements.join(', ')}
Composition: ${config.composition}
Atmosphere: ${config.atmosphere}

High quality, detailed, professional rendering.`;
    }

    case 'watercolour': {
      const config = styleConfig as typeof PROMPT_LIBRARY.watercolour;
      return `Create an image of: ${userText}

Style inspiration: ${config.style.inspiration}
Features: ${config.style.features.join(', ')}
Overall mood: ${config.style.overall_mood}
Composition focus: ${config.composition.focus}
Framing: ${config.composition.framing}
Background: ${config.composition.background}

High quality watercolor painting style.`;
    }

    case 'anime': {
      const config = styleConfig as typeof PROMPT_LIBRARY.anime;
      return `Create an image of: ${userText}

Style inspiration: ${config.style.inspiration}
Features: ${config.style.features.join(', ')}
Overall mood: ${config.style.overall_mood}

High quality anime/Studio Ghibli style artwork.`;
    }

    case 'photorealistic': {
      const config = styleConfig as typeof PROMPT_LIBRARY.photorealistic;
      return `Create a photorealistic image of: ${userText}

Camera: ${config.camera.body} with ${config.camera.lens}
Camera settings: ${config.camera.settings.aperture}, ${config.camera.settings.shutter_speed}, ISO ${config.camera.settings.iso}, ${config.camera.settings.focal_length}
Lighting: ${config.lighting.setup}, ${config.lighting.direction}, ${config.lighting.quality}
Color grading: ${config.color_grading.style}, ${config.color_grading.color_temperature}, tint ${config.color_grading.tint}
Image quality: ${config.image_quality.resolution}, ${config.image_quality.bit_depth}, ${config.image_quality.dynamic_range}, ${config.image_quality.sharpness}
Post-processing: ${config.post_processing.contrast}, clarity ${config.post_processing.clarity}, vibrance ${config.post_processing.vibrance}

Professional photography, ultra-high quality, photorealistic rendering.`;
    }

    default:
      return `Create a high-quality image of: ${userText}`;
  }
}

export async function GET(request: Request) {
  try {
    console.log('🖼️ [Image Generation API] Received GET request');
    console.log('🖼️ [Image Generation API] Request headers:', Object.fromEntries(request.headers.entries()));
    
    const url = new URL(request.url);
    const userText = url.searchParams.get('userText');
    const style = url.searchParams.get('style');
    
    console.log('🖼️ [Image Generation API] Parameters:', { userText, style });

    if (!userText || !style) {
      console.error('🖼️ [Image Generation API] Missing parameters');
      return Response.json({ 
        success: false, 
        error: 'Missing userText or style parameters' 
      }, { status: 400 });
    }

    // Get Google API key from Supabase
    console.log('🖼️ [Image Generation API] Fetching Google API key...');
    const googleApiKey = await serverApiKeyService.getGoogleApiKey();
    
    if (!googleApiKey) {
      console.error('🖼️ [Image Generation API] Google API key not available');
      return Response.json({ 
        success: false, 
        error: 'Google API key not configured' 
      }, { status: 500 });
    }
    
    console.log('🖼️ [Image Generation API] Google API key obtained successfully');

    // Build the prompt using the style library
    const prompt = buildPrompt(userText, style as StyleOption);
    console.log('🖼️ [Image Generation API] Built prompt for style:', style);
    console.log('🖼️ [Image Generation API] Prompt preview:', prompt.substring(0, 200) + '...');

    // Call Google Gemini API with image generation model (gemini-2.5-flash-image)
    console.log('🖼️ [Image Generation API] Calling Google Gemini API...');
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': googleApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        }),
      }
    );
    
    console.log('🖼️ [Image Generation API] Google Gemini response status:', response.status);
    console.log('🖼️ [Image Generation API] Google Gemini response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🖼️ [Image Generation API] Google Gemini API error:', errorText);
      return Response.json({ 
        success: false, 
        error: `Image generation failed: ${response.status} - ${errorText}` 
      }, { status: 500 });
    }

    const result = await response.json();
    console.log('🖼️ [Image Generation API] Full response data:', JSON.stringify(result, null, 2));

    // Extract image data from response
    const candidates = result.candidates;
    if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          console.log('🖼️ [Image Generation API] Successfully extracted image data');
          return Response.json({
            success: true,
            imageBase64: part.inlineData.data
          });
        }
      }
    }

    console.error('🖼️ [Image Generation API] No image data found in response');
    return Response.json({ 
      success: false, 
      error: 'No image data received from API' 
    }, { status: 500 });

  } catch (error) {
    console.error('🖼️ [Image Generation API] Exception:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
}
