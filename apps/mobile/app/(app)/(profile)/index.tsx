import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WorkoutStatus } from '@athlo/shared';
import { colors, borderRadius, spacing } from '../../../constants/theme';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useGetProfile } from '../../../hooks/api/useProfileHooks';
import { useStatisticsSummary } from '../../../hooks/api/useStatisticsHooks';
import { useGetFriends } from '../../../hooks/api/useFriendHooks';
import { useInfiniteWorkouts } from '../../../hooks/api/useWorkoutHooks';
import { NavCard } from '@/components/ui/NavCard/NavCard';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader';
import { LoadingScreen } from '@/components/ui/LoadingScreen/LoadingScreen';
import { WorkoutHistoryList } from '../../../components/workout/WorkoutHistoryList';
import type { WorkoutWithRelations } from '../../../components/workout/WorkoutHistoryList';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: summary } = useStatisticsSummary();
  const { data: friends } = useGetFriends();
  const workoutsQuery = useInfiniteWorkouts();

  const displayedWorkouts = useMemo(() => {
    const all = (workoutsQuery.data?.pages ?? []).flatMap((p) => p.data);
    return all.filter((w) => w.status === WorkoutStatus.COMPLETED) as WorkoutWithRelations[];
  }, [workoutsQuery.data]);

  const handleLoadMore = useCallback(() => {
    if (workoutsQuery.hasNextPage && !workoutsQuery.isFetchingNextPage) {
      workoutsQuery.fetchNextPage();
    }
  }, [workoutsQuery]);

  if (profileLoading) {
    return <LoadingScreen />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 200) {
          handleLoadMore();
        }
      }}
      scrollEventThrottle={400}
    >
      {/* Header Actions */}
      <View style={styles.headerRow}>
        <Pressable style={styles.headerBtn} onPress={() => router.push('/(app)/(profile)/edit-profile')}>
          <Text style={styles.headerBtnIcon}>✏️</Text>
        </Pressable>
        <Pressable style={styles.headerBtn} onPress={() => router.push('/(app)/(profile)/settings')}>
          <Text style={styles.headerBtnIcon}>⚙️</Text>
        </Pressable>
      </View>

      {/* Profile Card */}
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
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{friends?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
        </View>
      </View>

      {/* Navigation Grid 2×2 */}
      <View style={styles.section}>
        <View style={styles.navGrid}>
          <View style={styles.navRow}>
            <NavCard variant="compact" icon="📅" title="Calendar" description="Training calendar" onPress={() => router.push('/(app)/(profile)/calendar')} />
            <View style={styles.navGap} />
            <NavCard variant="compact" icon="📊" title="Statistics" description="Workout stats" onPress={() => router.push('/(app)/(profile)/statistics')} />
          </View>
          <View style={styles.navRowGap} />
          <View style={styles.navRow}>
            <NavCard variant="compact" icon="💪" title="Exercise Progress" description="Per-exercise analytics" onPress={() => router.push('/(app)/(profile)/exercise-progress')} />
            <View style={styles.navGap} />
            <NavCard variant="compact" icon="🏆" title="Achievements" description="Your achievements" onPress={() => router.push('/(app)/(profile)/achievements')} />
          </View>
        </View>
      </View>

      {/* Workout History */}
      <View style={styles.section}>
        <SectionHeader title="Workout History" />
        <WorkoutHistoryList
          workouts={displayedWorkouts}
          isLoading={workoutsQuery.isLoading}
          onWorkoutPress={(id) =>
            router.push({ pathname: '/(app)/(workout)/workout-summary', params: { workoutId: String(id) } })
          }
          emptyTitle="No workouts yet"
          emptyDescription="Start your first workout to see history here"
          emptyActionLabel="Start your first workout"
          onEmptyAction={() => router.push('/(app)/(workout)')}
        />
        {workoutsQuery.isFetchingNextPage && (
          <Spinner style={styles.loader} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginBottom: 8,
  },
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
  headerBtnIcon: {
    fontSize: 18,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  nickname: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  fullName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  section: {
    marginBottom: 24,
  },
  navGrid: {},
  navRow: {
    flexDirection: 'row',
  },
  navGap: {
    width: 12,
  },
  navRowGap: {
    height: 12,
  },
  loader: {
    marginVertical: 20,
  },
});
