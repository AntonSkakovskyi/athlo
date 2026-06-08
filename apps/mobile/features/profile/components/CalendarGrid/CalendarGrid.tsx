import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { toDateKey } from '@/utils/date';

interface CalendarGridProps {
  calendarDays: (number | null)[];
  currentMonth: { year: number; month: number };
  today: Date;
  selectedKey: string;
  workoutsByDate: Record<string, unknown[]>;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenMonthPicker: () => void;
  onOpenYearPicker: () => void;
  monthName: string;
  year: number;
  daysOfWeek: string[];
  maximumDate?: Date;
}

export function CalendarGrid({
  calendarDays,
  currentMonth,
  today,
  selectedKey,
  workoutsByDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onOpenMonthPicker,
  onOpenYearPicker,
  monthName,
  year,
  daysOfWeek,
  maximumDate,
}: CalendarGridProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.calendarCard}>
      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <Pressable onPress={onPrevMonth} style={styles.arrowBtn}>
          <Text style={styles.monthArrow}>‹</Text>
        </Pressable>
        <View style={styles.monthYearRow}>
          <Pressable style={styles.pickerChip} onPress={onOpenMonthPicker}>
            <Text style={styles.pickerChipText}>{monthName} ▼</Text>
          </Pressable>
          <Pressable style={styles.pickerChip} onPress={onOpenYearPicker}>
            <Text style={styles.pickerChipText}>{year} ▼</Text>
          </Pressable>
        </View>
        <Pressable onPress={onNextMonth} style={styles.arrowBtn}>
          <Text style={styles.monthArrow}>›</Text>
        </Pressable>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekRow}>
        {daysOfWeek.map((day) => (
          <View key={day} style={styles.weekCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Day Grid */}
      <View style={styles.dayGrid}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const date = new Date(currentMonth.year, currentMonth.month, day);
          const key = toDateKey(date);
          const hasWorkout = !!workoutsByDate[key];
          
          let isDisabled = false;
          if (maximumDate) {
            const max = new Date(maximumDate.getFullYear(), maximumDate.getMonth(), maximumDate.getDate());
            if (date > max) isDisabled = true;
          }

          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
          const isSelected = key === selectedKey;

          return (
            <Pressable
              key={key}
              style={[styles.dayCell, isDisabled && styles.dayCellDisabled]}
              onPress={() => !isDisabled && onSelectDate(date)}
            >
              <View
                style={[
                  styles.dayCircle,
                  isToday && styles.dayCircleToday,
                  isSelected && styles.dayCircleSelected,
                  hasWorkout && !isSelected && styles.dayCircleHasWorkout,
                  isDisabled && styles.dayCircleDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isToday && !isSelected && styles.dayTextToday,
                    isSelected && styles.dayTextSelected,
                    isDisabled && styles.dayTextDisabled,
                  ]}
                >
                  {day}
                </Text>
              </View>
              {hasWorkout && !isSelected && <View style={styles.workoutDot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    calendarCard: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing['2xl'],
    },
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    arrowBtn: {
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
    },
    monthArrow: {
      fontSize: fontSize['3xl'],
      color: c.primary,
      fontWeight: fontWeight.semibold,
      paddingHorizontal: spacing.sm,
    },
    monthYearRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    pickerChip: {
      backgroundColor: c.surfaceLight,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    pickerChipText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.text,
    },
    weekRow: {
      flexDirection: 'row',
      marginBottom: spacing.sm,
    },
    weekCell: {
      flex: 1,
      alignItems: 'center',
    },
    weekDayText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: c.textMuted,
    },
    dayGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: '14.28%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dayCircle: {
      width: 34,
      height: 34,
      borderRadius: borderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dayCircleToday: {
      borderWidth: 1.5,
      borderColor: c.primary,
    },
    dayCircleSelected: {
      backgroundColor: c.primary,
    },
    dayCircleHasWorkout: {
      backgroundColor: c.primaryLight,
    },
    dayText: {
      fontSize: fontSize.md,
      color: c.text,
      fontWeight: fontWeight.medium,
    },
    dayTextToday: {
      color: c.primary,
      fontWeight: fontWeight.bold,
    },
    dayTextSelected: {
      color: c.black,
      fontWeight: fontWeight.bold,
    },
    dayTextDisabled: {
      color: c.textMuted,
    },
    dayCircleDisabled: {
      opacity: 0.5,
    },
    dayCellDisabled: {
      opacity: 0.3,
    },
    workoutDot: {
      width: 5,
      height: 5,
      borderRadius: borderRadius.xs,
      backgroundColor: c.primary,
      position: 'absolute',
      bottom: spacing.xs,
    },
  });
}
