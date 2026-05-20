import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { WorkoutHeaderBar } from './active-workout/components/WorkoutHeaderBar/WorkoutHeaderBar';
import { ExerciseListSection } from './active-workout/components/ExerciseListSection/ExerciseListSection';
import { StatsBar, RestTimerOverlay } from '@/features/workout/components';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { BottomSheet, AchievementToast } from '@/components/ui';
import { formatHMS, formatSeconds } from '@/utils/time';
import { useActiveWorkoutScreen } from '@/features/workout/hooks/useActiveWorkoutScreen';
import { useState } from 'react';

export default function ActiveWorkoutScreen() {
  const {
    workout,
    exercises,
    isActive,
    totalVolume,
    completedSets,
    totalSets,
    updateExercise,
    addSet,
    updateSet,
    deleteSet,
    toggleSetComplete,
    deleteExercise,
    moveExercise,
    elapsed,
    editName,
    setEditName,
    showRestTimer,
    setShowRestTimer,
    restTimerSeconds,
    newAchievement,
    setNewAchievement,
    isLoadingExercises,
    handleFinish,
    handleRestTimer,
    handleCancel,
    handleAddExercise,
    handleSaveName,
    insets,
    router,
  } = useActiveWorkoutScreen();

  const [prAchievement, setPrAchievement] = useState<any>(null);
  const [prVisible, setPrVisible] = useState(false);

  if (!isActive || !workout) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <EmptyState
          title="No active workout"
          description="Start a workout from the Workouts tab"
          actionLabel="Go to Workouts"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const handleOpenPR = (exIdx: number, setIdx: number) => {
    const ex = exercises[exIdx];
    const set = ex.sets[setIdx];
    if (set.achievement) {
      setPrAchievement(set.achievement);
    } else {
      let recordDetails = '';
      if (ex.trackingType === 'WEIGHT_AND_REPS') {
        if (set.weight != null && set.reps != null) {
          recordDetails = `${set.weight}kg × ${set.reps} reps`;
        } else if (set.weight != null) {
          recordDetails = `${set.weight}kg`;
        } else if (set.reps != null) {
          recordDetails = `${set.reps} reps`;
        }
      } else if (ex.trackingType === 'REPS_ONLY') {
        if (set.reps != null) recordDetails = `${set.reps} reps`;
      } else if (ex.trackingType === 'TIME_BASED') {
        const dur = set.duration ? formatSeconds(set.duration) : '';
        const dist = set.distance ? `${set.distance}m` : '';
        recordDetails = [dur, dist].filter(Boolean).join(' ');
      }

      setPrAchievement({
        name: 'Personal Record!',
        description: recordDetails
          ? `You've set a new personal record of ${recordDetails} for ${ex.exerciseName}!`
          : `You've set a new personal record for ${ex.exerciseName}!`,
      });
    }
    setPrVisible(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <WorkoutHeaderBar
        workoutName={workout.name}
        editName={editName}
        onBack={() => router.back()}
        onEditNameStart={() => setEditName(workout.name)}
        onEditNameChange={setEditName}
        onEditNameSave={handleSaveName}
        onFinish={handleFinish}
      />

      <View style={styles.statsWrap}>
        <StatsBar
          duration={formatHMS(elapsed)}
          volume={totalVolume}
          completedSets={completedSets}
          totalSets={totalSets}
        />
      </View>

      <ExerciseListSection
        exercises={exercises}
        isLoadingExercises={isLoadingExercises}
        workoutId={String(workout.id)}
        onAddExercise={handleAddExercise}
        onUpdateExercise={updateExercise}
        onUpdateSet={updateSet}
        onDeleteSet={deleteSet}
        onToggleSetComplete={toggleSetComplete}
        onAddSet={addSet}
        onRestTimer={handleRestTimer}
        onDeleteExercise={deleteExercise}
        onMoveExercise={moveExercise}
        onPRPress={handleOpenPR}
      />

      <View style={styles.footer}>
        <Button
          title="+ Add Exercise"
          variant="secondary"
          onPress={handleAddExercise}
          style={styles.footerBtn}
        />
        <Button
          title="Cancel Workout"
          variant="danger"
          onPress={handleCancel}
          style={styles.footerBtn}
        />
      </View>

      <RestTimerOverlay
        visible={showRestTimer}
        initialSeconds={restTimerSeconds}
        onClose={() => setShowRestTimer(false)}
      />

      <BottomSheet
        visible={prVisible}
        onClose={() => setPrVisible(false)}
        title={prAchievement?.name}
        scrollable={false}
      >
        <View style={styles.prContent}>
          <Text style={styles.trophyBigIcon}>🏆</Text>
          <Text style={styles.prDescription}>{prAchievement?.description}</Text>
          <Button 
            title="Awesome!" 
            onPress={() => setPrVisible(false)}
            style={{ marginTop: 24 }}
          />
        </View>
      </BottomSheet>

      <AchievementToast
        visible={!!newAchievement}
        title={newAchievement?.title || ''}
        description={newAchievement?.description}
        onClose={() => setNewAchievement(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  statsWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerBtn: {
    flex: 1,
  },
  prContent: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  trophyBigIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  prDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
