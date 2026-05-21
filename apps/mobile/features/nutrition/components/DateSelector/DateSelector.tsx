import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { borderRadius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { DatePicker } from '@/components/ui/DatePicker/DatePicker';

interface DateSelectorProps {
  date: string;
  onPrev: () => void;
  onNext: () => void;
  isToday: boolean;
  onDateSelect?: (date: Date) => void;
  mode?: 'date' | 'monthYear';
  maximumDate?: Date;
}

export function DateSelector({ date, onPrev, onNext, isToday, onDateSelect, mode = 'date', maximumDate }: DateSelectorProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const dateObj = new Date(date + 'T00:00:00');

  const formatted = dateObj.toLocaleDateString('en-US', mode === 'monthYear' ? {
    month: 'long',
    year: 'numeric',
  } : {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <Pressable onPress={onPrev} hitSlop={12} style={styles.arrow}>
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>

      <View style={styles.middleContainer}>
        {onDateSelect ? (
          <DatePicker
            value={dateObj}
            onChange={onDateSelect}
            mode={mode}
            maximumDate={maximumDate}
            trigger={
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>{mode === 'date' && isToday ? 'Today' : formatted}</Text>
                {mode === 'date' && isToday && <Text style={styles.dateSubtext}>{formatted}</Text>}
              </View>
            }
          />
        ) : (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{mode === 'date' && isToday ? 'Today' : formatted}</Text>
            {mode === 'date' && isToday && <Text style={styles.dateSubtext}>{formatted}</Text>}
          </View>
        )}
      </View>

      <Pressable onPress={onNext} hitSlop={12} style={[styles.arrow, isToday && mode === 'date' && styles.arrowDisabled]} disabled={isToday && mode === 'date'}>
        <Text style={[styles.arrowText, isToday && mode === 'date' && styles.arrowTextDisabled]}>›</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      marginBottom: spacing.lg,
    },
    arrow: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      backgroundColor: c.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    arrowDisabled: {
      opacity: 0.3,
    },
    arrowText: {
      fontSize: 24,
      color: c.text,
      fontWeight: '600',
    },
    arrowTextDisabled: {
      color: c.textMuted,
    },
    middleContainer: {
      flex: 1,
      alignItems: 'center'
    },
    dateContainer: {
      alignItems: 'center',
    },
    dateText: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
    },
    dateSubtext: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 2,
    },
  });
}
