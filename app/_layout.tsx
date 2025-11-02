import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useState, useEffect, useRef } from 'react';
import { Animated, View, Text } from 'react-native';
import { ErrorBoundary } from 'react-error-boundary';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplashScreen } from '../src/components/SplashScreen';
import { useOnboarding } from '../src/hooks/useOnboarding';
import { SubscriptionProvider, useSubscription } from '../src/hooks/useSubscription';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { notificationService } from '../src/services/notificationService';
import { notificationScheduler } from '../src/services/notificationScheduler';
import { useRealtimeWidgetSync } from '../src/hooks/useRealtimeWidgetSync';
import { widgetTimelineManager } from '../src/services/widgetTimelineManager';
import { OneSignal } from 'react-native-onesignal';
import '../src/services/i18next'; // Initialize i18next
import '../global.css';

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#E9EDC9', justifyContent: 'center', alignItems: 'center' }}>
      <StatusBar style="dark" backgroundColor="#E9EDC9" translucent={false} />
      <SplashScreen onAnimationFinish={() => {}} />
    </GestureHandlerRootView>
  );
}

// Main layout component that has access to subscription context
function MainLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { isOnboardingCompleted, isLoading: isOnboardingLoading } = useOnboarding();
  const { isSubscribed, isLoading: isSubscriptionLoading } = useSubscription();
  
  // Initialize storage first to prevent setObjectForKey errors
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        console.log('🔍 [_layout] Initializing AsyncStorage...');
        // Test AsyncStorage availability
        await AsyncStorage.getItem('storage_test');
        console.log('✅ [_layout] AsyncStorage initialized successfully');
        setIsStorageReady(true);
      } catch (error) {
        console.error('Storage initialization failed:', error);
        // Still mark as ready to prevent app hang
        console.log('⚠️ [_layout] Storage failed but marking as ready to prevent hang');
        setIsStorageReady(true);
      }
    };
    
    initializeStorage();
  }, []);
  
  // Keep widget data in sync with app data with real-time updates (only for main app)
  // Always call the hook, but let it handle the conditional logic internally
  useRealtimeWidgetSync();

  const handleSplashFinish = () => {
    console.log('✅ [_layout] Splash screen finished, setting isLoading to false');
    setIsLoading(false);
  };

  // Initialize OneSignal and widget timeline manager ONLY for main app (not during onboarding)
  useEffect(() => {
    // Only initialize main app services when onboarding is completed
    if (isOnboardingCompleted === true) {
      const initializeServices = async () => {
        console.log('🔧 [_layout] Initializing main app services (onboarding completed)');
        
        // Initialize OneSignal
        OneSignal.initialize('bcd988a6-d832-4c7c-83bf-4af40c46bf53');
        
        // DISABLED: Using native LiveActivityModule instead of OneSignal Live Activities
        // OneSignal.LiveActivities.setupDefault();
        
        await notificationService.initialize();
        // Update last activity on app start
        await notificationScheduler.updateLastActivity();
        
        // Initialize intelligent widget timeline management
        await widgetTimelineManager.initialize();
      };
      
      initializeServices();
    } else {
      console.log('🔧 [_layout] Skipping main app services (onboarding not completed)');
    }
    
    // Cleanup function
    return () => {
      if (isOnboardingCompleted === true) {
        widgetTimelineManager.shutdown();
      }
    };
  }, [isOnboardingCompleted]);

  // Check if app is ready (splash finished, storage ready, onboarding status loaded, and subscription status loaded)
  useEffect(() => {
    console.log('🔍 [_layout] App readiness check:', {
      isLoading,
      isOnboardingLoading,
      isSubscriptionLoading,
      isStorageReady,
      isOnboardingCompleted,
      isSubscribed,
      allReady: !isLoading && !isOnboardingLoading && !isSubscriptionLoading && isStorageReady && isOnboardingCompleted !== null
    });
    
    // CRITICAL: Only mark app as ready when both onboarding AND subscription status are definitively known
    if (!isLoading && !isOnboardingLoading && !isSubscriptionLoading && isStorageReady && isOnboardingCompleted !== null) {
      console.log('✅ [_layout] App is ready! Setting isAppReady to true');
      setIsAppReady(true);
    }
  }, [isLoading, isOnboardingLoading, isSubscriptionLoading, isStorageReady, isOnboardingCompleted, isSubscribed]);

  // Fade in the main app when ready
  useEffect(() => {
    if (isAppReady) {
      // Start fade-in immediately when app is ready to eliminate white screen
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800, // Match splash fade-out duration for perfect crossfade
        useNativeDriver: true,
      }).start();
    }
  }, [isAppReady, fadeAnim]);

  // Handle routing based on onboarding and subscription status
  useEffect(() => {
    if (isAppReady && isOnboardingCompleted !== null && !isSubscriptionLoading) {
      console.log('🚀 [_layout] App ready, determining route based on status:', {
        isOnboardingCompleted,
        isSubscribed,
        isSubscriptionLoading
      });
      
      if (isOnboardingCompleted === false) {
        // User hasn't completed onboarding -> Onboarding flow (highest priority)
        console.log('🎯 [_layout] Routing to onboarding (not completed)');
        router.replace('/onboarding');
      } else if (isOnboardingCompleted === true && isSubscribed === true) {
        // User completed onboarding and has subscription -> Main app (prioritize this)
        console.log('🎯 [_layout] Routing to main app (onboarding completed + subscribed)');
        router.replace('/(tabs)');
      } else if (isOnboardingCompleted === true && isSubscribed === false && !isSubscriptionLoading) {
        // Only route to paywall if we're sure subscription is loaded and false
        console.log('🎯 [_layout] Routing to paywall (completed onboarding but not subscribed)');
        router.replace('/onboarding/paywall');
      }
    }
  }, [isAppReady, isOnboardingCompleted, isSubscribed, isSubscriptionLoading]);

  // Show splash while loading or checking onboarding
  if (isLoading || !isAppReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#E9EDC9' }}>
        <StatusBar style="dark" backgroundColor="#E9EDC9" translucent={false} />
        <SplashScreen onAnimationFinish={handleSplashFinish} />
      </GestureHandlerRootView>
    );
  }

  console.log('🚀 [_layout] Rendering ROOT LAYOUT with onboarding status:', { isOnboardingCompleted });
  console.log('🚀 [_layout] CRITICAL ROUTING DECISION: Will route to:', isOnboardingCompleted === true ? '(tabs) - MAIN APP' : 'onboarding - ONBOARDING FLOW');
  
  return (
    <>
      <StatusBar style="dark" backgroundColor="#E9EDC9" translucent={false} />
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* ALWAYS RENDER STACK NAVIGATOR TO ENSURE ROUTING WORKS */}
        <Stack 
          screenOptions={{ 
            headerShown: false, 
            contentStyle: { backgroundColor: '#E9EDC9' } 
          }}
          initialRouteName="onboarding"
        >
          {/* Onboarding routes - always available */}
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          
          {/* Main app routes - only accessible after onboarding */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="vision-board" options={{ headerShown: false }} />
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
          <Stack.Screen name="spark-ai" options={{ headerShown: false }} />
          <Stack.Screen name="spark-ai-output" options={{ headerShown: false }} />
          <Stack.Screen name="spark-generate-img" options={{ headerShown: false }} />
        </Stack>
      </Animated.View>
    </>
  );
}

// Root wrapper that provides context
export default function RootLayout() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LanguageProvider>
          <SubscriptionProvider>
            <MainLayout />
          </SubscriptionProvider>
        </LanguageProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
