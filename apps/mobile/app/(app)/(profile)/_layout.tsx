import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProfileLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="friends" />
      <Stack.Screen name="[userId]" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="body-metrics" />
      <Stack.Screen name="exercise-progress" />
      <Stack.Screen name="achievements" />
    </Stack>
  );
}
