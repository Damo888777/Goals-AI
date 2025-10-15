import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';
import { useAuth, useGoals, useMilestones, useTasks } from '../hooks/useDatabase';

interface SplashScreenProps {
  onAnimationFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationFinish }) => {
  const animationRef = useRef<LottieView>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [preloadComplete, setPreloadComplete] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Preload app data during splash screen
  const { user, signInAnonymously } = useAuth();
  const { goals } = useGoals();
  const { milestones } = useMilestones();
  const { tasks } = useTasks();

  // Preload app data and sign in user
  useEffect(() => {
    const preloadApp = async () => {
      try {
        // Sign in anonymously if not authenticated
        if (!user) {
          await signInAnonymously();
        }
        
        // Wait for essential data to load or timeout after 4 seconds
        console.log('🚀 [Splash] Starting preload...');
        console.log('🚀 [Splash] Goals loaded:', goals.length);
        console.log('🚀 [Splash] Milestones loaded:', milestones.length);
        console.log('🚀 [Splash] Tasks loaded:', tasks.length);
        
        const startTime = Date.now();
        const maxWaitTime = 4000; // 4 seconds max
        
        // Wait for goals to load or timeout
        while (goals.length === 0 && (Date.now() - startTime) < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('🚀 [Splash] Preload complete. Final counts:');
        console.log('🚀 [Splash] Goals:', goals.length);
        console.log('🚀 [Splash] Milestones:', milestones.length);
        console.log('🚀 [Splash] Tasks:', tasks.length);
        
        // Ensure minimum 2 seconds for good UX
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(2000 - elapsed, 0);
        
        setTimeout(() => {
          setPreloadComplete(true);
        }, remainingTime);
        
      } catch (error) {
        console.error('Error preloading app:', error);
        // Even if preloading fails, mark as complete to avoid getting stuck
        setTimeout(() => {
          setPreloadComplete(true);
        }, 2000);
      }
    };

    preloadApp();
  }, [user, signInAnonymously, goals.length, milestones.length, tasks.length]);

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

  // Handle transition when both animation and preloading are complete
  useEffect(() => {
    if (animationComplete && preloadComplete) {
      // Start fade out transition
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500, // 500ms smooth fade out
        useNativeDriver: true,
      }).start(() => {
        // Cleanup sound when transitioning
        if (sound) {
          sound.unloadAsync();
        }
        onAnimationFinish();
      });
    }
  }, [animationComplete, preloadComplete, fadeAnim, sound, onAnimationFinish]);

  const handleAnimationFinish = () => {
    setAnimationComplete(true);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
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
    </Animated.View>
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