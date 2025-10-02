import { Audio } from 'expo-av';

// Types for AI responses
export interface WhisperResponse {
  text: string;
}

export interface GeminiResponse {
  type: 'task' | 'goal' | 'milestone';
  title: string;
  timestamp: string | null;
}

export interface AIProcessingResult {
  transcription: string;
  classification: GeminiResponse;
}

// OpenAI Whisper Service
export class WhisperService {
  static async transcribeAudio(audioUri: string): Promise<string> {
    try {
      console.log('🎤 [Whisper] Starting transcription for:', audioUri);
      
      const formData = new FormData();
      
      const audioFile = {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any;
      
      formData.append('audio', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'text');
      
      console.log('🎤 [Whisper] Sending request to /api/whisper');
      
      const response = await fetch('/api/whisper', {
        method: 'POST',
        body: formData,
      });
      
      console.log('🎤 [Whisper] Response status:', response.status);
      console.log('🎤 [Whisper] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎤 [Whisper] Error response:', errorText);
        throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
      }
      
      const contentType = response.headers.get('content-type');
      console.log('🎤 [Whisper] Content-Type:', contentType);
      
      // Check if response is HTML (indicates routing issue)
      if (contentType?.includes('text/html')) {
        const htmlText = await response.text();
        console.error('🎤 [Whisper] Received HTML instead of JSON - API endpoint not found');
        console.error('🎤 [Whisper] HTML response:', htmlText.substring(0, 200) + '...');
        throw new Error('API endpoint not found - received HTML instead of JSON');
      }
      
      const responseText = await response.text();
      console.log('🎤 [Whisper] Raw response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('🎤 [Whisper] Parsed JSON:', data);
      } catch (parseError) {
        console.error('🎤 [Whisper] JSON parse error:', parseError);
        console.error('🎤 [Whisper] Failed to parse response:', responseText);
        throw new Error(`Failed to parse Whisper response: ${parseError}`);
      }
      
      return data.transcription || '';
    } catch (error) {
      console.error('🎤 [Whisper] Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }
}

// Google Gemini Service
export class GeminiService {
  static async processTranscription(transcription: string): Promise<GeminiResponse> {
    try {
      console.log('🤖 [Gemini] Starting classification for:', transcription);
      
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription }),
      });
      
      console.log('🤖 [Gemini] Response status:', response.status);
      console.log('🤖 [Gemini] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🤖 [Gemini] Error response:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }
      
      const responseText = await response.text();
      console.log('🤖 [Gemini] Raw response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('🤖 [Gemini] Parsed JSON:', data);
      } catch (parseError) {
        console.error('🤖 [Gemini] JSON parse error:', parseError);
        console.error('🤖 [Gemini] Failed to parse response:', responseText);
        throw new Error(`Failed to parse Gemini response: ${parseError}`);
      }
      
      return {
        type: data.type,
        title: data.title,
        timestamp: data.timestamp,
      };
    } catch (error) {
      console.error('🤖 [Gemini] Processing error:', error);
      return {
        type: 'task',
        title: transcription,
        timestamp: null,
      };
    }
  }
}

// Main AI Service orchestrator
export class AIService {
  static async processVoiceInput(audioUri: string): Promise<AIProcessingResult> {
    try {
      console.log('🚀 [AI Service] Starting voice processing pipeline');
      console.log('🚀 [AI Service] Audio URI:', audioUri);
      
      // Stage 1: Transcribe audio with Whisper
      console.log('🚀 [AI Service] Stage 1: Starting transcription');
      const transcription = await WhisperService.transcribeAudio(audioUri);
      
      if (!transcription || transcription.trim().length === 0) {
        console.error('🚀 [AI Service] No transcription received');
        throw new Error('No transcription received');
      }
      
      console.log('🚀 [AI Service] Stage 1 complete. Transcription:', transcription);
      
      // Stage 2: Process transcription with Gemini
      console.log('🚀 [AI Service] Stage 2: Starting classification');
      const classification = await GeminiService.processTranscription(transcription);
      
      console.log('🚀 [AI Service] Stage 2 complete. Classification:', classification);
      
      const result = {
        transcription,
        classification,
      };
      
      console.log('🚀 [AI Service] Pipeline complete. Final result:', result);
      return result;
    } catch (error) {
      console.error('🚀 [AI Service] Pipeline error:', error);
      throw error;
    }
  }
}
