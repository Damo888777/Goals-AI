import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { SplashScreen } from '../src/components/SplashScreen';
import { useOnboarding } from '../src/hooks/useOnboarding';
import '../global.css';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { isOnboardingCompleted, isLoading: isOnboardingLoading } = useOnboarding();

  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  // Check if app is ready (splash finished and onboarding status loaded)
  useEffect(() => {
    if (!isLoading && !isOnboardingLoading) {
      setIsAppReady(true);
    }
  }, [isLoading, isOnboardingLoading]);

  // Fade in the main app when ready
  useEffect(() => {
    if (isAppReady) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300, // 300ms smooth fade in
        useNativeDriver: true,
      }).start();
    }
  }, [isAppReady, fadeAnim]);

  // Show splash while loading or checking onboarding
  if (isLoading || !isAppReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#E9EDC9' }}>
        <StatusBar style="dark" hidden={true} />
        <SplashScreen onAnimationFinish={handleSplashFinish} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#E9EDC9' }}>
      <SafeAreaProvider style={{ backgroundColor: '#E9EDC9' }}>
        <StatusBar style="dark" />
        <Animated.View style={{ flex: 1, opacity: fadeAnim, backgroundColor: '#E9EDC9' }}>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Show onboarding if not completed, otherwise show main app */}
            {isOnboardingCompleted === false ? (
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            ) : (
              <>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="vision-board" options={{ headerShown: false }} />
                <Stack.Screen name="spark-ai" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              </>
            )}
          </Stack>
        </Animated.View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
