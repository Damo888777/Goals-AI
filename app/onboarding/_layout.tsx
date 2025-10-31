import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from 'react-error-boundary';
import { LanguageProvider } from '../../src/contexts/LanguageContext';

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#E9EDC9', justifyContent: 'center', alignItems: 'center' }}>
      <StatusBar style="dark" backgroundColor="#E9EDC9" translucent={false} />
    </GestureHandlerRootView>
  );
}

export default function OnboardingLayout() {
  console.log('🔐 [OnboardingLayout] ONBOARDING ROUTING ACTIVE');
  
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LanguageProvider>
          <StatusBar style="dark" backgroundColor="#E9EDC9" translucent={false} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#E9EDC9' } }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="paywall" options={{ headerShown: false }} />
            <Stack.Screen name="spark-ai" options={{ headerShown: false }} />
            <Stack.Screen name="spark-ai-output" options={{ headerShown: false }} />
            <Stack.Screen name="spark-generate-img" options={{ headerShown: false }} />
          </Stack>
        </LanguageProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
