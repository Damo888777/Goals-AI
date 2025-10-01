import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useState, useEffect, useRef } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { images } from '../src/constants/images';

export default function SparkAIScreen() {
  const insets = useSafeAreaInsets();
  const [isRecording, setIsRecording] = useState(false);

  // Animation values for wave effect using React Native Animated
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;
  const wave4 = useRef(new Animated.Value(0)).current;

  const handleBackPress = () => {
    router.back();
  };

  // Start/stop wave animations based on recording state
  useEffect(() => {
    if (isRecording) {
      // Start continuous wave animations with different phases
      const wave1Animation = Animated.loop(
        Animated.timing(wave1, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      const wave2Animation = Animated.loop(
        Animated.timing(wave2, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        })
      );
      const wave3Animation = Animated.loop(
        Animated.timing(wave3, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        })
      );
      const wave4Animation = Animated.loop(
        Animated.timing(wave4, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        })
      );

      wave1Animation.start();
      wave2Animation.start();
      wave3Animation.start();
      wave4Animation.start();

      return () => {
        wave1Animation.stop();
        wave2Animation.stop();
        wave3Animation.stop();
        wave4Animation.stop();
      };
    } else {
      // Stop animations
      Animated.timing(wave1, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
      Animated.timing(wave2, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
      Animated.timing(wave3, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
      Animated.timing(wave4, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isRecording]);

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
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.6, 0],
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
      inputRange: [0, 0.3, 1],
      outputRange: [0, 0.4, 0],
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
      inputRange: [0, 0.4, 1],
      outputRange: [0, 0.5, 0],
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
      inputRange: [0, 0.2, 1],
      outputRange: [0, 0.3, 0],
    }),
  };

  const handleInfoPress = () => {
    // Handle info button press
  };

  const handleMicrophonePress = () => {
    setIsRecording(!isRecording);
    // Handle voice recording logic here
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBackPress} style={[styles.headerButton, styles.backButton]}>
          <View style={styles.chevronLeft}>
            <View style={styles.chevronLine1} />
            <View style={styles.chevronLine2} />
          </View>
        </Pressable>
        
        <View style={styles.titleContainer}>
          <Image 
            source={images.icons.sparkAI} 
            style={styles.sparkIconImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>Spark</Text>
        </View>
        
        <Pressable onPress={handleInfoPress} style={[styles.headerButton, styles.infoButton]}>
          <View style={styles.infoIcon}>
            <Text style={styles.infoText}>?</Text>
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
              isRecording && styles.microphoneButtonRecording
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
          {isRecording ? 'Recording...' : 'Tap to start recording'}
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'relative',
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
  },
  infoButton: {
    position: 'absolute',
    right: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    marginBottom: 40,
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
  microphoneIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    fontSize: 18,
    color: '#364958',
    fontWeight: '500',
    textAlign: 'center',
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
