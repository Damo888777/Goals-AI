import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { SplashScreen } from '../src/components/SplashScreen';
import '../global.css';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  // Fade in the main app when splash finishes
  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300, // 300ms smooth fade in
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, fadeAnim]);

  if (isLoading) {
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
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="vision-board" options={{ headerShown: false }} />
            <Stack.Screen name="spark-ai" options={{ headerShown: false }} />
          </Stack>
        </Animated.View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
