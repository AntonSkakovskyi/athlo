import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { NavCard } from '@/components/ui/NavCard/NavCard';
import { BarChartBlock } from '@/components/ui/BarChartBlock/BarChartBlock';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader';
import { LoadingScreen } from '@/components/ui/LoadingScreen/LoadingScreen';
import { WorkoutHistoryList } from '@/features/workout/components';
import { useProfileScreen } from '@/features/profile/hooks/useProfileScreen';
import { usePerformanceChart } from '@/features/profile/hooks/usePerformanceChart';

export default function ProfileScreen() {
  const {
    insets,
    router,
    profile,
    profileLoading,
    summary,
    friends,
    workoutsQuery,
    displayedWorkouts,
    handleLoadMore,
  } = useProfileScreen();

  const {
    perfPeriod,
    setPerfPeriod,
    perfMetricIndex,
    setPerfMetricIndex,
    aggregatedData,
    currentPerfMetric,
    formatPerformanceValue,
    PERIOD_LABELS,
    PERFORMANCE_METRICS,
  } = usePerformanceChart();

  if (profileLoading) {
    return <LoadingScreen />;
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <Pressable style={styles.headerBtn} onPress={() => router.push('/(app)/(profile)/edit-profile')}>
          <Text style={styles.headerBtnIcon}>✏️</Text>
        </Pressable>
        <Pressable style={styles.headerBtn} onPress={() => router.push('/(app)/(profile)/settings')}>
          <Text style={styles.headerBtnIcon}>⚙️</Text>
        </Pressable>
      </View>

      <View style={styles.profileCard}>
        <Avatar name={profile?.fullName} size="lg" />
        <Text style={styles.nickname}>@{profile?.nickname}</Text>
        <Text style={styles.fullName}>{profile?.fullName}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{summary?.totalWorkouts ?? 0}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <Pressable style={styles.statItem} onPress={() => router.push('/(app)/(profile)/friends')}>
            <Text style={styles.statValue}>{friends?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <BarChartBlock
          metricLabel={currentPerfMetric}
          data={aggregatedData}
          period={perfPeriod}
          onPeriodChange={setPerfPeriod}
          periods={PERIOD_LABELS}
          formatValue={formatPerformanceValue}
          emptyText="No workouts in this period"
          metrics={PERFORMANCE_METRICS}
          activeMetric={perfMetricIndex}
          onMetricChange={setPerfMetricIndex}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.navGrid}>
          <View style={styles.navRow}>
            <NavCard variant="compact" icon="📅" title="Calendar" description="Training calendar" onPress={() => router.push('/(app)/(profile)/calendar')} />
            <View style={styles.navGap} />
            <NavCard variant="compact" icon="📈" title="Metrics" description="Workout stats" onPress={() => router.push('/(app)/(profile)/statistics')} />
          </View>
          <View style={styles.navRowGap} />
          <View style={styles.navRow}>
            <NavCard variant="compact" icon="💪" title="Exercise Progress" description="Per-exercise analytics" onPress={() => router.push('/(app)/(profile)/exercise-progress')} />
            <View style={styles.navGap} />
            <NavCard variant="compact" icon="🏆" title="Achievements" description="Your achievements" onPress={() => router.push('/(app)/(profile)/achievements')} />
          </View>
        </View>
      </View>

      <SectionHeader title="Workout History" />
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
      emptyTitle="No workouts yet"
      emptyDescription="Start your first workout to see history here"
      emptyActionLabel="Start your first workout"
      onEmptyAction={() => router.push('/(app)/(workout)')}
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
  headerRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginBottom: spacing.sm },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerBtnIcon: { fontSize: fontSize.xl },
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
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl, gap: spacing['2xl'] },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.text },
  statLabel: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xxs },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  section: { marginBottom: spacing['2xl'] },
  navGrid: {},
  navRow: { flexDirection: 'row' },
  navGap: { width: spacing.md },
  navRowGap: { height: spacing.md },
  loader: { marginVertical: spacing.xl },
});
