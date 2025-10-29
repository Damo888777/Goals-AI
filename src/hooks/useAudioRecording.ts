import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from 'react-i18next';
import { AIService, AIProcessingResult } from '../services/aiService';
import { useGoals, useMilestones } from './useDatabase';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'completed' | 'error';

export interface UseAudioRecordingReturn {
  recordingState: RecordingState;
  isRecording: boolean;
  isProcessing: boolean;
  duration: number;
  error: string | null;
  result: AIProcessingResult | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  toggleRecording: () => Promise<void>;
  resetRecording: () => Promise<void>;
}

export function useAudioRecording(): UseAudioRecordingReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIProcessingResult | null>(null);
  
  const recording = useRef<Audio.Recording | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Get current language and existing goals/milestones for AI matching
  const { i18n } = useTranslation();
  const { goals } = useGoals();
  const { milestones } = useMilestones();

  const resetRecording = useCallback(async () => {
    // Stop and cleanup any active recording first
    if (recording.current) {
      try {
        console.log('Cleaning up active recording...');
        await recording.current.stopAndUnloadAsync();
      } catch (cleanupError) {
        console.error('Error cleaning up recording during reset:', cleanupError);
      }
      recording.current = null;
    }
    
    // Clear the duration timer
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
    
    // Reset all state
    setRecordingState('idle');
    setDuration(0);
    setError(null);
    setResult(null);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setRecordingState('recording');
      
      // Log goals availability at recording start
      console.log('🎤 [Audio Recording] Starting recording with goals loaded:', goals?.length || 0);
      console.log('🎤 [Audio Recording] Goals available:', goals?.map(g => ({ id: g.id, title: g.title })) || []);

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio recording permission not granted');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create and start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recording.current = newRecording;

      // Start duration timer with 1-minute maximum
      const startTime = Date.now();
      durationInterval.current = setInterval(() => {
        const currentDuration = Math.floor((Date.now() - startTime) / 1000);
        setDuration(currentDuration);
        
        // Auto-stop after 60 seconds (1 minute)
        if (currentDuration >= 60) {
          console.log('Recording reached 1-minute limit, auto-stopping');
          stopRecording();
        }
      }, 100);

    } catch (error) {
      console.error('Failed to start recording:', error);
      setError(error instanceof Error ? error.message : 'Failed to start recording');
      setRecordingState('error');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (!recording.current) {
        throw new Error('No active recording found');
      }

      setRecordingState('processing');
      
      // Clear duration timer
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      // Stop and unload recording
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      recording.current = null;

      if (!uri) {
        throw new Error('No recording URI found');
      }

      // Check if file exists and has content
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || fileInfo.size === 0) {
        throw new Error('Recording file is empty or does not exist');
      }

      // Process with AI, passing existing goals and milestones for matching
      console.log('🎤 [Audio Recording] Existing goals for AI matching:', goals?.map(g => ({ id: g.id, title: g.title })) || []);
      console.log('🎤 [Audio Recording] Existing milestones for AI matching:', milestones?.map(m => ({ id: m.id, title: m.title })) || []);
      
      // Ensure we have arrays even if hooks return undefined
      const safeGoals = goals || [];
      const safeMilestones = milestones || [];
      
      console.log('🎤 [Audio Recording] Safe goals count:', safeGoals.length);
      console.log('🎤 [Audio Recording] Safe milestones count:', safeMilestones.length);
      
      const aiResult = await AIService.processVoiceInput(uri, safeGoals, safeMilestones, i18n.language);
      
      console.log('🎤 [Audio Recording] AI Result received:', {
        type: aiResult.classification.type,
        title: aiResult.classification.title,
        linkedGoalId: aiResult.classification.linkedGoalId,
        linkedMilestoneId: aiResult.classification.linkedMilestoneId,
        transcription: aiResult.transcription
      });
      
      // Check if transcription is empty or only whitespace
      if (!aiResult.transcription || aiResult.transcription.trim().length === 0) {
        setError('no_text_recognized');
        setRecordingState('error');
        return;
      }
      
      // Track voice input usage after successful processing
      try {
        const { usageTrackingService } = await import('../services/usageTrackingService');
        const tracked = await usageTrackingService.trackVoiceInputUsage();
        if (!tracked) {
          console.warn('⚠️ Voice input usage limit reached');
          setError('Voice input limit reached for your subscription tier');
          setRecordingState('error');
          return;
        }
        console.log('📊 Voice input usage tracked successfully');
      } catch (error) {
        console.error('❌ Failed to track voice input usage:', error);
        setError('Failed to track usage');
        setRecordingState('error');
        return;
      }
      
      setResult(aiResult);
      setRecordingState('completed');

      // Clean up the temporary file
      await FileSystem.deleteAsync(uri, { idempotent: true });

    } catch (error) {
      console.error('Failed to stop recording or process audio:', error);
      setError(error instanceof Error ? error.message : 'Failed to process recording');
      setRecordingState('error');
      
      // Clean up recording if it exists
      if (recording.current) {
        try {
          await recording.current.stopAndUnloadAsync();
        } catch (cleanupError) {
          console.error('Error cleaning up recording:', cleanupError);
        }
        recording.current = null;
      }
    }
  }, []);

  const toggleRecording = useCallback(async () => {
    if (recordingState === 'recording') {
      await stopRecording();
    } else if (recordingState === 'idle' || recordingState === 'error') {
      await startRecording();
    }
  }, [recordingState, startRecording, stopRecording]);

  return {
    recordingState,
    isRecording: recordingState === 'recording',
    isProcessing: recordingState === 'processing',
    duration,
    error,
    result,
    startRecording,
    stopRecording,
    toggleRecording,
    resetRecording,
  };
}
