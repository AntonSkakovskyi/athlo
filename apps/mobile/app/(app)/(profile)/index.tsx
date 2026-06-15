import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { NavCard } from '@/components/ui/NavCard/NavCard';
import { LineChartBlock } from '@/components/ui/LineChartBlock/LineChartBlock';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader';
import { LoadingScreen } from '@/components/ui/LoadingScreen/LoadingScreen';
import { Spinner } from '@/components/ui/Spinner/Spinner';
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
    summaryLoading,
    friends,
    friendsLoading,
    incomingRequestsCount,
    workoutsQuery,
    displayedWorkouts,
    handleLoadMore,
  } = useProfileScreen();

  const {
    perfPeriod,
    setPerfPeriod,
    perfMetricIndex,
    setPerfMetricIndex,
    statsLoading,
    aggregatedData,
    currentPerfMetric,
    formatPerformanceValue,
    PERIOD_LABELS,
    PERFORMANCE_METRICS,
  } = usePerformanceChart();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
        <Avatar uri={profile?.avatar ?? undefined} name={profile?.fullName} size="lg" />
        <Text style={styles.nickname}>@{profile?.nickname}</Text>
        <Text style={styles.fullName}>{profile?.fullName}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            {summaryLoading ? (
              <Spinner size="small" style={styles.statSpinner} />
            ) : (
              <Text style={styles.statValue}>{summary?.totalWorkouts ?? 0}</Text>
            )}
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <Pressable style={styles.statItem} onPress={() => router.push('/(app)/(profile)/friends')}>
            <View style={styles.statValueWrap}>
              {friendsLoading ? (
                <Spinner size="small" style={styles.statSpinner} />
              ) : (
                <Text style={styles.statValue}>{friends?.length ?? 0}</Text>
              )}
              {incomingRequestsCount > 0 && <View style={styles.requestsBadge} />}
            </View>
            <Text style={styles.statLabel}>Friends</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <LineChartBlock
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
          isLoading={statsLoading}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.navGrid}>
          <View style={styles.navRow}>
            <NavCard variant="compact" icon="📅" title="Calendar" description="Training calendar" onPress={() => router.push('/(app)/(profile)/calendar')} />
            <View style={styles.navGap} />
            <NavCard variant="compact" icon="📈" title="Body Metrics" description="Track measurements" onPress={() => router.push('/(app)/(profile)/body-metrics')} />
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
        router.push({ pathname: '/(app)/(workout)/workout-summary', params: { workoutId: String(id), source: 'profile' } })
      }
      emptyTitle="No workouts yet"
      emptyDescription="Start your first workout to see history here"
      emptyActionLabel="Start your first workout"
      onEmptyAction={() => router.push('/(app)/(workout)')}
    />
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
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
      backgroundColor: c.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    headerBtnIcon: { fontSize: fontSize.xl },
    profileCard: {
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: borderRadius.xl,
      padding: spacing['2xl'],
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing['2xl'],
    },
    nickname: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: c.text, marginTop: spacing.md },
    fullName: { fontSize: fontSize.md, color: c.textSecondary, marginTop: spacing.xs },
    statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl, gap: spacing['2xl'] },
    statItem: { alignItems: 'center' },
    statValueWrap: { position: 'relative' },
    requestsBadge: {
      position: 'absolute',
      top: -2,
      right: -8,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: c.danger,
    },
    statValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: c.text },
    statLabel: { fontSize: fontSize.sm, color: c.textMuted, marginTop: spacing.xxs },
    statDivider: { width: 1, height: 32, backgroundColor: c.border },
    statSpinner: { height: 32, justifyContent: 'center' },
    section: { marginBottom: spacing.lg },
    navGrid: {},
    navRow: { flexDirection: 'row' },
    navGap: { width: spacing.md },
    navRowGap: { height: spacing.md },
    loader: { marginVertical: spacing.xl },
  });
}
