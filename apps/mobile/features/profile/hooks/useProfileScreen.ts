import { useMemo, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WorkoutStatus } from '@athlo/shared';
import { useGetProfile, useStatisticsSummary, useGetFriends } from '@/features/profile/hooks';
import { useInfiniteWorkouts } from '@/hooks/api';

export function useProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: summary } = useStatisticsSummary();
  const { data: friends } = useGetFriends();
  const workoutsQuery = useInfiniteWorkouts();

  const displayedWorkouts = useMemo(() => {
    const all = (workoutsQuery.data?.pages ?? []).flatMap((p) => p.data);
    return all.filter((w) => w.status === WorkoutStatus.COMPLETED);
  }, [workoutsQuery.data]);

  const handleLoadMore = useCallback(() => {
    if (workoutsQuery.hasNextPage && !workoutsQuery.isFetchingNextPage) {
      workoutsQuery.fetchNextPage();
    }
  }, [workoutsQuery]);

  return {
    insets,
    router,
    profile,
    profileLoading,
    summary,
    friends,
    workoutsQuery,
    displayedWorkouts,
    handleLoadMore,
  };
}
