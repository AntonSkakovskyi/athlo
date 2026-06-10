import { useEffect } from 'react';
import { WorkoutStatus } from '@athlo/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { useGetProfile } from '@/hooks/api/useProfileAPI';
import { useGetWorkoutById } from '@/hooks/api';

export function useAppLayout() {
  const { token, isLoading: isAuthLoading } = useAuth();
  const { isActive, pendingRecoveryId, startWorkout, endWorkout } = useActiveWorkout();

  const { data: profile, isLoading: isProfileLoading } = useGetProfile();

  // Attempt to restore an active workout after a process kill.
  // pendingRecoveryId is set from AsyncStorage on context mount.
  const recoveryQuery = useGetWorkoutById(pendingRecoveryId ?? '');
  useEffect(() => {
    if (!pendingRecoveryId || isActive) return;
    if (!recoveryQuery.data) return;

    if (recoveryQuery.data.status === WorkoutStatus.IN_PROGRESS) {
      startWorkout(recoveryQuery.data, []);
    } else {
      // Workout is no longer active on the server — clear the stale record
      endWorkout();
    }
  }, [pendingRecoveryId, isActive, recoveryQuery.data, startWorkout, endWorkout]);

  const needsOnboarding =
    profile && (!profile.birthDate || !profile.height || !profile.weight);

  return {
    token,
    isLoading: isAuthLoading || (!!token && isProfileLoading),
    isActive,
    needsOnboarding,
  };
}
