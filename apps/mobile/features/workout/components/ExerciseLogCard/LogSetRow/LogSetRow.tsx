import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { TrackingType } from '@athlo/shared';
import { formatSeconds } from '@/utils/time';
import { SetInputGroup } from './SetInputGroup/SetInputGroup';

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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
    const dur = set.previousDuration ? formatSeconds(set.previousDuration) : '';
    const dist = set.previousDistance ? `${set.previousDistance}m` : '';
    return dur || dist ? `${dur} ${dist}`.trim() : '—';
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

        <SetInputGroup
          trackingType={trackingType}
          isViewOnly={isViewOnly}
          set={set}
          onUpdate={onUpdate}
          onOpenTimePicker={onOpenTimePicker}
        />

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


function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      marginBottom: 1,
      borderRadius: borderRadius.sm,
      backgroundColor: c.surface,
    },
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
    setNumWrap: {
      width: 24,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    setNum: {
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
    menuBtn: {
      width: 28,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuIcon: {
      fontSize: fontSize.lg,
      color: c.textMuted,
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
}
