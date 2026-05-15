import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Dimensions } from 'react-native';
import type { IAchievement } from '@athlo/shared';
import { colors, borderRadius, spacing, fontSize, fontWeight, shadows } from '@/constants/theme';
import { SegmentControl } from '@/components/ui/SegmentControl/SegmentControl';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { ProgressBar } from '@/components/ui/ProgressBar/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Tag } from '@/components/ui/Tag/Tag';
import { useAchievementsScreen } from '@/features/profile/hooks/useAchievementsScreen';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.45;

export default function AchievementsScreen() {
  const {
    insets,
    router,
    tabIndex,
    setTabIndex,
    selectedAchievement,
    setSelectedAchievement,
    exerciseMap,
    unlockedMap,
    displayedAchievements,
    totalCount,
    unlockedCount,
    isLoading,
    handleCloseSheet,
    selectedIsUnlocked,
    selectedUserAchievement,
    selectedProgress,
    selectedProgressPercent,
  } = useAchievementsScreen();

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
          rightAction={<Text style={styles.counter}>{unlockedCount} / {totalCount}</Text>}
        />

        <View style={styles.tabSection}>
          <SegmentControl
            segments={[`Unlocked (${unlockedCount})`, `Locked (${totalCount - unlockedCount})`]}
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

      <Modal
        visible={!!selectedAchievement}
        transparent
        animationType="slide"
        onRequestClose={handleCloseSheet}
      >
        <Pressable style={styles.sheetOverlay} onPress={handleCloseSheet}>
          <Pressable style={styles.sheetContent} onPress={() => {}}>
            <Pressable style={styles.collapseBtn} onPress={handleCloseSheet}>
              <Text style={styles.collapseBtnText}>↓</Text>
            </Pressable>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
              {selectedAchievement && (
                <>
                  <Text style={styles.sheetName}>{selectedAchievement.name}</Text>
                  <Text style={styles.sheetDesc}>{selectedAchievement.description}</Text>
                  {selectedAchievement.exerciseId && exerciseMap.has(selectedAchievement.exerciseId) && (
                    <View style={styles.exerciseBadgeWrap}>
                      <Tag label={exerciseMap.get(selectedAchievement.exerciseId) ?? ''} />
                    </View>
                  )}
                  {selectedIsUnlocked && selectedUserAchievement ? (
                    <View style={styles.sheetUnlockedInfo}>
                      {selectedUserAchievement.value != null && (
                        <Text style={styles.sheetValue}>Value: {selectedUserAchievement.value}</Text>
                      )}
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
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: spacing.lg },
  counter: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
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
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  achievementCircleUnlocked: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  achievementEmoji: { fontSize: fontSize['2xl'] },
  achievementTitle: { fontSize: fontSize.xs, color: colors.text, textAlign: 'center', marginTop: spacing.xs, lineHeight: 14 },
  achievementTitleLocked: { color: colors.textMuted },
  sheetOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheetContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['4xl'],
    maxHeight: SHEET_HEIGHT,
    minHeight: 200,
  },
  collapseBtn: {
    position: 'absolute',
    top: -20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 10,
    ...shadows.button,
  },
  collapseBtnText: { fontSize: fontSize.xl, color: colors.black, fontWeight: fontWeight.semibold },
  sheetScroll: { flexGrow: 0 },
  sheetName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.sm },
  sheetDesc: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.md },
  exerciseBadgeWrap: { alignSelf: 'flex-start', marginBottom: spacing.md },
  sheetUnlockedInfo: { gap: spacing.sm, marginTop: spacing.xs },
  sheetValue: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
  sheetDate: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.medium },
  sheetProgressSection: { marginTop: spacing.xs },
  sheetProgressText: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
});
