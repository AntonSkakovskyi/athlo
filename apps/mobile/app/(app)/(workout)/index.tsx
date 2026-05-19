import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { WorkoutHistoryList } from '@/features/workout/components';
import { QuickActionCard } from '@/features/workout/components';
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useWorkoutsScreen } from '@/features/workout/hooks/useWorkoutsScreen';
import TemplateCard from '@/features/workout/components/TemplateCard/TemplateCard';

export default function WorkoutsScreen() {
  const {
    displayedWorkouts,
    templateItems,
    workoutsQuery,
    templatesQuery,
    handleEmptyWorkout,
    handleStartFromTemplate,
    handleLoadMore,
    insets,
    router,
  } = useWorkoutsScreen();

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.screenTitle}>Workouts</Text>

      <View style={styles.quickActions}>
        <QuickActionCard
          icon="⚡"
          title="Empty Workout"
          description="Start from scratch"
          onPress={handleEmptyWorkout}
        />
        <QuickActionCard
          icon="📋"
          title="From Template"
          description="Use a saved plan"
          onPress={() => router.push('/(app)/(workout)/templates')}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="My Templates"
          actionLabel="See All"
          onAction={() => router.push('/(app)/(workout)/templates')}
        />

        {templatesQuery.isLoading ? (
          <Spinner style={styles.loader} />
        ) : !templateItems.length ? (
          <EmptyState
            title="No templates yet"
            description="Create your first workout template"
            actionLabel="Browse Templates"
            onAction={() => router.push('/(app)/(workout)/templates')}
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templateList}
          >
            {templateItems.map((item) => (
              <View key={item.id} style={styles.templateCardWrapper}>
                <TemplateCard
                  name={item.name}
                  description={item.description}
                  variant="my"
                  onPress={() => router.push(`/(app)/(workout)/template/${item.id}`)}
                  onStart={() => handleStartFromTemplate(item.id)}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <SectionHeader title="Recent Workouts" />
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
        router.push({
          pathname: '/(app)/(workout)/workout-summary',
          params: { workoutId: String(id) },
        })
      }
      emptyTitle="No workouts yet"
      emptyDescription="Start your first workout to see your history"
      emptyActionLabel="Start Workout"
      onEmptyAction={handleEmptyWorkout}
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
  screenTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing['3xl'],
  },
  section: {
    marginBottom: spacing['3xl'],
  },
  templateList: {
    paddingRight: 16,
    gap: spacing.md,
  },
  templateCardWrapper: {
    width: 260,
    height: 160,
  },
  loader: {
    marginVertical: 20,
  },
});
