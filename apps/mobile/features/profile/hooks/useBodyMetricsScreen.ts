import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export function useBodyMetricsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return {
    insets,
    router,
  };
}
