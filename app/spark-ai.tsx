import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { images } from '../src/constants/images';

export default function SparkAIScreen() {
  const insets = useSafeAreaInsets();
  const [isRecording, setIsRecording] = useState(false);

  const handleBackPress = () => {
    router.back();
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
        {/* Microphone Button */}
        <View style={styles.microphoneContainer}>
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
    borderRadius: 60,
    backgroundColor: '#364958',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  microphoneButtonRecording: {
    backgroundColor: '#FF6B6B', // Red color when recording
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
});
