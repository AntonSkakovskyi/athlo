import { useMemo, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from '@/hooks/useRouter';
import { WorkoutStatus } from '@athlo/shared';
import { useGetProfile, useStatisticsSummary, useGetFriends } from '@/features/profile/hooks';
import { useInfiniteWorkouts } from '@/hooks/api';

export function useProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: summary, isLoading: summaryLoading } = useStatisticsSummary();
  const { data: friends, isLoading: friendsLoading } = useGetFriends();
  const workoutsQuery = useInfiniteWorkouts(WorkoutStatus.COMPLETED);

  const displayedWorkouts = useMemo(
    () => (workoutsQuery.data?.pages ?? []).flatMap((p) => p.data),
    [workoutsQuery.data],
  );

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
    summaryLoading,
    friends,
    friendsLoading,
    workoutsQuery,
    displayedWorkouts,
    handleLoadMore,
  };
}
