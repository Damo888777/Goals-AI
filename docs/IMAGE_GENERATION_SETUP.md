# Image Generation Setup Guide

## Overview
The Goalz AI app now includes AI-powered image generation using Google's Gemini 2.5 Flash Image model. Users can create vision board images by describing their goals in natural language and selecting from four artistic styles.

## Setup Instructions

### 1. Get Your Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure Supabase Edge Function
1. Add your Gemini API key to Supabase secrets:
   ```bash
   supabase secrets set GOOGLE_API_KEY=your_actual_api_key_here
   ```

### 3. Deploy the Edge Function
Deploy the image generation edge function to Supabase:
```bash
supabase functions deploy generate-image
```

## Features

### Artistic Styles
The app includes four pre-configured artistic styles from your prompt library:

1. **Photorealistic** - Professional photography with Hasselblad camera settings
2. **Anime** - Studio Ghibli-inspired artwork with soft pastels
3. **Watercolour** - Expressive brush strokes with artistic spontaneity
4. **Cyberpunk** - Futuristic neon-noir with dramatic lighting

### User Experience
- **Input**: Users describe their vision in natural language
- **Style Selection**: Choose from four artistic styles with visual previews
- **Processing**: Smooth Spark AI animation during generation
- **Output**: High-quality images saved to device and photo library
- **Feedback**: Haptic feedback and visual confirmation

### Technical Implementation
- **Service**: `src/services/imageGenerationService.ts`
- **Animation**: `src/components/ImageGenerationAnimation.tsx`
- **Screen**: `app/spark-generate-img.tsx`
- **Prompts**: Structured templates from `docs/library_prompt_img.md`

## Usage Flow
1. User taps "Create Vision" from Vision Board
2. Describes their goal/vision in text input
3. Selects artistic style from visual options
4. Taps "Create Vision" button
5. Spark AI processes with smooth animation
6. Generated image is saved and displayed
7. User returns to Vision Board with new image

## Error Handling
- API key validation with helpful error messages
- Network error handling with retry suggestions
- Input validation for empty descriptions
- Permission handling for photo library access
- Graceful fallbacks for generation failures

## Security Notes
- API key is stored as environment variable
- Never commit `.env` file to version control
- Images are saved locally and to user's photo library
- No user data is stored on external servers beyond API calls
