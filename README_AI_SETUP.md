# Spark AI Integration Setup

## Overview

This document provides setup instructions for the integrated AI functionality in the Goalz-AI app, which uses a two-stage AI pipeline:

1. **OpenAI Whisper** - Converts voice recordings to text transcription
2. **Google Gemini 2.0 Flash** - Processes transcription to classify and structure tasks, goals, and milestones

## Prerequisites

You need API keys for both services:

- **OpenAI API Key** - For Whisper speech-to-text
- **Google API Key** - For Gemini AI processing

## Setup Instructions

### 1. Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Add your API keys to the `.env` file:
   ```env
   EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
   EXPO_PUBLIC_GOOGLE_API_KEY=your_google_api_key_here
   ```

### 2. API Key Setup

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key to your `.env` file

#### Google API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Enable the Generative Language API
4. Copy the key to your `.env` file

### 3. Permissions

The app requires microphone permissions for voice recording. These will be requested automatically when the user first tries to record.

## How It Works

### User Flow
1. User taps the FAB button to navigate to Spark AI screen
2. User taps the microphone button to start recording
3. While recording, wave animations show recording is active
4. User taps again to stop recording
5. Processing animation shows AI workflow:
   - Stage 1: Whisper transcribes audio to text
   - Stage 2: Gemini processes text to classify and structure
6. Quick confirmation animation
7. Navigate to SparkAIOutput screen with pre-filled data

### AI Processing Pipeline

#### Stage 1: OpenAI Whisper
- **Input**: Audio file (m4a format)
- **Process**: Speech-to-text transcription
- **Output**: Plain text string

#### Stage 2: Google Gemini 2.0 Flash
- **Input**: Transcribed text + current date context
- **Process**: Classification and structuring using predefined prompt
- **Output**: JSON object with:
  ```json
  {
    "type": "task" | "goal" | "milestone",
    "title": "Clean, concise title",
    "timestamp": "2025-10-02T23:59:59.999Z" | null
  }
  ```

### Classification Logic

- **Task**: Single, actionable items (call, buy, finish, send, etc.)
- **Goal**: Broader objectives requiring multiple steps (learn, improve, build, etc.)
- **Milestone**: Significant checkpoints or achievements (complete phase, launch, reach, etc.)

### Date Processing

Gemini automatically converts relative dates:
- "tomorrow" → next day
- "Friday" → next occurrence of Friday
- "October 15" → proper ISO date format
- No date mentioned → null

## File Structure

```
src/
├── services/
│   └── aiService.ts          # AI service utilities
├── hooks/
│   └── useAudioRecording.ts  # Audio recording hook
└── components/
    └── AIProcessingAnimation.tsx  # Processing animations

app/
├── spark-ai.tsx              # Main recording screen
└── spark-ai-output.tsx       # Results review screen
```

## Error Handling

The system includes comprehensive error handling:

- **Recording failures**: Permission denied, device issues
- **Network errors**: API timeouts, connectivity issues
- **AI processing errors**: Invalid responses, service unavailable
- **Fallback behavior**: Default to task type with original transcription

## Testing

To test the AI integration:

1. Ensure API keys are properly configured
2. Run the app: `npm start`
3. Navigate to Spark AI via FAB button
4. Test voice recording with various inputs:
   - "Call the dentist tomorrow" (should classify as task)
   - "Learn Spanish this year" (should classify as goal)
   - "Launch the beta version" (should classify as milestone)

## Troubleshooting

### Common Issues

1. **"API key not found" error**
   - Check `.env` file exists and has correct keys
   - Restart the development server

2. **Recording permission denied**
   - Check device microphone permissions
   - Restart the app

3. **Network timeouts**
   - Check internet connectivity
   - Verify API keys are valid

4. **Invalid JSON response**
   - Check Gemini API quota
   - Review API key permissions

## Production Considerations

- Store API keys securely (not in version control)
- Implement rate limiting for API calls
- Add retry logic with exponential backoff
- Monitor API usage and costs
- Consider caching for repeated requests
- Implement proper error logging and analytics
