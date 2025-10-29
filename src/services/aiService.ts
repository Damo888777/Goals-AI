import { Audio } from 'expo-av';
import { getApiUrl } from '../constants/config';

// Types for AI responses
export interface WhisperResponse {
  text: string;
}

export interface GeminiResponse {
  type: 'task' | 'goal' | 'milestone';
  title: string;
  timestamp: string | null;
  linkedGoalId?: string | null;
  linkedMilestoneId?: string | null;
}

export interface AIProcessingResult {
  transcription: string;
  classification: GeminiResponse;
}

// OpenAI Whisper Service
export class WhisperService {
  static async transcribeAudio(audioUri: string, language: string = 'en'): Promise<string> {
    try {
      console.log('🎤 [Whisper] Starting transcription for:', audioUri, 'Language:', language);
      
      const formData = new FormData();
      
      const audioFile = {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any;
      
      formData.append('audio', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'text');
      formData.append('language', language);
      
      const apiUrl = getApiUrl('/api/whisper');
      console.log('🎤 [Whisper] Sending request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
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
  static async processTranscription(
    transcription: string, 
    existingGoals: any[] = [], 
    existingMilestones: any[] = [],
    language: string = 'en'
  ): Promise<GeminiResponse> {
    try {
      console.log('🤖 [Gemini] Starting classification for:', transcription);
      
      const apiUrl = getApiUrl('/api/gemini');
      console.log('🤖 [Gemini] Sending request to:', apiUrl);
      console.log('🤖 [Gemini] Request payload:', {
        transcription,
        existingGoals: existingGoals?.map(g => ({ id: g.id, title: g.title })) || [],
        existingMilestones: existingMilestones?.map(m => ({ id: m.id, title: m.title })) || []
      });
      
      console.log('🤖 [Gemini] Searching for goal match in transcription:', transcription);
      console.log('🤖 [Gemini] Available goals to match against:', existingGoals?.length || 0);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          transcription, 
          existingGoals, 
          existingMilestones,
          language
        }),
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
      
      const result = {
        type: data.type,
        title: data.title,
        timestamp: data.timestamp,
        linkedGoalId: data.linkedGoalId || null,
        linkedMilestoneId: data.linkedMilestoneId || null,
      };
      
      console.log('🤖 [Gemini] Final classification result:', result);
      
      if (result.linkedGoalId) {
        const matchedGoal = existingGoals.find(g => g.id === result.linkedGoalId);
        console.log('🤖 [Gemini] Matched goal:', matchedGoal ? { id: matchedGoal.id, title: matchedGoal.title } : 'NOT FOUND');
      }
      
      if (result.linkedMilestoneId) {
        const matchedMilestone = existingMilestones.find(m => m.id === result.linkedMilestoneId);
        console.log('🤖 [Gemini] Matched milestone:', matchedMilestone ? { id: matchedMilestone.id, title: matchedMilestone.title } : 'NOT FOUND');
      }
      
      return result;
    } catch (error) {
      console.error('🤖 [Gemini] Processing error:', error);
      return {
        type: 'task',
        title: transcription,
        timestamp: null,
        linkedGoalId: null,
        linkedMilestoneId: null,
      };
    }
  }
}

// Main AI Service orchestrator
export class AIService {
  static async processVoiceInput(
    audioUri: string, 
    existingGoals: any[] = [], 
    existingMilestones: any[] = [],
    language: string = 'en'
  ): Promise<AIProcessingResult> {
    try {
      console.log('🚀 [AI Service] Starting voice processing pipeline');
      console.log('🚀 [AI Service] Audio URI:', audioUri, 'Language:', language);
      
      // Stage 1: Transcribe audio with Whisper
      console.log('🚀 [AI Service] Stage 1: Starting transcription');
      const transcription = await WhisperService.transcribeAudio(audioUri, language);
      
      if (!transcription || transcription.trim().length === 0) {
        console.error('🚀 [AI Service] No transcription received');
        throw new Error('No transcription received');
      }
      
      console.log('🚀 [AI Service] Stage 1 complete. Transcription:', transcription);
      
      // Stage 2: Process transcription with Gemini
      console.log('🚀 [AI Service] Stage 2: Starting classification');
      const classification = await GeminiService.processTranscription(transcription, existingGoals, existingMilestones, language);
      
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
