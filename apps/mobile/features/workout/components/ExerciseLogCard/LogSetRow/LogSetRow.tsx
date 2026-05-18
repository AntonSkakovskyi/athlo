import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { NumericInput } from '@/components/ui';
import { TrackingType } from '@athlo/shared';

export type ExerciseLogMode = 'active' | 'summary' | 'template';

export interface LogSetData {
  id?: number;
  order: number;
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  isCompleted: boolean;
  isPR?: boolean;
  achievementId?: number | null;
  achievement?: any | null;
  previousWeight?: number;
  previousReps?: number;
  previousDuration?: number;
  previousDistance?: number;
  placeholderWeight?: number;
  placeholderReps?: number;
  placeholderDuration?: number;
  placeholderDistance?: number;
}

interface LogSetRowProps {
  set: LogSetData;
  trackingType: TrackingType;
  mode: ExerciseLogMode;
  isEditing?: boolean;
  onUpdate: (data: Partial<LogSetData>) => void;
  onToggleComplete?: () => void;
  onOpenMenu?: () => void;
  onOpenTimePicker?: () => void;
  onPRPress?: () => void;
}

export function LogSetRow({
  set,
  trackingType,
  mode,
  isEditing = true,
  onUpdate,
  onToggleComplete,
  onOpenMenu,
  onOpenTimePicker,
  onPRPress,
}: LogSetRowProps) {
  const isViewOnly = !isEditing && mode !== 'active';
  const showPrevious = mode === 'active' || (mode === 'summary' && isEditing);
  const showCheckbox = mode === 'active' || (mode === 'summary' && isEditing);

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
    const dur = set.previousDuration ? formatDuration(set.previousDuration) : '';
    const dist = set.previousDistance ? `${set.previousDistance}m` : '';
    return dur || dist ? `${dur} ${dist}`.trim() : '—';
  };

  const formatValue = (val?: number, unit: string = '') => {
    if (val == null) return '—';
    if (unit === 'time') return formatDuration(val);
    return `${val}${unit}`;
  };

  const handleToggleComplete = () => {
    if (!set.isCompleted) {
      // If completing and values are empty, fill from placeholders (last set of current workout)
      const updates: Partial<LogSetData> = {};
      if (trackingType === TrackingType.WEIGHT_AND_REPS) {
        if (set.weight === undefined && set.placeholderWeight !== undefined) updates.weight = set.placeholderWeight;
        if (set.reps === undefined && set.placeholderReps !== undefined) updates.reps = set.placeholderReps;
      } else if (trackingType === TrackingType.REPS_ONLY) {
        if (set.reps === undefined && set.placeholderReps !== undefined) updates.reps = set.placeholderReps;
      } else if (trackingType === TrackingType.TIME_BASED) {
        if (set.duration === undefined && set.placeholderDuration !== undefined) updates.duration = set.placeholderDuration;
        if (set.distance === undefined && set.placeholderDistance !== undefined) updates.distance = set.placeholderDistance;
      }
      
      if (Object.keys(updates).length > 0) {
        onUpdate(updates);
      }
    }
    onToggleComplete?.();
  };

  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.row,
          set.isCompleted && isEditing && (mode === 'active' || mode === 'summary') && styles.rowCompleted,
        ]}
      >
        <View style={styles.setNumWrap}>
          <Text style={styles.setNum}>{set.order}</Text>
        </View>

        {showPrevious && (
          <Text style={styles.previous}>{formatPrevious()}</Text>
        )}

        {trackingType === TrackingType.WEIGHT_AND_REPS && (
          <>
            <View style={styles.inputWrap}>
              {isViewOnly ? (
                <Text style={styles.valueText}>{formatValue(set.weight, 'kg')}</Text>
              ) : (
                <NumericInput
                  placeholder={set.placeholderWeight != null ? String(set.placeholderWeight) : 'kg'}
                  value={set.weight != null ? String(set.weight) : ''}
                  onChangeText={(t) => onUpdate({ weight: t ? Number(t) : undefined })}
                />
              )}
            </View>
            <View style={styles.inputWrap}>
              {isViewOnly ? (
                <Text style={styles.valueText}>{formatValue(set.reps)}</Text>
              ) : (
                <NumericInput
                  placeholder={set.placeholderReps != null ? String(set.placeholderReps) : 'reps'}
                  value={set.reps != null ? String(set.reps) : ''}
                  onChangeText={(t) => onUpdate({ reps: t ? Number(t) : undefined })}
                />
              )}
            </View>
          </>
        )}

        {trackingType === TrackingType.REPS_ONLY && (
          <View style={styles.inputWrapWide}>
            {isViewOnly ? (
              <Text style={styles.valueText}>{formatValue(set.reps)}</Text>
            ) : (
              <NumericInput
                wide
                placeholder={set.placeholderReps != null ? String(set.placeholderReps) : 'reps'}
                value={set.reps != null ? String(set.reps) : ''}
                onChangeText={(t) => onUpdate({ reps: t ? Number(t) : undefined })}
              />
            )}
          </View>
        )}

        {trackingType === TrackingType.TIME_BASED && (
          <>
            <View style={styles.inputWrap}>
              {isViewOnly ? (
                <Text style={styles.valueText}>{formatValue(set.duration, 'time')}</Text>
              ) : (
                <Pressable onPress={onOpenTimePicker} style={styles.timePickerBtn}>
                  <Text style={[styles.timeText, !set.duration && styles.timePlaceholder]}>
                    {set.duration ? formatDuration(set.duration) : '0:00'}
                  </Text>
                  <Text style={styles.timeIcon}>⏱️</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.inputWrap}>
              {isViewOnly ? (
                <Text style={styles.valueText}>{formatValue(set.distance, 'm')}</Text>
              ) : (
                <NumericInput
                  placeholder={set.placeholderDistance != null ? String(set.placeholderDistance) : 'm'}
                  value={set.distance != null ? String(set.distance) : ''}
                  onChangeText={(t) => onUpdate({ distance: t ? Number(t) : undefined })}
                />
              )}
            </View>
          </>
        )}

        {/* Fixed-width Action Slot to prevent shifting */}
        <View style={styles.actionSlot}>
          {showCheckbox && (
            <Pressable
              style={[styles.checkbox, set.isCompleted && styles.checked]}
              onPress={handleToggleComplete}
            >
              {set.isCompleted && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
          )}

          {!isEditing && set.isPR && (
            <Pressable onPress={onPRPress} style={styles.prTrophy}>
              <Text style={styles.trophyIcon}>🏆</Text>
            </Pressable>
          )}

          {!isViewOnly && onOpenMenu && (
            <Pressable onPress={onOpenMenu} style={styles.menuBtn}>
              <Text style={styles.menuIcon}>⋮</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 1,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },
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
  setNumWrap: {
    width: 24,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setNum: {
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
  valueText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  timePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
    minWidth: 80,
    justifyContent: 'center',
  },
  timeText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  timePlaceholder: {
    color: colors.textMuted,
  },
  timeIcon: {
    fontSize: fontSize.md,
  },
  actionSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    minWidth: 100,
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
  menuBtn: {
    width: 28,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
  },
  prTrophy: {
    width: 28,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyIcon: {
    fontSize: fontSize.lg,
  },
});
