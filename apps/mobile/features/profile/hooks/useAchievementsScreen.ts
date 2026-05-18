import { useMemo, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { IAchievement, IUserAchievement } from '@athlo/shared';
import { AchievementType } from '@athlo/shared';
import { useGetAchievements, useGetUserAchievements, useGetExerciseRecords } from '@/features/profile/hooks';
import { useGetExercises } from '@/hooks/api/useExerciseAPI';
import { useStatisticsSummary } from '@/hooks/api/useStatisticsAPI';

export function useAchievementsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: achievements, isLoading: achievementsLoading } = useGetAchievements();
  const { data: userAchievements, isLoading: userLoading } = useGetUserAchievements();
  const { data: exercises } = useGetExercises();
  const { data: exerciseRecords } = useGetExerciseRecords();
  const { data: statisticsSummary } = useStatisticsSummary();

  const [tabIndex, setTabIndex] = useState(0);
  const [selectedAchievement, setSelectedAchievement] = useState<IAchievement | null>(null);

  const exerciseMap = useMemo(() => {
    const map = new Map<number, string>();
    (exercises ?? []).forEach((e) => map.set(e.id, e.name));
    return map;
  }, [exercises]);

  const unlockedMap = useMemo(() => {
    const map = new Map<number, IUserAchievement>();
    (userAchievements ?? []).forEach((ua) => map.set(ua.achievementId, ua));
    return map;
  }, [userAchievements]);

  const unlockedAchievements = useMemo(() => {
    if (!achievements) return [];
    return achievements
      .filter((a) => unlockedMap.has(a.id))
      .sort((a, b) => {
        const dateA = unlockedMap.get(a.id)?.unlockedAt;
        const dateB = unlockedMap.get(b.id)?.unlockedAt;
        if (!dateA || !dateB) return 0;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }, [achievements, unlockedMap]);

  const lockedAchievements = useMemo(() => {
    if (!achievements) return [];
    return achievements.filter((a) => !unlockedMap.has(a.id)).sort((a, b) => a.order - b.order);
  }, [achievements, unlockedMap]);

  const totalCount = achievements?.length ?? 0;
  const unlockedCount = unlockedAchievements.length;
  const isLoading = achievementsLoading || userLoading;

  const displayedAchievements = tabIndex === 0 ? unlockedAchievements : lockedAchievements;

  const getProgressForAchievement = useCallback((achievement: IAchievement): number => {
    if (achievement.type === AchievementType.EXERCISE_PERSONAL_RECORD && achievement.exerciseId) {
      if (!exerciseRecords) return 0;
      
      const records = exerciseRecords.filter(
        (r) => r.exerciseId === achievement.exerciseId && r.metricType === achievement.trackingMetric
      );
      
      if (records.length === 0) return 0;
      
      return Math.max(...records.map(r => r.value));
    }

    if (!statisticsSummary) return 0;
    switch (achievement.type) {
      case AchievementType.GLOBAL_WORKOUTS:
        return statisticsSummary.totalWorkouts;
      case AchievementType.GLOBAL_SETS:
        return statisticsSummary.totalSets;
      case AchievementType.GLOBAL_WEIGHT:
        return statisticsSummary.totalWeightLifted;
      case AchievementType.GLOBAL_TIME:
        return statisticsSummary.totalDurationSeconds || 0; // if it's there
      default:
        return 0;
    }
  }, [exerciseRecords, statisticsSummary]);

  const handleCloseSheet = useCallback(() => {
    setSelectedAchievement(null);
  }, []);

  const selectedIsUnlocked = selectedAchievement ? unlockedMap.has(selectedAchievement.id) : false;
  const selectedUserAchievement = selectedAchievement ? unlockedMap.get(selectedAchievement.id) : undefined;
  const selectedProgress = selectedAchievement ? getProgressForAchievement(selectedAchievement) : 0;
  const selectedProgressPercent =
    selectedAchievement && selectedAchievement.threshold > 0
      ? Math.min((selectedProgress / selectedAchievement.threshold) * 100, 100)
      : 0;

  return {
    insets,
    router,
    achievements,
    achievementsLoading,
    userAchievements,
    userLoading,
    exercises,
    exerciseRecords,
    tabIndex,
    setTabIndex,
    selectedAchievement,
    setSelectedAchievement,
    exerciseMap,
    unlockedMap,
    unlockedAchievements,
    lockedAchievements,
    displayedAchievements,
    totalCount,
    unlockedCount,
    isLoading,
    getProgressForAchievement,
    handleCloseSheet,
    selectedIsUnlocked,
    selectedUserAchievement,
    selectedProgress,
    selectedProgressPercent,
  };
}
