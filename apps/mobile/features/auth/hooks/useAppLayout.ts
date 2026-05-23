import { useAuth } from '@/contexts/AuthContext';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { useGetProfile } from '@/hooks/api/useProfileAPI';

export function useAppLayout() {
  const { token, isLoading: isAuthLoading } = useAuth();
  const { isActive } = useActiveWorkout();
  
  const { data: profile, isLoading: isProfileLoading } = useGetProfile();

  const needsOnboarding = 
    profile && (profile.waterGoal === null || profile.proteinGoal === null);

  return {
    token,
    isLoading: isAuthLoading || (!!token && isProfileLoading),
    isActive,
    needsOnboarding,
  };
}
