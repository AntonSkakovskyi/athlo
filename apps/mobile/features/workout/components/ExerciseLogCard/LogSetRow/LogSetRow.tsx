import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { TrackingType, type IAchievement } from '@athlo/shared';
import { formatSeconds } from '@/utils/time';
import { showAlert } from '@/utils/alerts';
import { SetInputGroup } from './SetInputGroup/SetInputGroup';

export type ExerciseLogMode = 'active' | 'summary' | 'template';

export interface LogSetData {
  id?: number;
  // Стабільний клієнтський ключ для нових сетів, поки сервер не присвоїв id.
  localKey?: string;
  order: number;
  weight?: number | null;
  reps?: number | null;
  duration?: number | null;
  distance?: number | null;
  isCompleted: boolean;
  isPR?: boolean;
  achievementId?: number | null;
  achievement?: IAchievement | null;
  previousWeight?: number | null;
  previousReps?: number | null;
  previousDuration?: number | null;
  previousDistance?: number | null;
  placeholderWeight?: number | null;
  placeholderReps?: number | null;
  placeholderDuration?: number | null;
  placeholderDistance?: number | null;
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
      let isEmptyWithoutPlaceholder = false;

      if (trackingType === TrackingType.WEIGHT_AND_REPS) {
        const hasWeight = set.weight != null;
        const hasPlaceholderWeight = set.placeholderWeight != null;
        const hasReps = set.reps != null;
        const hasPlaceholderReps = set.placeholderReps != null;
        
        if ((!hasWeight && !hasPlaceholderWeight) || (!hasReps && !hasPlaceholderReps)) {
          isEmptyWithoutPlaceholder = true;
        }
      } else if (trackingType === TrackingType.REPS_ONLY) {
        const hasReps = set.reps != null;
        const hasPlaceholderReps = set.placeholderReps != null;
        
        if (!hasReps && !hasPlaceholderReps) {
          isEmptyWithoutPlaceholder = true;
        }
      } else if (trackingType === TrackingType.TIME_BASED || trackingType === TrackingType.DISTANCE_AND_TIME) {
        const hasDuration = set.duration != null;
        const hasPlaceholderDuration = set.placeholderDuration != null;

        if (!hasDuration && !hasPlaceholderDuration) {
          isEmptyWithoutPlaceholder = true;
        }
      } else if (trackingType === TrackingType.DISTANCE_ONLY) {
        const hasDistance = set.distance != null;
        const hasPlaceholderDistance = set.placeholderDistance != null;

        if (!hasDistance && !hasPlaceholderDistance) {
          isEmptyWithoutPlaceholder = true;
        }
      }

      if (isEmptyWithoutPlaceholder) {
        showAlert('Empty set', 'Enter a value before marking the set as done.');
        return;
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

        {showCheckbox && (
          <View style={styles.checkboxCell}>
            <Pressable
              style={[styles.checkbox, set.isCompleted && styles.checked]}
              onPress={handleToggleComplete}
            >
              {set.isCompleted && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
          </View>
        )}

        <View style={styles.actionsCell}>
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
      justifyContent: 'space-between',
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
    checkboxCell: {
      width: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionsCell: {
      width: 36,
      flexDirection: 'row',
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
