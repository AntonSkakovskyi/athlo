import { Stack } from 'expo-router';

export default function NutritionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="food-picker" options={{ presentation: 'modal' }} />
      <Stack.Screen name="meal-plans" />
      <Stack.Screen name="meal-plan/[id]" />
      <Stack.Screen name="nutrition-history" />
    </Stack>
  );
}
