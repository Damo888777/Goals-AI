import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { SplashScreen } from '../src/components/SplashScreen';
import { useOnboarding } from '../src/hooks/useOnboarding';
import { SubscriptionProvider } from '../src/hooks/useSubscription';
import { notificationService } from '../src/services/notificationService';
import { notificationScheduler } from '../src/services/notificationScheduler';
import { useRealtimeWidgetSync } from '../src/hooks/useRealtimeWidgetSync';
import { widgetTimelineManager } from '../src/services/widgetTimelineManager';
import '../global.css';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { isOnboardingCompleted, isLoading: isOnboardingLoading } = useOnboarding();
  
  // Keep widget data in sync with app data with real-time updates
  useRealtimeWidgetSync();

  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  // Initialize OneSignal and widget timeline manager when app starts
  useEffect(() => {
    const initializeServices = async () => {
      await notificationService.initialize();
      // Update last activity on app start
      await notificationScheduler.updateLastActivity();
      
      // Initialize intelligent widget timeline management
      await widgetTimelineManager.initialize();
    };
    
    initializeServices();
    
    // Cleanup function
    return () => {
      widgetTimelineManager.shutdown();
    };
  }, []);

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
        <SubscriptionProvider>
          <StatusBar style="dark" />
          <Stack 
            screenOptions={{ 
              headerShown: false,
              contentStyle: { backgroundColor: '#E9EDC9' },
              animation: 'fade',
              animationDuration: 300
            }}
            initialRouteName={isOnboardingCompleted === false ? "onboarding" : "(tabs)"}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="vision-board" options={{ headerShown: false }} />
            <Stack.Screen name="spark-ai" options={{ headerShown: false }} />
            <Stack.Screen name="spark-ai-output" options={{ headerShown: false }} />
            <Stack.Screen name="spark-generate-img" options={{ headerShown: false }} />
            <Stack.Screen name="manual-goal" options={{ headerShown: false }} />
            <Stack.Screen name="manual-milestone" options={{ headerShown: false }} />
            <Stack.Screen name="manual-task" options={{ headerShown: false }} />
            <Stack.Screen name="goal-details" options={{ headerShown: false }} />
            <Stack.Screen name="milestone-details" options={{ headerShown: false }} />
            <Stack.Screen name="task-details" options={{ headerShown: false }} />
            <Stack.Screen name="completed-goal-details" options={{ headerShown: false }} />
            <Stack.Screen name="completed-task-details" options={{ headerShown: false }} />
            <Stack.Screen name="view-full-progress" options={{ headerShown: false }} />
            <Stack.Screen name="trophy" options={{ headerShown: false }} />
            <Stack.Screen name="pomodoro" options={{ headerShown: false }} />
            <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
          </Stack>
        </SubscriptionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
