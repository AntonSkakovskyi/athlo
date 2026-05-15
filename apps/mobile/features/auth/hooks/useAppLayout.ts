import { useAuth } from '@/contexts/AuthContext';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';

export function useAppLayout() {
  const { token, isLoading } = useAuth();
  const { isActive } = useActiveWorkout();

  return {
    token,
    isLoading,
    isActive,
  };
}
