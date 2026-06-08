import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function WorkoutLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="templates" />
      <Stack.Screen name="template/[id]" />
      <Stack.Screen name="active-workout" />
      <Stack.Screen name="finish-workout" />
      <Stack.Screen name="exercise-picker" />
      <Stack.Screen name="workout-summary" />
    </Stack>
  );
}
