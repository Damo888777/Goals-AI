import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useState, useEffect } from 'react';
import { SplashScreen } from '../src/components/SplashScreen';
import '../global.css';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" hidden={true} />
        <SplashScreen onAnimationFinish={handleSplashFinish} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="vision-board" options={{ headerShown: false }} />
          <Stack.Screen name="spark-ai" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
