import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { ActiveWorkoutProvider } from '../contexts/ActiveWorkoutContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SplashScreen as ThemedSplashScreen } from '../components/ui';
import * as SplashScreen from 'expo-splash-screen';
import { Animated, View, StyleSheet } from 'react-native';
import { useRef, useCallback, useEffect, useState } from 'react';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Simulate app loading and setup
    setTimeout(() => {
      setAppReady(true);
    }, 500);
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => {
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
            setSplashAnimationComplete(true);
          });
        }, 1500);
      });
      await SplashScreen.hideAsync();
    }
  }, [appReady, scale, opacity]);

  if (!appReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ActiveWorkoutProvider>
              <Slot />
            </ActiveWorkoutProvider>
          </AuthProvider>

          {!splashAnimationComplete && (
            <ThemedSplashScreen opacity={opacity} scale={scale} />
          )}
        </ThemeProvider>
      </QueryClientProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
