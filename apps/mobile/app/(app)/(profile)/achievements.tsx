import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import type { IAchievement } from '@athlo/shared';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { SegmentControl } from '@/components/ui/SegmentControl/SegmentControl';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { ProgressBar } from '@/components/ui/ProgressBar/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { BottomSheet } from '@/components/ui';
import { useAchievementsScreen } from '@/features/profile/hooks/useAchievementsScreen';
import { formatAchievementProgress } from '@/utils/achievement';

export default function AchievementsScreen() {
  const {
    insets,
    router,
    tabIndex,
    setTabIndex,
    selectedAchievement,
    setSelectedAchievement,
    unlockedMap,
    displayedAchievements,
    lockedAchievements,
    unlockedCount,
    isLoading,
    handleCloseSheet,
    selectedIsUnlocked,
    selectedUserAchievement,
    selectedProgress,
    selectedProgressPercent,
  } = useAchievementsScreen();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Achievements"
          onBack={() => router.back()}
        />

        <View style={styles.tabSection}>
          <SegmentControl
            segments={[`Unlocked (${unlockedCount})`, `Locked (${lockedAchievements.length})`]}
            activeIndex={tabIndex}
            onSelect={setTabIndex}
          />
        </View>

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
            {displayedAchievements.map((achievement: IAchievement) => {
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
                  <Text style={[styles.achievementTitle, !isUnlocked && styles.achievementTitleLocked]} numberOfLines={2}>
                    {achievement.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BottomSheet
        visible={!!selectedAchievement}
        onClose={handleCloseSheet}
        title={selectedAchievement?.name}
        maxHeight="45%"
      >
        <View style={styles.sheetBody}>
          {selectedAchievement && (
            <>
              <Text style={styles.sheetDesc}>{selectedAchievement.description}</Text>
              {selectedIsUnlocked && selectedUserAchievement ? (
                <View style={styles.sheetUnlockedInfo}>
                  <Text style={styles.sheetDate}>
                    Unlocked: {new Date(selectedUserAchievement.unlockedAt).toLocaleDateString('en-US', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </Text>
                </View>
              ) : (
                <View style={styles.sheetProgressSection}>
                  <ProgressBar progress={selectedProgressPercent} height={8} />
                  <Text style={styles.sheetProgressText}>
                    {formatAchievementProgress(
                      selectedProgress,
                      selectedAchievement.threshold,
                      selectedAchievement.type,
                      selectedAchievement.trackingMetric,
                    )}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </BottomSheet>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    container: { flex: 1, paddingHorizontal: spacing.lg },
    counter: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.primary,
      minWidth: 60,
      textAlign: 'right',
    },
    tabSection: { marginBottom: spacing.xl },
    loader: { marginVertical: 40 },
    achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    achievementGridItem: { width: '22%', alignItems: 'center', marginBottom: spacing.sm },
    achievementCircle: {
      width: 60,
      height: 60,
      borderRadius: borderRadius.full,
      backgroundColor: c.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    achievementCircleUnlocked: { backgroundColor: c.primaryLight, borderColor: c.primary },
    achievementEmoji: { fontSize: fontSize['2xl'] },
    achievementTitle: { fontSize: fontSize.xs, color: c.text, textAlign: 'center', marginTop: spacing.xs, lineHeight: 14 },
    achievementTitleLocked: { color: c.textMuted },
    sheetBody: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
    sheetDesc: { fontSize: fontSize.md, color: c.textSecondary, lineHeight: 22, marginBottom: spacing.md },
    sheetUnlockedInfo: { gap: spacing.sm, marginTop: spacing.xs },
    sheetDate: { fontSize: fontSize.md, color: c.primary, fontWeight: fontWeight.medium },
    sheetProgressSection: { marginTop: spacing.xs },
    sheetProgressText: { fontSize: fontSize.sm, color: c.textMuted, marginTop: spacing.xs },
  });
}
