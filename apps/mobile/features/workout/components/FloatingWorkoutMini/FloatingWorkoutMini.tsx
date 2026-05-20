import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/constants/theme';
import { ICONS } from '@/utils/icons';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { useDeleteWorkout } from '@/hooks/api';

const HIDDEN_SCREENS = ['active-workout', 'exercise-picker', 'finish-workout', 'workout-summary', 'template'];

export function FloatingWorkoutMini() {
  const { workout, isActive, exercises, completedSets, totalSets, endWorkout } = useActiveWorkout();
  const router = useRouter();
  const segments = useSegments();
  const deleteWorkout = useDeleteWorkout();
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!isActive || !workout) return;
    const start = new Date(workout.started_at).getTime();
    const tick = () => {
      const diff = Date.now() - start;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isActive, workout]);

  const isInWorkoutTab = segments.includes('(workout)');
  const isOnHiddenScreen = segments.some(s => HIDDEN_SCREENS.includes(s));
  
  if (!isActive || !workout || !isInWorkoutTab || isOnHiddenScreen) return null;

  const currentExercise = exercises.find((e) => e.sets.some((s) => !s.isCompleted));
  const currentSetIndex = currentExercise
    ? currentExercise.sets.findIndex((s) => !s.isCompleted) + 1
    : 0;

  const handleDelete = () => {
    Alert.alert(
      'Discard Workout',
      'All progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteWorkout.mutate(String(workout.id), {
              onSuccess: () => endWorkout(),
            });
          },
        },
      ],
    );
  };

  return (
    <View style={styles.miniPlayer}>
      <Pressable
        style={styles.miniCircleBtn}
        onPress={() => router.push('/(app)/(workout)/active-workout')}
      >
        <Text style={styles.miniCircleIcon}>↑</Text>
      </Pressable>

      <View>
        <Text style={styles.miniTitle} numberOfLines={1}>
          Active workout · {elapsed}
        </Text>
        {currentExercise ? (
          <Text style={styles.miniSubtitle} numberOfLines={1}>
            {currentExercise.exerciseName} · Set {currentSetIndex}/{currentExercise.sets.length}
          </Text>
        ) : (
          <Text style={styles.miniSubtitle}>{completedSets}/{totalSets} sets done</Text>
        )}
      </View>

      <Pressable style={[styles.miniCircleBtn, styles.miniCircleBtnDanger]} onPress={handleDelete}>
        <Text style={styles.miniCircleIcon}>{ICONS.delete}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  miniPlayer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  miniCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCircleBtnDanger: {
    backgroundColor: colors.dangerLight,
  },
  miniCircleIcon: {
    fontSize: fontSize.xl,
    color: colors.black,
  },
  miniTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  miniSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
