import { View, Text, StyleSheet } from 'react-native';
import { TrackingType } from '@athlo/shared';
import type { ILogExerciseWithSets } from '@athlo/shared';
import { colors, borderRadius, fontSize } from '../../constants/theme';
import { getTrackingType } from '../../utils/workout';

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
          <>
            <Text style={[styles.headerCol, { flex: 1 }]}>Time</Text>
            <Text style={[styles.headerCol, { flex: 1 }]}>Distance</Text>
          </>
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
            <>
              <Text style={[styles.setValue, idx === bestSetIndex && styles.bestText]}>
                {formatTimeDuration(set.duration ?? 0)}
              </Text>
              <Text style={[styles.setValue, idx === bestSetIndex && styles.bestText]}>
                {set.distance ? `${set.distance}m` : '—'}
              </Text>
            </>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  notes: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 4,
  },
  headerCol: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  bestSetRow: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    marginHorizontal: -4,
    paddingHorizontal: 8,
  },
  setNum: {
    width: 28,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  setValue: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
  },
  bestText: {
    color: colors.primary,
    fontWeight: '700',
  },
  bestBadge: {
    fontSize: 14,
    marginLeft: 4,
  },
  noSets: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
