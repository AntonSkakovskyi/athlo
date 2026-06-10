import { View, Text, StyleSheet } from 'react-native';
import { spacing, fontSize } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Button } from '@/components/ui/Button/Button';
import { WorkoutHeaderBar } from './active-workout/components/WorkoutHeaderBar/WorkoutHeaderBar';
import { ExerciseListSection } from './active-workout/components/ExerciseListSection/ExerciseListSection';
import { StatsBar, RestTimerOverlay } from '@/features/workout/components';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { BottomSheet, Toast } from '@/components/ui';
import { formatSetValue } from '@/utils/workout';
import { useActiveWorkoutScreen } from '@/features/workout/hooks/useActiveWorkoutScreen';
import { useMemo, useState } from 'react';
import type { IAchievement } from '@athlo/shared';

type PrDisplay = Pick<IAchievement, 'name' | 'description'>;

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
    reorderSets,
    editName,
    setEditName,
    showRestTimer,
    setShowRestTimer,
    restTimerSeconds,
    newAchievement,
    setNewAchievement,
    errorToast,
    setErrorToast,
    isLoadingExercises,
    handleFinish,
    handleRestTimer,
    handleCancel,
    handleAddExercise,
    handleSaveName,
    insets,
    router,
  } = useActiveWorkoutScreen();

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [prAchievement, setPrAchievement] = useState<PrDisplay | null>(null);
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
      const recordDetails = formatSetValue(ex.trackingType, set);

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
          startedAt={workout.started_at}
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
        onMoveSet={reorderSets}
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
            style={styles.awesomeBtn}
          />
        </View>
      </BottomSheet>

      <Toast
        visible={!!newAchievement}
        title={newAchievement?.title || ''}
        description={newAchievement?.description}
        variant="achievement"
        onClose={() => setNewAchievement(null)}
      />

      <Toast
        visible={!!errorToast}
        title={errorToast?.title || ''}
        description={errorToast?.description}
        variant="error"
        onClose={() => setErrorToast(null)}
      />
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.background,
    },
    statsWrap: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    footer: {
      flexDirection: 'row',
      padding: spacing.lg,
      gap: spacing.md,
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    footerBtn: {
      flex: 1,
    },
    prContent: {
      paddingBottom: spacing['2xl'],
      alignItems: 'center',
    },
    trophyBigIcon: {
      fontSize: 64,
      marginBottom: spacing.lg,
    },
    prDescription: {
      fontSize: fontSize.md,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: spacing.xl,
    },
    awesomeBtn: {
      marginTop: spacing['2xl'],
    },
  });
}
