import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="statistics" />
      <Stack.Screen name="exercise-progress" />
      <Stack.Screen name="exercise-detail" />
      <Stack.Screen name="achievements" />
    </Stack>
  );
}
