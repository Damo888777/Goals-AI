import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, Animated, StatusBar } from 'react-native';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';

interface SplashScreenProps {
  onAnimationFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationFinish }) => {
  const animationRef = useRef<LottieView>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    let isMounted = true;

    const playAnimation = async () => {
      try {
        // Start the Lottie animation immediately
        if (animationRef.current && isMounted) {
          animationRef.current.play();
        }

        // Delay sound by 0.7 seconds
        setTimeout(async () => {
          if (isMounted) {
            try {
              const { sound: audioSound } = await Audio.Sound.createAsync(
                require('../../assets/sounds/intro-sound-bell-269297.mp3'),
                { shouldPlay: true, volume: 0.8 }
              );
              setSound(audioSound);
            } catch (soundError) {
              console.error('Error playing sound:', soundError);
            }
          }
        }, 800);

      } catch (error) {
        console.error('Error playing splash screen:', error);
        // If animation fails, still proceed
        if (animationRef.current && isMounted) {
          animationRef.current.play();
        }
      }
    };

    playAnimation();

    return () => {
      isMounted = false;
      // Cleanup sound
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const handleAnimationFinish = () => {
    // Cleanup sound when animation finishes
    if (sound) {
      sound.unloadAsync();
    }
    onAnimationFinish();
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <LottieView
        ref={animationRef}
        source={require('../../assets/animations/SplashScreenAnimation.json')}
        style={styles.animation}
        autoPlay={false}
        loop={false}
        onAnimationFinish={handleAnimationFinish}
        resizeMode="cover"
      />
    </View>
  );
};

const { width, height } = Dimensions.get('screen'); // Use 'screen' instead of 'window' to get full device dimensions

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EDC9', // Match app background
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  animation: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
  },
});