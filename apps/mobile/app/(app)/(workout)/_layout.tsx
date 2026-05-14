import { Stack } from 'expo-router';

export default function WorkoutLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
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
