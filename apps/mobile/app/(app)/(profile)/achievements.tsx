import { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { IAchievement, IUserAchievement } from '@athlo/shared';
import { AchievementType } from '@athlo/shared';
import { colors, borderRadius, spacing } from '../../../constants/theme';
import { useGetAchievements, useGetUserAchievements, useGetExerciseRecords } from '../../../hooks/api/useAchievementHooks';
import { useGetExercises } from '../../../hooks/api/useExerciseQueries';
import { SegmentControl } from '@/components/ui/SegmentControl/SegmentControl';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { ProgressBar } from '@/components/ui/ProgressBar/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Spinner } from '@/components/ui/Spinner/Spinner';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.45;

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: achievements, isLoading: achievementsLoading } = useGetAchievements();
  const { data: userAchievements, isLoading: userLoading } = useGetUserAchievements();
  const { data: exercises } = useGetExercises();
  const { data: exerciseRecords } = useGetExerciseRecords();

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
    if (!exerciseRecords) return 0;
    if (achievement.type === AchievementType.EXERCISE_PERSONAL_RECORD && achievement.exerciseId) {
      const record = exerciseRecords.find((r) => r.exerciseId === achievement.exerciseId);
      if (!record) return 0;
      switch (achievement.trackingMetric) {
        case 'WEIGHT': return record.bestWeight ?? 0;
        case 'REPS': return record.bestReps ?? 0;
        case 'ESTIMATED_1RM': return record.estimated1rm ?? 0;
        case 'DURATION': return record.bestDuration ?? 0;
        case 'DISTANCE': return record.bestDistance ?? 0;
        default: return 0;
      }
    }
    return 0;
  }, [exerciseRecords]);

  const handleCloseSheet = useCallback(() => {
    setSelectedAchievement(null);
  }, []);

  const selectedIsUnlocked = selectedAchievement ? unlockedMap.has(selectedAchievement.id) : false;
  const selectedUserAchievement = selectedAchievement ? unlockedMap.get(selectedAchievement.id) : undefined;
  const selectedProgress = selectedAchievement ? getProgressForAchievement(selectedAchievement) : 0;
  const selectedProgressPercent = selectedAchievement && selectedAchievement.threshold > 0
    ? Math.min((selectedProgress / selectedAchievement.threshold) * 100, 100)
    : 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ScreenHeader
          title="Achievements"
          onBack={() => router.back()}
          rightAction={<Text style={styles.counter}>{unlockedCount} / {totalCount}</Text>}
        />

        {/* Tabs */}
        <View style={styles.tabSection}>
          <SegmentControl
            segments={[`Unlocked (${unlockedCount})`, `Locked (${totalCount - unlockedCount})`]}
            activeIndex={tabIndex}
            onSelect={setTabIndex}
          />
        </View>

        {/* Content — Grid of achievements */}
        {isLoading ? (
          <Spinner style={styles.loader} />
        ) : displayedAchievements.length === 0 ? (
          <EmptyState
            title={tabIndex === 0 ? 'No achievements unlocked yet' : 'All achievements unlocked!'}
            description={
              tabIndex === 0
                ? 'Complete workouts and hit milestones to earn achievements'
                : 'Congratulations! You have unlocked everything'
            }
          />
        ) : (
          <View style={styles.achievementGrid}>
            {displayedAchievements.map((achievement) => {
              const isUnlocked = unlockedMap.has(achievement.id);
              return (
                <Pressable
                  key={achievement.id}
                  style={styles.achievementGridItem}
                  onPress={() => setSelectedAchievement(achievement)}
                >
                  <View style={[styles.achievementCircle, isUnlocked && styles.achievementCircleUnlocked]}>
                    <Text style={styles.achievementEmoji}>{isUnlocked ? '🏆' : '🔒'}</Text>
                  </View>
                  <Text
                    style={[styles.achievementTitle, !isUnlocked && styles.achievementTitleLocked]}
                    numberOfLines={2}
                  >
                    {achievement.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Achievement Detail Bottom Sheet */}
      <Modal
        visible={!!selectedAchievement}
        transparent
        animationType="slide"
        onRequestClose={handleCloseSheet}
      >
        <Pressable style={styles.sheetOverlay} onPress={handleCloseSheet}>
          <Pressable style={styles.sheetContent} onPress={() => {}}>
            {/* Collapse button overlapping top */}
            <Pressable style={styles.collapseBtn} onPress={handleCloseSheet}>
              <Text style={styles.collapseBtnText}>↓</Text>
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
              {selectedAchievement && (
                <>
                  <Text style={styles.sheetName}>{selectedAchievement.name}</Text>

                  <Text style={styles.sheetDesc}>{selectedAchievement.description}</Text>

                  {selectedAchievement.exerciseId && exerciseMap.has(selectedAchievement.exerciseId) && (
                    <View style={styles.exerciseBadge}>
                      <Text style={styles.exerciseBadgeText}>
                        {exerciseMap.get(selectedAchievement.exerciseId)}
                      </Text>
                    </View>
                  )}

                  {selectedIsUnlocked && selectedUserAchievement ? (
                    <View style={styles.sheetUnlockedInfo}>
                      {selectedUserAchievement.value != null && (
                        <Text style={styles.sheetValue}>
                          Value: {selectedUserAchievement.value}
                        </Text>
                      )}
                      <Text style={styles.sheetDate}>
                        Unlocked: {new Date(selectedUserAchievement.unlockedAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.sheetProgressSection}>
                      <ProgressBar progress={selectedProgressPercent} height={8} />
                      <Text style={styles.sheetProgressText}>
                        {selectedProgress} / {selectedAchievement.threshold}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  counter: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    minWidth: 60,
    textAlign: 'right',
  },
  tabSection: {
    marginBottom: 20,
  },
  loader: {
    marginVertical: 40,
  },
  // Achievement Grid
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementGridItem: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  achievementCircleUnlocked: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  achievementEmoji: {
    fontSize: 26,
  },
  achievementTitle: {
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },
  achievementTitleLocked: {
    color: colors.textMuted,
  },
  // Bottom Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
    maxHeight: SHEET_HEIGHT,
    minHeight: 200,
  },
  collapseBtn: {
    position: 'absolute',
    top: -20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  collapseBtnText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  sheetDesc: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 14,
  },
  exerciseBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginBottom: 14,
  },
  exerciseBadgeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sheetUnlockedInfo: {
    gap: 8,
    marginTop: 4,
  },
  sheetValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sheetDate: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  sheetProgressSection: {
    marginTop: 4,
  },
  sheetProgressText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
  },
});
