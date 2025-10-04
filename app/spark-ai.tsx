import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useState, useEffect, useRef } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { images } from '../src/constants/images';
import { useAudioRecording } from '../src/hooks/useAudioRecording';

export default function SparkAIScreen() {
  const insets = useSafeAreaInsets();
  
  // Use the audio recording hook for AI functionality
  const {
    recordingState,
    isRecording,
    isProcessing,
    duration,
    error,
    result,
    toggleRecording,
    resetRecording,
  } = useAudioRecording();

  // Animation values for wave effect using React Native Animated
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;
  const wave4 = useRef(new Animated.Value(0)).current;

  const handleBackPress = () => {
    // Reset recording state when leaving the screen
    if (isRecording || isProcessing) {
      resetRecording();
    }
    router.back();
  };

  // Handle AI processing completion
  useEffect(() => {
    if (recordingState === 'completed' && result) {
      // Trigger success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to spark-ai-output with the AI processed data
      setTimeout(() => {
        router.push({
          pathname: '/spark-ai-output',
          params: {
            type: result.classification.type,
            title: result.classification.title,
            timestamp: result.classification.timestamp || '',
            transcription: result.transcription,
          },
        });
        resetRecording();
      }, 1500); // Show completion animation for 1.5 seconds
    } else if (recordingState === 'error') {
      // Trigger error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Auto-reset after showing error for a moment
      setTimeout(() => {
        resetRecording();
      }, 3000);
    }
  }, [recordingState, result, resetRecording]);

  // Start/stop wave animations based on recording state
  useEffect(() => {
    if (isRecording || isProcessing) {
      // Reset all values to 0 first for consistent start
      wave1.setValue(0);
      wave2.setValue(0);
      wave3.setValue(0);
      wave4.setValue(0);
      
      // Different animation speeds for recording vs processing
      const baseDuration = isProcessing ? 1500 : 3000; // Faster for processing
      
      // Start continuous wave animations - only expanding outward
      const wave1Animation = Animated.loop(
        Animated.timing(wave1, {
          toValue: 1,
          duration: baseDuration,
          useNativeDriver: true,
        })
      );
      
      const wave2Animation = Animated.loop(
        Animated.timing(wave2, {
          toValue: 1,
          duration: baseDuration + 300,
          useNativeDriver: true,
        })
      );
      
      const wave3Animation = Animated.loop(
        Animated.timing(wave3, {
          toValue: 1,
          duration: baseDuration - 300,
          useNativeDriver: true,
        })
      );
      
      const wave4Animation = Animated.loop(
        Animated.timing(wave4, {
          toValue: 1,
          duration: baseDuration + 600,
          useNativeDriver: true,
        })
      );

      // Start animations with slight delays for staggered effect
      wave1Animation.start();
      setTimeout(() => wave2Animation.start(), 200);
      setTimeout(() => wave3Animation.start(), 400);
      setTimeout(() => wave4Animation.start(), 600);

      return () => {
        wave1Animation.stop();
        wave2Animation.stop();
        wave3Animation.stop();
        wave4Animation.stop();
      };
    } else {
      // Stop animations smoothly
      Animated.parallel([
        Animated.timing(wave1, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(wave2, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(wave3, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(wave4, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isRecording, isProcessing]);

  // Animated styles for wave effects
  const wave1Style = {
    transform: [
      {
        scale: wave1.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2.5],
        }),
      },
    ],
    opacity: wave1.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 0],
    }),
  };

  const wave2Style = {
    transform: [
      {
        scale: wave2.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 3.2],
        }),
      },
    ],
    opacity: wave2.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 0],
    }),
  };

  const wave3Style = {
    transform: [
      {
        scale: wave3.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2.0],
        }),
      },
    ],
    opacity: wave3.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 0],
    }),
  };

  const wave4Style = {
    transform: [
      {
        scale: wave4.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 3.8],
        }),
      },
    ],
    opacity: wave4.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0],
    }),
  };

  const handleInfoPress = () => {
    // Handle info button press
  };

  const handleMicrophonePress = () => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Toggle AI recording workflow
    toggleRecording();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBackPress} style={styles.headerButton}>
          <View style={styles.chevronLeft}>
            <View style={styles.chevronLine1} />
            <View style={styles.chevronLine2} />
          </View>
        </Pressable>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Spark</Text>
        </View>
        
        <Pressable onPress={handleInfoPress} style={styles.headerButton}>
          <View style={styles.infoIcon}>
            <Text style={styles.infoText}>i</Text>
          </View>
        </Pressable>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Microphone Button with Wave Animation */}
        <View style={styles.microphoneContainer}>
          {/* Wave Layers - Sky Blue and White */}
          <Animated.View style={[styles.waveLayer, styles.wave4, wave4Style]} />
          <Animated.View style={[styles.waveLayer, styles.wave3, wave3Style]} />
          <Animated.View style={[styles.waveLayer, styles.wave2, wave2Style]} />
          <Animated.View style={[styles.waveLayer, styles.wave1, wave1Style]} />
          
          {/* Main Button */}
          <Pressable
            onPress={handleMicrophonePress}
            style={[
              styles.microphoneButton,
              isRecording && styles.microphoneButtonRecording,
              isProcessing && styles.microphoneButtonProcessing
            ]}
          >
            <Image 
              source={images.icons.sparkAILight} 
              style={styles.sparkAIImage}
              contentFit="contain"
            />
          </Pressable>
        </View>

        {/* Instruction Text */}
        <Text style={styles.instructionText}>
          {recordingState === 'recording' ? `Recording... ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` :
           recordingState === 'processing' ? 'Spark is processing...' :
           recordingState === 'completed' ? 'Complete!' :
           recordingState === 'error' ? 'Error occurred - tap to try again' :
           'Tap to start recording'}
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D4E5B7', // Light green background from the design
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronLeft: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronLine1: {
    position: 'absolute',
    width: 10,
    height: 2,
    backgroundColor: '#364958',
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }, { translateX: 3 }, { translateY: -2 }],
  },
  chevronLine2: {
    position: 'absolute',
    width: 10,
    height: 2,
    backgroundColor: '#364958',
    borderRadius: 1,
    transform: [{ rotate: '45deg' }, { translateX: 3 }, { translateY: 2 }],
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    pointerEvents: 'none', // Allow touches to pass through to buttons
  },
  sparkIconImage: {
    width: 20,
    height: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#364958',
  },
  infoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#364958',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#364958',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  microphoneContainer: {
    alignItems: 'center',
  },
  microphoneButton: {
    width: 120,
    height: 120,
    backgroundColor: '#364958',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  microphoneButtonRecording: {
    backgroundColor: '#364958', // Keep same blue when recording
  },
  microphoneButtonProcessing: {
    backgroundColor: '#669bbc', // Blue for processing state
  },
  microphoneIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    fontSize: 18,
    color: '#364958',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 40,
  },
  sparkAIImage: {
    width: 50,
    height: 50,
  },
  // Wave animation styles
  waveLayer: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave1: {
    backgroundColor: 'rgba(54, 73, 88, 0.3)', // Match button blue
  },
  wave2: {
    backgroundColor: 'rgba(54, 73, 88, 0.2)', // Match button blue lighter
  },
  wave3: {
    backgroundColor: 'rgba(54, 73, 88, 0.25)', // Match button blue
  },
  wave4: {
    backgroundColor: 'rgba(54, 73, 88, 0.15)', // Match button blue lightest
  },
});
