import { useMemo, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGetUserProfile } from '@/hooks/api/useUserAPI';
import { useInfiniteUserWorkouts } from '@/hooks/api/useWorkoutAPI';
import { useGetUserTemplates } from '@/hooks/api/useTemplateAPI';
import { useGetUserMealPlans } from '@/hooks/api/useMealPlanAPI';
import { useGetFriends } from '@/hooks/api/useFriendAPI';

export function useUserProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const { data: profile, isLoading: profileLoading } = useGetUserProfile(userId!);
  const { data: friends } = useGetFriends();
  
  const workoutsQuery = useInfiniteUserWorkouts(userId!);
  const { data: templates, isLoading: templatesLoading } = useGetUserTemplates(userId!);
  const { data: mealPlans, isLoading: mealPlansLoading } = useGetUserMealPlans(userId!);

  const isFriend = useMemo(() => {
    return friends?.some(f => f.id === Number(userId));
  }, [friends, userId]);

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
    userId,
    profile,
    profileLoading,
    isFriend,
    workoutsQuery,
    displayedWorkouts,
    handleLoadMore,
    templates,
    templatesLoading,
    mealPlans,
    mealPlansLoading,
  };
}
