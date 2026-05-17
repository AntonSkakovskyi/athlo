import { View, Text, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { StatsBar, ExerciseLogCard, RestTimerOverlay } from '@/features/workout/components';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { formatElapsed } from '@/utils/workout';
import { useActiveWorkoutScreen } from '@/features/workout/hooks/useActiveWorkoutScreen';

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
    isLoadingExercises,
    handleFinish,
    handleRestTimer,
    handleCancel,
    handleAddExercise,
    handleSaveName,
    insets,
    router,
  } = useActiveWorkoutScreen();

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

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
        {editName !== null ? (
          <TextInput
            style={styles.nameInput}
            value={editName}
            onChangeText={setEditName}
            onBlur={handleSaveName}
            onSubmitEditing={handleSaveName}
            autoFocus
            selectionColor={colors.primary}
          />
        ) : (
          <Pressable onPress={() => setEditName(workout.name)} style={styles.nameWrap}>
            <Text style={styles.workoutName} numberOfLines={1}>
              {workout.name}
            </Text>
          </Pressable>
        )}
        <Pressable style={styles.finishBtn} onPress={handleFinish}>
          <Text style={styles.finishText}>✅ Finish</Text>
        </Pressable>
      </View>

      <View style={styles.statsWrap}>
        <StatsBar
          duration={formatElapsed(elapsed)}
          volume={totalVolume}
          completedSets={completedSets}
          totalSets={totalSets}
        />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingExercises ? (
          <Spinner style={{ marginTop: spacing['5xl'] }} />
        ) : exercises.length === 0 ? (
          <EmptyState
            title="No exercises yet"
            description="Add an exercise to begin"
            actionLabel="+ Add Exercise"
            onAction={handleAddExercise}
          />
        ) : (
          exercises.map((ex, exIdx) => (
            <ExerciseLogCard
              key={ex.logExerciseId ?? `local-${exIdx}`}
              exerciseName={ex.exerciseName}
              trackingType={ex.trackingType}
              mode="active"
              sets={ex.sets}
              notes={ex.notes}
              showNotes={ex.showNotes}
              restTime={ex.restTime}
              onToggleNotes={() => updateExercise(exIdx, { showNotes: !ex.showNotes })}
              onNotesChange={(text) => updateExercise(exIdx, { notes: text })}
              onUpdateSet={(setIdx, data) => updateSet(exIdx, setIdx, data)}
              onDeleteSet={(setIdx) => deleteSet(exIdx, setIdx)}
              onToggleSetComplete={(setIdx) => toggleSetComplete(exIdx, setIdx)}
              onAddSet={() => addSet(exIdx)}
              onRestTimer={ex.restTime > 0 ? () => handleRestTimer(ex.restTime) : undefined}
              onDeleteExercise={() => deleteExercise(exIdx)}
              onMoveUp={exIdx > 0 ? () => moveExercise(exIdx, 'up') : undefined}
              onMoveDown={exIdx < exercises.length - 1 ? () => moveExercise(exIdx, 'down') : undefined}
              onChangeExercise={() => {
                router.push({
                  pathname: '/(app)/(workout)/exercise-picker',
                  params: { 
                    workoutId: String(workout.id), 
                    replaceLogExerciseId: String(ex.logExerciseId),
                    replaceOrder: String(exIdx + 1)
                  }
                });
              }}
            />
          ))
        )}
      </ScrollView>

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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  nameWrap: {
    flex: 1,
  },
  workoutName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  nameInput: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.xs,
  },
  finishBtn: {
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  finishText: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
  },
  statsWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
});
