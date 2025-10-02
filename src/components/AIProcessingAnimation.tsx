import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { RecordingState } from '../hooks/useAudioRecording';

interface AIProcessingAnimationProps {
  state: RecordingState;
  duration?: number;
}

export function AIProcessingAnimation({ state, duration = 0 }: AIProcessingAnimationProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'recording') {
      // Pulsing animation for recording
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      return () => pulseAnimation.stop();
    } else if (state === 'processing') {
      // Spinning animation for processing
      const spinAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();

      return () => spinAnimation.stop();
    } else if (state === 'completed') {
      // Quick confirmation animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(800),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [state, pulseAnim, rotateAnim, fadeAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = (): string => {
    switch (state) {
      case 'recording':
        return 'Recording...';
      case 'processing':
        return 'Processing with AI...';
      case 'completed':
        return 'Complete!';
      case 'error':
        return 'Error occurred';
      default:
        return '';
    }
  };

  const getStatusColor = (): string => {
    switch (state) {
      case 'recording':
        return '#ef4444'; // Red for recording
      case 'processing':
        return '#3b82f6'; // Blue for processing
      case 'completed':
        return '#10b981'; // Green for completed
      case 'error':
        return '#f59e0b'; // Orange for error
      default:
        return '#6b7280'; // Gray default
    }
  };

  if (state === 'idle') {
    return null;
  }

  return (
    <Animated.View 
      style={{ 
        opacity: fadeAnim,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3000,
      }}
    >
      <View className="bg-bg-secondary border border-border-primary rounded-2xl p-8 mx-8 items-center">
        {/* Animation Circle */}
        <Animated.View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: getStatusColor(),
            marginBottom: 20,
            transform: [
              { scale: state === 'recording' ? pulseAnim : 1 },
              { rotate: state === 'processing' ? spin : '0deg' },
            ],
          }}
          className="items-center justify-center"
        >
          {state === 'recording' && (
            <View className="w-6 h-6 bg-white rounded-full" />
          )}
          {state === 'processing' && (
            <View className="w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
          )}
          {state === 'completed' && (
            <Text className="text-white text-2xl font-bold">✓</Text>
          )}
          {state === 'error' && (
            <Text className="text-white text-2xl font-bold">!</Text>
          )}
        </Animated.View>

        {/* Status Text */}
        <Text className="text-text-primary font-helvetica-bold text-xl mb-2 text-center">
          {getStatusText()}
        </Text>

        {/* Duration for recording */}
        {state === 'recording' && (
          <Text className="text-text-primary font-helvetica text-lg">
            {formatDuration(duration)}
          </Text>
        )}

        {/* Processing stages */}
        {state === 'processing' && (
          <View className="items-center">
            <Text className="text-text-primary font-helvetica text-sm mb-2 text-center">
              Converting speech to text...
            </Text>
            <Text className="text-text-primary font-helvetica text-sm text-center opacity-70">
              Then analyzing with Gemini AI
            </Text>
          </View>
        )}

        {/* Completion message */}
        {state === 'completed' && (
          <Text className="text-text-primary font-helvetica text-sm text-center">
            Your input has been processed successfully!
          </Text>
        )}
      </View>
    </Animated.View>
  );
}
