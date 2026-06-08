import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function NutritionLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="food-picker" options={{ presentation: 'modal' }} />
      <Stack.Screen name="meal-plans" />
      <Stack.Screen name="meal-plan/[id]" />
      <Stack.Screen name="nutrition-history" />
    </Stack>
  );
}
