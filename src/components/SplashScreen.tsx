import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';

interface SplashScreenProps {
  onAnimationFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationFinish }) => {
  const animationRef = useRef<LottieView>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    let isMounted = true;

    const playAnimation = async () => {
      try {
        // Load and play the intro sound
        const { sound: audioSound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/intro-sound-bell-269297.mp3'),
          { shouldPlay: true, volume: 0.8 }
        );
        
        if (isMounted) {
          setSound(audioSound);
        }

        // Try to start the Lottie animation
        if (animationRef.current && isMounted && !useFallback) {
          animationRef.current.play();
        } else if (useFallback) {
          // Fallback animation
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start();

          setTimeout(() => {
            if (isMounted) {
              handleAnimationFinish();
            }
          }, 3000);
        }

      } catch (error) {
        console.error('Error playing splash screen:', error);
        setUseFallback(true);
        
        // Fallback animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          if (isMounted) {
            handleAnimationFinish();
          }
        }, 3000);
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
  }, [useFallback]);

  const handleAnimationFinish = () => {
    // Cleanup sound when animation finishes
    if (sound) {
      sound.unloadAsync();
    }
    onAnimationFinish();
  };

  const handleLottieError = (error: any) => {
    console.error('Lottie animation error:', error);
    setUseFallback(true);
  };

  return (
    <View style={styles.container}>
      {!useFallback ? (
        <LottieView
          ref={animationRef}
          source={require('../../assets/animations/SplashScreenAnimation.json')}
          style={styles.animation}
          autoPlay={true}
          loop={false}
          onAnimationFinish={handleAnimationFinish}
          onError={handleLottieError}
          resizeMode="contain"
        />
      ) : (
        <Animated.View style={[
          styles.fallbackContainer,
          { opacity: fadeAnim }
        ]}>
          <Text style={styles.fallbackTitle}>Goals AI</Text>
          <Text style={styles.fallbackSubtitle}>Your dreams take shape</Text>
        </Animated.View>
      )}
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EDC9', // Match app background
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: width,
    height: height,
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  fallbackTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#364958',
    textAlign: 'center',
  },
  fallbackSubtitle: {
    fontSize: 16,
    color: '#588157',
    textAlign: 'center',
    opacity: 0.8,
  },
});