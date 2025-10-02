import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { AIService, AIProcessingResult } from '../services/aiService';

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
  resetRecording: () => void;
}

export function useAudioRecording(): UseAudioRecordingReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIProcessingResult | null>(null);
  
  const recording = useRef<Audio.Recording | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  const resetRecording = useCallback(() => {
    setRecordingState('idle');
    setDuration(0);
    setError(null);
    setResult(null);
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setRecordingState('recording');

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

      // Start duration timer
      const startTime = Date.now();
      durationInterval.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
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

      // Process with AI
      const aiResult = await AIService.processVoiceInput(uri);
      
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
