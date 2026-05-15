import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { NumericInput } from '@/components/ui';
import { TrackingType } from '@athlo/shared';

export interface SetRowData {
  id?: number;
  order: number;
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  isCompleted: boolean;
  previousWeight?: number;
  previousReps?: number;
  previousDuration?: number;
  previousDistance?: number;
}

interface SetRowProps {
  set: SetRowData;
  trackingType: TrackingType;
  onUpdate: (data: Partial<SetRowData>) => void;
  onToggleComplete: () => void;
}

export function SetRow({ set, trackingType, onUpdate, onToggleComplete }: SetRowProps) {
  const formatPrevious = () => {
    if (trackingType === TrackingType.WEIGHT_AND_REPS) {
      if (set.previousWeight || set.previousReps) {
        return `${set.previousWeight ?? 0}×${set.previousReps ?? 0}`;
      }
      return '—';
    }
    if (trackingType === TrackingType.REPS_ONLY) {
      return set.previousReps ? `${set.previousReps}` : '—';
    }
    // TIME_BASED
    const dur = set.previousDuration ? formatDuration(set.previousDuration) : '';
    const dist = set.previousDistance ? `${set.previousDistance}m` : '';
    return dur || dist ? `${dur} ${dist}`.trim() : '—';
  };

  return (
    <View style={[styles.row, set.isCompleted && styles.rowCompleted]}>
      <Text style={styles.setNum}>{set.order}</Text>
      <Text style={styles.previous}>{formatPrevious()}</Text>

      {trackingType === TrackingType.WEIGHT_AND_REPS && (
        <>
          <NumericInput
            placeholder="kg"
            value={set.weight != null ? String(set.weight) : ''}
            onChangeText={(t) => onUpdate({ weight: t ? Number(t) : undefined })}
          />
          <NumericInput
            placeholder="reps"
            value={set.reps != null ? String(set.reps) : ''}
            onChangeText={(t) => onUpdate({ reps: t ? Number(t) : undefined })}
          />
        </>
      )}

      {trackingType === TrackingType.REPS_ONLY && (
        <NumericInput
          wide
          placeholder="reps"
          value={set.reps != null ? String(set.reps) : ''}
          onChangeText={(t) => onUpdate({ reps: t ? Number(t) : undefined })}
        />
      )}

      {trackingType === TrackingType.TIME_BASED && (
        <>
          <NumericInput
            placeholder="sec"
            value={set.duration != null ? String(set.duration) : ''}
            onChangeText={(t) => onUpdate({ duration: t ? Number(t) : undefined })}
          />
          <NumericInput
            placeholder="m"
            value={set.distance != null ? String(set.distance) : ''}
            onChangeText={(t) => onUpdate({ distance: t ? Number(t) : undefined })}
          />
        </>
      )}

      <Pressable
        style={[styles.checkbox, set.isCompleted && styles.checked]}
        onPress={onToggleComplete}
      >
        {set.isCompleted && <Text style={styles.checkmark}>✓</Text>}
      </Pressable>
    </View>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  rowCompleted: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
  },
  setNum: {
    width: 24,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  previous: {
    width: 60,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.black,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.lg,
  },
});
