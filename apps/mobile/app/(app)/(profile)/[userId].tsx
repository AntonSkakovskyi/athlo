import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader';
import { LoadingScreen } from '@/components/ui/LoadingScreen/LoadingScreen';
import { WorkoutHistoryList } from '@/features/workout/components';
import { useUserProfileScreen } from '@/features/profile/hooks/useUserProfileScreen';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection/CollapsibleSection';
import { Card } from '@/components/ui/Card/Card';

export default function UserProfileScreen() {
  const {
    insets,
    router,
    profile,
    profileLoading,
    isFriend,
    workoutsQuery,
    displayedWorkouts,
    handleLoadMore,
    templates,
    mealPlans,
  } = useUserProfileScreen();

  if (profileLoading) {
    return <LoadingScreen />;
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
      </View>

      <View style={styles.profileCard}>
        <Avatar name={profile?.fullName} size="lg" />
        <Text style={styles.nickname}>@{profile?.nickname}</Text>
        <Text style={styles.fullName}>{profile?.fullName}</Text>
      </View>

      {isFriend && (
        <View style={styles.resourcesSection}>
          <CollapsibleSection title="Workout Templates" count={templates?.length ?? 0}>
            {templates?.map(t => (
              <Card key={t.id} style={styles.resourceCard} onPress={() => router.push({ pathname: `/(app)/(workout)/template/${t.id}`, params: { id: String(t.id) } })}>
                <Text style={styles.resourceTitle}>{t.name}</Text>
                {t.description && <Text style={styles.resourceDesc}>{t.description}</Text>}
              </Card>
            ))}
            {(!templates || templates.length === 0) && (
              <Text style={styles.emptyText}>No templates shared</Text>
            )}
          </CollapsibleSection>

          <View style={styles.gap} />

          <CollapsibleSection title="Nutrition Plans" count={mealPlans?.length ?? 0}>
            {mealPlans?.map(p => (
              <Card key={p.id} style={styles.resourceCard} onPress={() => router.push({ pathname: '/(app)/(nutrition)/meal-plan/[id]', params: { id: String(p.id) } })}>
                <Text style={styles.resourceTitle}>{p.name}</Text>
                <Text style={styles.resourceDesc}>{p.totalDays} days</Text>
              </Card>
            ))}
            {(!mealPlans || mealPlans.length === 0) && (
              <Text style={styles.emptyText}>No nutrition plans shared</Text>
            )}
          </CollapsibleSection>
        </View>
      )}

      <View style={styles.sectionHeaderContainer}>
        <SectionHeader title="Workout History" />
      </View>
    </View>
  );

  return (
    <WorkoutHistoryList
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
      ListHeaderComponent={renderHeader()}
      workouts={displayedWorkouts}
      isLoading={workoutsQuery.isLoading}
      hasNextPage={workoutsQuery.hasNextPage}
      isFetchingNextPage={workoutsQuery.isFetchingNextPage}
      onLoadMore={handleLoadMore}
      onWorkoutPress={(id) =>
        router.push({ pathname: '/(app)/(workout)/workout-summary', params: { workoutId: String(id) } })
      }
      emptyTitle="No public workouts"
      emptyDescription={isFriend ? "This friend hasn't shared any workouts yet" : "Only public workouts are visible"}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  headerContainer: {
    paddingBottom: spacing.sm,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: spacing.sm },
  backBtn: {
    paddingVertical: spacing.xs,
  },
  backBtnText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing['2xl'],
  },
  nickname: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, marginTop: spacing.md },
  fullName: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
  friendBadgeText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.bold,
  },
  resourcesSection: {
    marginBottom: spacing['2xl'],
  },
  resourceCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  resourceTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  resourceDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  gap: { height: spacing.md },
  sectionHeaderContainer: { marginBottom: spacing.md },
});
