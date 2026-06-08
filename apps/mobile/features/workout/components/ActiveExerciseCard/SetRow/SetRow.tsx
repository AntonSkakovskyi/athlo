import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { NumericInput } from '@/components/ui';
import { TrackingType } from '@athlo/shared';
import { formatSeconds } from '@/utils/time';

export interface SetRowData {
  id?: number;
  order: number;
  weight?: number | null;
  reps?: number | null;
  duration?: number | null;
  distance?: number | null;
  isCompleted: boolean;
  previousWeight?: number | null;
  previousReps?: number | null;
  previousDuration?: number | null;
  previousDistance?: number | null;
}

interface SetRowProps {
  set: SetRowData;
  trackingType: TrackingType;
  onUpdate: (data: Partial<SetRowData>) => void;
  onToggleComplete: () => void;
}

export function SetRow({ set, trackingType, onUpdate, onToggleComplete }: SetRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
    if (trackingType === TrackingType.TIME_BASED) {
      return set.previousDuration ? formatSeconds(set.previousDuration) : '—';
    }
    if (trackingType === TrackingType.DISTANCE_ONLY) {
      return set.previousDistance ? `${set.previousDistance}m` : '—';
    }
    // DISTANCE_AND_TIME
    const dur = set.previousDuration ? formatSeconds(set.previousDuration) : '';
    const dist = set.previousDistance ? `${set.previousDistance}m` : '';
    return dur || dist ? `${dur} ${dist}`.trim() : '—';
  };

  return (
    <View style={[styles.row, set.isCompleted && styles.rowCompleted]}>
      <Text style={styles.setNum}>{set.order}</Text>
      <Text style={styles.previous}>{formatPrevious()}</Text>

      {trackingType === TrackingType.WEIGHT_AND_REPS && (
        <>
          <View style={styles.inputWrap}>
            <NumericInput
              placeholder="kg"
              value={set.weight != null ? String(set.weight) : ''}
              onChangeText={(t) => onUpdate({ weight: t ? Number(t) : null })}
            />
          </View>
          <View style={styles.inputWrap}>
            <NumericInput
              placeholder="reps"
              value={set.reps != null ? String(set.reps) : ''}
              onChangeText={(t) => onUpdate({ reps: t ? Number(t) : null })}
            />
          </View>
        </>
      )}

      {trackingType === TrackingType.REPS_ONLY && (
        <View style={styles.inputWrapWide}>
          <NumericInput
            wide
            placeholder="reps"
            value={set.reps != null ? String(set.reps) : ''}
            onChangeText={(t) => onUpdate({ reps: t ? Number(t) : null })}
          />
        </View>
      )}

      {trackingType === TrackingType.TIME_BASED && (
        <View style={styles.inputWrapWide}>
          <NumericInput
            wide
            placeholder="sec"
            value={set.duration != null ? String(set.duration) : ''}
            onChangeText={(t) => onUpdate({ duration: t ? Number(t) : null })}
          />
        </View>
      )}

      {trackingType === TrackingType.DISTANCE_AND_TIME && (
        <>
          <View style={styles.inputWrap}>
            <NumericInput
              placeholder="sec"
              value={set.duration != null ? String(set.duration) : ''}
              onChangeText={(t) => onUpdate({ duration: t ? Number(t) : null })}
            />
          </View>
          <View style={styles.inputWrap}>
            <NumericInput
              placeholder="m"
              value={set.distance != null ? String(set.distance) : ''}
              onChangeText={(t) => onUpdate({ distance: t ? Number(t) : null })}
            />
          </View>
        </>
      )}

      {trackingType === TrackingType.DISTANCE_ONLY && (
        <View style={styles.inputWrapWide}>
          <NumericInput
            wide
            placeholder="m"
            value={set.distance != null ? String(set.distance) : ''}
            onChangeText={(t) => onUpdate({ distance: t ? Number(t) : null })}
          />
        </View>
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


function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      gap: spacing.xs,
    },
    rowCompleted: {
      backgroundColor: c.primaryLight,
      borderRadius: borderRadius.sm,
    },
    setNum: {
      width: 24,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.textSecondary,
      textAlign: 'center',
    },
    previous: {
      width: 60,
      fontSize: fontSize.sm,
      color: c.textMuted,
      textAlign: 'center',
    },
    inputWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputWrapWide: {
      flex: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkbox: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.sm,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checked: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    checkmark: {
      color: c.black,
      fontWeight: fontWeight.bold,
      fontSize: fontSize.lg,
    },
  });
}
