import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrackingType } from '@athlo/shared';
import type { ILogExerciseWithSets } from '@athlo/shared';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { getTrackingType } from '@/utils/workout';

interface ExerciseSummaryCardProps {
  exercise: ILogExerciseWithSets;
}

function formatTimeDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}:${String(s).padStart(2, '0')}`;
  return `${s}s`;
}

export function ExerciseSummaryCard({ exercise }: ExerciseSummaryCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const trackingType = getTrackingType(exercise.exercise?.trackingTypeId);
  const completedSets =
    exercise.sets?.filter((s) => s.isCompleted).sort((a, b) => a.order - b.order) ?? [];

  let bestSetIndex = -1;
  if (completedSets.length > 0) {
    if (trackingType === TrackingType.WEIGHT_AND_REPS) {
      let maxVol = 0;
      completedSets.forEach((s, i) => {
        const vol = (s.weight ?? 0) * (s.reps ?? 0);
        if (vol > maxVol) {
          maxVol = vol;
          bestSetIndex = i;
        }
      });
    } else if (trackingType === TrackingType.REPS_ONLY) {
      let maxReps = 0;
      completedSets.forEach((s, i) => {
        if ((s.reps ?? 0) > maxReps) {
          maxReps = s.reps ?? 0;
          bestSetIndex = i;
        }
      });
    } else {
      let maxDur = 0;
      completedSets.forEach((s, i) => {
        if ((s.duration ?? 0) > maxDur) {
          maxDur = s.duration ?? 0;
          bestSetIndex = i;
        }
      });
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.name}>
        {exercise.exercise?.name ?? `Exercise #${exercise.order}`}
      </Text>
      {exercise.notes ? <Text style={styles.notes}>{exercise.notes}</Text> : null}

      <View style={styles.headerRow}>
        <Text style={[styles.headerCol, { width: 28 }]}>#</Text>
        {trackingType === TrackingType.WEIGHT_AND_REPS && (
          <>
            <Text style={[styles.headerCol, { flex: 1 }]}>Weight</Text>
            <Text style={[styles.headerCol, { flex: 1 }]}>Reps</Text>
          </>
        )}
        {trackingType === TrackingType.REPS_ONLY && (
          <Text style={[styles.headerCol, { flex: 1 }]}>Reps</Text>
        )}
        {trackingType === TrackingType.TIME_BASED && (
          <Text style={[styles.headerCol, { flex: 1 }]}>Time</Text>
        )}
        {trackingType === TrackingType.DISTANCE_AND_TIME && (
          <>
            <Text style={[styles.headerCol, { flex: 1 }]}>Time</Text>
            <Text style={[styles.headerCol, { flex: 1 }]}>Distance</Text>
          </>
        )}
        {trackingType === TrackingType.DISTANCE_ONLY && (
          <Text style={[styles.headerCol, { flex: 1 }]}>Distance</Text>
        )}
      </View>

      {completedSets.map((set, idx) => (
        <View key={set.id} style={[styles.setRow, idx === bestSetIndex && styles.bestSetRow]}>
          <Text style={[styles.setNum, idx === bestSetIndex && styles.bestText]}>{set.order}</Text>
          {trackingType === TrackingType.WEIGHT_AND_REPS && (
            <>
              <Text style={[styles.setValue, idx === bestSetIndex && styles.bestText]}>
                {set.weight ?? 0} kg
              </Text>
              <Text style={[styles.setValue, idx === bestSetIndex && styles.bestText]}>
                {set.reps ?? 0}
              </Text>
            </>
          )}
          {trackingType === TrackingType.REPS_ONLY && (
            <Text style={[styles.setValue, idx === bestSetIndex && styles.bestText]}>
              {set.reps ?? 0}
            </Text>
          )}
          {trackingType === TrackingType.TIME_BASED && (
            <Text style={[styles.setValue, idx === bestSetIndex && styles.bestText]}>
              {formatTimeDuration(set.duration ?? 0)}
            </Text>
          )}
          {trackingType === TrackingType.DISTANCE_AND_TIME && (
            <>
              <Text style={[styles.setValue, idx === bestSetIndex && styles.bestText]}>
                {formatTimeDuration(set.duration ?? 0)}
              </Text>
              <Text style={[styles.setValue, idx === bestSetIndex && styles.bestText]}>
                {set.distance ? `${set.distance}m` : '—'}
              </Text>
            </>
          )}
          {trackingType === TrackingType.DISTANCE_ONLY && (
            <Text style={[styles.setValue, idx === bestSetIndex && styles.bestText]}>
              {set.distance ? `${set.distance}m` : '—'}
            </Text>
          )}
          {idx === bestSetIndex && <Text style={styles.bestBadge}>🏆</Text>}
        </View>
      ))}

      {completedSets.length === 0 && (
        <Text style={styles.noSets}>No completed sets</Text>
      )}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    name: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.primary,
      marginBottom: spacing.xs,
    },
    notes: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
      fontStyle: 'italic',
      marginBottom: spacing.sm,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      marginBottom: spacing.xs,
    },
    headerCol: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: c.textMuted,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    setRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    bestSetRow: {
      backgroundColor: c.primaryLight,
      borderRadius: borderRadius.sm,
      marginHorizontal: -spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    setNum: {
      width: 28,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: c.textSecondary,
      textAlign: 'center',
    },
    setValue: {
      flex: 1,
      fontSize: fontSize.md,
      color: c.text,
      textAlign: 'center',
    },
    bestText: {
      color: c.primary,
      fontWeight: fontWeight.bold,
    },
    bestBadge: {
      fontSize: fontSize.md,
      marginLeft: spacing.xs,
    },
    noSets: {
      fontSize: fontSize.sm,
      color: c.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
  });
}
