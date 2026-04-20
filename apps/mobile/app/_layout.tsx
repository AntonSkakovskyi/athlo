import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { ActiveWorkoutProvider } from '../contexts/ActiveWorkoutContext';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActiveWorkoutProvider>
          <Slot />
        </ActiveWorkoutProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
