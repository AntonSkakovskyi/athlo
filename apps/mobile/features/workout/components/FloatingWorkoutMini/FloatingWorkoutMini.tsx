import { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useSegments } from 'expo-router';
import { useRouter } from '@/hooks/useRouter';
import { fontSize, fontWeight, spacing, borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { serverNow } from '@/utils/serverTime';
import type { ColorPalette } from '@/constants/colors';
import { ICONS } from '@/utils/icons';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { useDeleteWorkout } from '@/hooks/api';

const HIDDEN_SCREENS = ['active-workout', 'exercise-picker', 'finish-workout', 'workout-summary', 'template', 'exercise-detail'];

export function FloatingWorkoutMini() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { workout, isActive, exercises, completedSets, totalSets, endWorkout } = useActiveWorkout();
  const router = useRouter();
  const segments = useSegments();
  const deleteWorkout = useDeleteWorkout();
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!isActive || !workout) return;
    const start = new Date(workout.started_at).getTime();
    const tick = () => {
      const diff = serverNow() - start;
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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    miniPlayer: {
      position: 'absolute',
      bottom: 80,
      left: 16,
      right: 16,
      backgroundColor: c.surfaceElevated,
      borderRadius: borderRadius.xl,
      padding: spacing.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.xl,
      borderWidth: 1,
      borderColor: c.primary,
    },
    miniCircleBtn: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.xl,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    miniCircleBtnDanger: {
      backgroundColor: c.dangerLight,
    },
    miniCircleIcon: {
      fontSize: fontSize.xl,
      color: c.black,
    },
    miniTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    miniSubtitle: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
      marginTop: 2,
    },
  });
}
