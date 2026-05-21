import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { NumericInput } from '@/components/ui';
import { TrackingType } from '@athlo/shared';
import { formatSeconds } from '@/utils/time';
import type { LogSetData } from '../LogSetRow';

interface SetInputGroupProps {
  trackingType: TrackingType;
  isViewOnly: boolean;
  set: LogSetData;
  onUpdate: (data: Partial<LogSetData>) => void;
  onOpenTimePicker?: () => void;
}

export function SetInputGroup({
  trackingType,
  isViewOnly,
  set,
  onUpdate,
  onOpenTimePicker,
}: SetInputGroupProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const formatValue = (val?: number, unit: string = '') => {
    if (val == null) return '—';
    if (unit === 'time') return formatSeconds(val);
    return `${val}${unit}`;
  };

  if (trackingType === TrackingType.WEIGHT_AND_REPS) {
    return (
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
    );
  }

  if (trackingType === TrackingType.REPS_ONLY) {
    return (
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
    );
  }

  if (trackingType === TrackingType.TIME_BASED) {
    return (
      <>
        <View style={styles.inputWrap}>
          {isViewOnly ? (
            <Text style={styles.valueText}>{formatValue(set.duration, 'time')}</Text>
          ) : (
            <Pressable onPress={onOpenTimePicker} style={styles.timePickerBtn}>
              <Text style={[styles.timeText, !set.duration && styles.timePlaceholder]}>
                {set.duration ? formatSeconds(set.duration) : '0:00'}
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
    );
  }

  return null;
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
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
      color: c.text,
      fontWeight: fontWeight.medium,
    },
    timePickerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceLight,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.sm,
      gap: spacing.xs,
      minWidth: 80,
      justifyContent: 'center',
    },
    timeText: {
      fontSize: fontSize.md,
      color: c.text,
      fontWeight: fontWeight.medium,
    },
    timePlaceholder: {
      color: c.textMuted,
    },
    timeIcon: {
      fontSize: fontSize.md,
    },
  });
}
