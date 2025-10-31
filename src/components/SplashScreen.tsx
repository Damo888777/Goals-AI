import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';
import { useAuth, useGoals, useMilestones, useTasks } from '../hooks/useDatabase';
import { useOnboarding } from '../hooks/useOnboarding';

interface SplashScreenProps {
  onAnimationFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationFinish }) => {
  console.log('🚀🚀🚀 [SplashScreen] Component rendered!');
  
  const animationRef = useRef<LottieView>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [preloadComplete, setPreloadComplete] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  console.log('🚀🚀🚀 [SplashScreen] States:', { preloadComplete, animationComplete });
  
  // Preload app data during splash screen
  const { user, signInAnonymously } = useAuth();
  const { goals } = useGoals();
  const { milestones } = useMilestones();
  const { tasks } = useTasks();
  
  // Load onboarding status during splash to ensure proper navigation
  const { isOnboardingCompleted, isLoading: isOnboardingLoading } = useOnboarding();

  // Preload app data and sign in user
  useEffect(() => {
    const preloadApp = async () => {
      try {
        // Sign in anonymously if not authenticated
        if (!user) {
          await signInAnonymously();
        }
        
        // Wait for essential data AND onboarding status to load
        console.log('🚀 [Splash] Starting preload...');
        console.log('🚀 [Splash] Goals loaded:', goals.length);
        console.log('🚀 [Splash] Milestones loaded:', milestones.length);
        console.log('🚀 [Splash] Tasks loaded:', tasks.length);
        console.log('🚀 [Splash] Onboarding status:', isOnboardingCompleted, 'Loading:', isOnboardingLoading);
        
        const startTime = Date.now();
        const maxWaitTime = 4000; // 4 seconds max
        
        // Wait for onboarding status to be determined (critical for first launch)
        console.log('🔍 [Splash] Waiting for onboarding status...', { isOnboardingLoading, isOnboardingCompleted });
        while (isOnboardingLoading && (Date.now() - startTime) < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log('🔍 [Splash] Still waiting for onboarding...', { isOnboardingLoading, elapsed: Date.now() - startTime });
        }
        console.log('✅ [Splash] Onboarding status determined:', { isOnboardingLoading, isOnboardingCompleted });
        
        // Wait for goals to load or timeout (only for returning users)
        if (isOnboardingCompleted) {
          console.log('🔍 [Splash] User has completed onboarding, waiting for goals...');
          while (goals.length === 0 && (Date.now() - startTime) < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          console.log('✅ [Splash] Goals loaded or timeout reached');
        } else {
          console.log('✅ [Splash] User needs onboarding, skipping goal loading');
        }
        
        console.log('🚀 [Splash] Preload complete. Final counts:');
        console.log('🚀 [Splash] Goals:', goals.length);
        console.log('🚀 [Splash] Milestones:', milestones.length);
        console.log('🚀 [Splash] Tasks:', tasks.length);
        
        // Ensure minimum 2 seconds for good UX
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(2000 - elapsed, 0);
        
        console.log('⏰ [Splash] Setting preload complete in', remainingTime, 'ms');
        setTimeout(() => {
          console.log('✅ [Splash] Preload marked complete');
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
  }, [user]); // Only re-run if user changes (not on data changes)

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
    console.log('🔍 [Splash] Transition check:', { animationComplete, preloadComplete });
    if (animationComplete && preloadComplete) {
      console.log('🚀 [Splash] Both animation and preload complete, starting fade out');
      // Start fade out immediately to prevent white screen flash
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800, // Match main app fade-in duration
        useNativeDriver: true,
      }).start(() => {
        console.log('✅ [Splash] Fade out complete, calling onAnimationFinish');
        // Cleanup sound when transitioning
        if (sound) {
          sound.unloadAsync();
        }
        onAnimationFinish();
      });
    }
  }, [animationComplete, preloadComplete, fadeAnim, sound, onAnimationFinish]);

  const handleAnimationFinish = () => {
    console.log('✅ [Splash] Lottie animation finished');
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