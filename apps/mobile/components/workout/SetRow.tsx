import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius } from '../../constants/theme';
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
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="kg"
            placeholderTextColor={colors.textMuted}
            value={set.weight != null ? String(set.weight) : ''}
            onChangeText={(t) => onUpdate({ weight: t ? Number(t) : undefined })}
          />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="reps"
            placeholderTextColor={colors.textMuted}
            value={set.reps != null ? String(set.reps) : ''}
            onChangeText={(t) => onUpdate({ reps: t ? Number(t) : undefined })}
          />
        </>
      )}

      {trackingType === TrackingType.REPS_ONLY && (
        <TextInput
          style={[styles.input, styles.inputWide]}
          keyboardType="numeric"
          placeholder="reps"
          placeholderTextColor={colors.textMuted}
          value={set.reps != null ? String(set.reps) : ''}
          onChangeText={(t) => onUpdate({ reps: t ? Number(t) : undefined })}
        />
      )}

      {trackingType === TrackingType.TIME_BASED && (
        <>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="sec"
            placeholderTextColor={colors.textMuted}
            value={set.duration != null ? String(set.duration) : ''}
            onChangeText={(t) => onUpdate({ duration: t ? Number(t) : undefined })}
          />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="m"
            placeholderTextColor={colors.textMuted}
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
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 6,
  },
  rowCompleted: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
  },
  setNum: {
    width: 24,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  previous: {
    width: 60,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    minWidth: 52,
  },
  inputWide: {
    flex: 2,
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
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
