import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { IWorkoutWithRelations } from '@athlo/shared';
import { colors, borderRadius, spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { StatsBar } from '@/components/workout/StatsBar/StatsBar';
import { ActiveExerciseCard } from '@/components/workout/ActiveExerciseCard/ActiveExerciseCard';
import { RestTimerOverlay } from '@/components/workout/RestTimerOverlay/RestTimerOverlay';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useActiveWorkout } from '../../../contexts/ActiveWorkoutContext';
import {
  useGetWorkoutById,
  useUpdateWorkout,
  useDeleteWorkout,
  useGetBatchLastPerformance,
} from '../../../hooks/api/useWorkoutHooks';
import { formatElapsed, getTrackingType } from '../../../utils/workout';

export default function ActiveWorkoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    workout,
    exercises,
    isActive,
    totalVolume,
    completedSets,
    totalSets,
    addExercise,
    updateExercise,
    addSet,
    updateSet,
    toggleSetComplete,
    endWorkout,
  } = useActiveWorkout();

  const [elapsed, setElapsed] = useState(0);
  const [editName, setEditName] = useState<string | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(60);

  const updateWorkoutMutation = useUpdateWorkout();
  const deleteWorkout = useDeleteWorkout();

  const workoutQuery = useGetWorkoutById(workout?.id ? String(workout.id) : '');

  const exerciseIds = useMemo(() => {
    const data = workoutQuery.data as IWorkoutWithRelations | undefined;
    return data?.logExercises?.map((ex) => ex.exerciseId).filter((id): id is number => !!id) ?? [];
  }, [workoutQuery.data]);

  const lastPerfQuery = useGetBatchLastPerformance(exerciseIds);

  const isLoadingExercises =
    workoutQuery.isLoading ||
    (!!workoutQuery.data &&
      exercises.length === 0 &&
      (workoutQuery.data as IWorkoutWithRelations).logExercises?.length > 0 &&
      !lastPerfQuery.isSuccess &&
      !lastPerfQuery.isError);

  useEffect(() => {
    if (!isActive || !workout) return;
    const start = new Date(workout.started_at).getTime();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, workout]);

  useEffect(() => {
    if (!workoutQuery.data || exercises.length > 0) return;
    if (exerciseIds.length > 0 && !lastPerfQuery.isSuccess && !lastPerfQuery.isError) return;
    const workoutData = workoutQuery.data as IWorkoutWithRelations;
    if (workoutData.logExercises?.length) {
      for (const ex of workoutData.logExercises.sort((a, b) => a.order - b.order)) {
        const trackingType = getTrackingType(ex.exercise?.trackingTypeId);
        const prevSets = lastPerfQuery.data?.[ex.exerciseId]?.sets ?? [];
        addExercise({
          logExerciseId: ex.id,
          exerciseId: ex.exerciseId,
          exerciseName: ex.exercise?.name ?? `Exercise #${ex.order}`,
          trackingType,
          restTime: ex.restTime ?? 0,
          notes: ex.notes ?? '',
          sets:
            ex.sets?.sort((a, b) => a.order - b.order).map((s, idx) => ({
              id: s.id,
              order: s.order,
              weight: s.weight,
              reps: s.reps,
              duration: s.duration,
              distance: s.distance,
              isCompleted: s.isCompleted,
              previousWeight: prevSets[idx]?.weight,
              previousReps: prevSets[idx]?.reps,
              previousDuration: prevSets[idx]?.duration,
              previousDistance: prevSets[idx]?.distance,
            })) ?? [{ order: 1, isCompleted: false }],
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutQuery.data, lastPerfQuery.data, lastPerfQuery.isSuccess, lastPerfQuery.isError, exerciseIds]);

  const handleFinish = useCallback(() => {
    if (!workout) return;
    if (completedSets === 0) {
      Alert.alert('No Sets Completed', 'Your workout has no set values.', [
        { text: 'Ok' },
      ]);
      return;
    }
    router.push({
      pathname: '/(app)/(workout)/finish-workout',
      params: {
        duration: formatElapsed(elapsed),
        volume: String(totalVolume),
        completedSets: String(completedSets),
        totalSets: String(totalSets),
      },
    });
  }, [workout, completedSets, elapsed, totalVolume, totalSets, router]);

  const handleRestTimer = useCallback((seconds: number) => {
    setRestTimerSeconds(seconds);
    setShowRestTimer(true);
  }, []);

  const handleCancel = useCallback(() => {
    if (!workout) return;
    Alert.alert(
      'Discard Workout',
      'Are you sure? All progress will be lost.',
      [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            deleteWorkout.mutate(String(workout.id), {
              onSuccess: () => {
                endWorkout();
                router.back();
              },
            });
          },
        },
      ],
    );
  }, [workout, deleteWorkout, endWorkout, router]);

  const handleAddExercise = useCallback(() => {
    if (!workout) return;
    router.push({
      pathname: '/(app)/(workout)/exercise-picker',
      params: { workoutId: String(workout.id) },
    });
  }, [workout, router]);

  const handleSaveName = useCallback(() => {
    if (editName === null || !workout) return;
    updateWorkoutMutation.mutate({ id: String(workout.id), data: { name: editName } });
    setEditName(null);
  }, [editName, workout, updateWorkoutMutation]);

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
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Top Bar */}
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

      {/* Stats Bar */}
      <View style={styles.statsWrap}>
        <StatsBar
          duration={formatElapsed(elapsed)}
          volume={totalVolume}
          completedSets={completedSets}
          totalSets={totalSets}
        />
      </View>

      {/* Exercises List */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingExercises ? (
          <Spinner style={{ marginTop: 48 }} />
        ) : exercises.length === 0 ? (
          <EmptyState
            title="No exercises yet"
            description="Add an exercise to begin"
            actionLabel="+ Add Exercise"
            onAction={handleAddExercise}
          />
        ) : (
          exercises.map((ex, exIdx) => (
            <ActiveExerciseCard
              key={ex.logExerciseId ?? `local-${exIdx}`}
              exerciseName={ex.exerciseName}
              trackingType={ex.trackingType}
              sets={ex.sets}
              notes={ex.notes}
              showNotes={ex.showNotes}
              onToggleNotes={() =>
                updateExercise(exIdx, { showNotes: !ex.showNotes })
              }
              onNotesChange={(text) => updateExercise(exIdx, { notes: text })}
              onUpdateSet={(setIdx, data) => updateSet(exIdx, setIdx, data)}
              onToggleSetComplete={(setIdx) => toggleSetComplete(exIdx, setIdx)}
              onAddSet={() => addSet(exIdx)}
              onRestTimer={ex.restTime > 0 ? () => handleRestTimer(ex.restTime) : undefined}
            />
          ))
        )}
      </ScrollView>

      {/* Footer */}
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

      {/* Rest Timer Overlay */}
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
    marginBottom: 12,
    gap: 10,
  },
  backBtn: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  nameWrap: {
    flex: 1,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  nameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: 4,
  },
  finishBtn: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: borderRadius.md,
  },
  finishText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  statsWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: 16,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerBtn: {
    flex: 1,
  },
});
