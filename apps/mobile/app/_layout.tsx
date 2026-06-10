import { Slot } from 'expo-router';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getApiErrorMessage, showGlobalToast } from '@/utils/globalToast';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ActiveWorkoutProvider } from '../contexts/ActiveWorkoutContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { SplashScreen as ThemedSplashScreen } from '../components/ui';
import * as SplashScreen from 'expo-splash-screen';
import { Animated, View, StyleSheet } from 'react-native';
import { useRef, useCallback, useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
    },
  },
  // Збій будь-якої мутації показує тост — жодна помилка мережі не зникає мовчки.
  // Локальні onError у хуках працюють додатково до цього глобального хендлера.
  mutationCache: new MutationCache({
    onError: (error) => {
      showGlobalToast({
        title: 'Request failed',
        description: getApiErrorMessage(error),
        variant: 'error',
      });
    },
  }),
});

function RootLayoutContent() {
  const { colors, resolvedScheme } = useTheme();
  const [appReady, setAppReady] = useState(false);
  const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setAppReady(true);
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

  const navigationTheme = resolvedScheme === 'dark' ? DarkTheme : DefaultTheme;
  const themedNavigation = {
    ...navigationTheme,
    colors: {
      ...navigationTheme.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  if (!appReady) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]} />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} onLayout={onLayoutRootView}>
      <NavigationThemeProvider value={themedNavigation}>
        <AuthProvider>
          <ToastProvider>
            <ActiveWorkoutProvider>
              <Slot />
            </ActiveWorkoutProvider>
          </ToastProvider>
        </AuthProvider>
      </NavigationThemeProvider>

      {!splashAnimationComplete && (
        <ThemedSplashScreen opacity={opacity} scale={scale} />
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RootLayoutContent />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

