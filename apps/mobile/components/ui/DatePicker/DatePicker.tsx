import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { BottomSheet } from '@/components/ui';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  mode?: 'date' | 'monthYear';
  maximumDate?: Date;
  minimumDate?: Date;
  trigger?: React.ReactNode;
  showTodayButton?: boolean;
}

export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function getYearRange(min?: Date, max?: Date): number[] {
  const currentYear = new Date().getFullYear();
  const start = min ? min.getFullYear() : currentYear - 50;
  const end = max ? max.getFullYear() : currentYear + 10;
  const years: number[] = [];
  for (let y = start; y <= end; y++) {
    years.push(y);
  }
  return years;
}

export function DatePicker({ value, onChange, label, mode = 'date', maximumDate, minimumDate, trigger, showTodayButton = true }: DatePickerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [show, setShow] = useState(false);
  const [viewState, setViewState] = useState<'calendar' | 'month' | 'year'>(mode === 'monthYear' ? 'month' : 'calendar');
  const [currentMonth, setCurrentMonth] = useState({ year: value.getFullYear(), month: value.getMonth() });

  const formatDate = (date: Date) => {
    if (mode === 'monthYear') {
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    }
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month);
  const firstDay = getFirstDayOfMonth(currentMonth.year, currentMonth.month);
  const today = new Date();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [firstDay, daysInMonth]);

  const yearRange = useMemo(() => getYearRange(minimumDate, maximumDate).reverse(), [minimumDate, maximumDate]);

  const handleDaySelect = (day: number) => {
    const newDate = new Date(currentMonth.year, currentMonth.month, day);
    onChange(newDate);
    setShow(false);
  };

  const handleMonthSelect = (month: number) => {
    setCurrentMonth(prev => ({ ...prev, month }));
    if (mode === 'monthYear') {
      const newDate = new Date(currentMonth.year, month, 1);
      onChange(newDate);
      setShow(false);
    } else {
      setViewState('calendar');
    }
  };

  const handleYearSelect = (year: number) => {
    setCurrentMonth(prev => ({ ...prev, year }));
    setViewState(mode === 'monthYear' ? 'month' : 'calendar');
  };

  const handleClose = () => {
    setShow(false);
    setViewState(mode === 'monthYear' ? 'month' : 'calendar');
    setCurrentMonth({ year: value.getFullYear(), month: value.getMonth() });
  };

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable onPress={() => setShow(true)}>
        {trigger ? trigger : (
          <View style={styles.trigger}>
            <Text style={styles.dateText}>{formatDate(value)}</Text>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
          </View>
        )}
      </Pressable>

      <BottomSheet
        visible={show}
        onClose={handleClose}
        title={viewState === 'calendar' ? `${MONTH_NAMES[currentMonth.month]} ${currentMonth.year}` : viewState === 'month' ? 'Select Month' : 'Select Year'}
        scrollable={false}
        maxHeight="75%"
      >
        <View style={styles.sheetBody}>
          {viewState === 'calendar' && mode === 'date' && (
            <View>
              <View style={styles.monthNav}>
                <Pressable onPress={() => setCurrentMonth(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: prev.month - 1 })} style={styles.arrowBtn}>
                  <Text style={styles.monthArrow}>‹</Text>
                </Pressable>
                <View style={styles.monthYearRow}>
                  <Pressable style={styles.pickerChip} onPress={() => setViewState('month')}>
                      <Text style={styles.pickerChipText}>{MONTH_NAMES[currentMonth.month]} ▼</Text>
                    </Pressable>
                    <Pressable style={styles.pickerChip} onPress={() => setViewState('year')}>
                      <Text style={styles.pickerChipText}>{currentMonth.year} ▼</Text>
                  </Pressable>
                </View>
                <Pressable onPress={() => setCurrentMonth(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: prev.month + 1 })} style={styles.arrowBtn}>
                  <Text style={styles.monthArrow}>›</Text>
                </Pressable>
              </View>

              <View style={styles.weekRow}>
                {DAYS_OF_WEEK.map((day) => (
                  <View key={day} style={styles.weekCell}>
                    <Text style={styles.weekDayText}>{day}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.dayGrid}>
                {calendarDays.map((day, index) => {
                  if (day === null) return <View key={`empty-${index}`} style={styles.dayCell} />;

                  const d = new Date(currentMonth.year, currentMonth.month, day);
                  let isDisabled = false;
                  if (maximumDate) {
                    const max = new Date(maximumDate.getFullYear(), maximumDate.getMonth(), maximumDate.getDate());
                    if (d > max) isDisabled = true;
                  }
                  if (minimumDate) {
                    const min = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate());
                    if (d < min) isDisabled = true;
                  }

                  const isSelected = value.getDate() === day && value.getMonth() === currentMonth.month && value.getFullYear() === currentMonth.year;
                  const isToday = today.getDate() === day && today.getMonth() === currentMonth.month && today.getFullYear() === currentMonth.year;

                  return (
                    <Pressable key={day} style={styles.dayCell} onPress={() => !isDisabled && handleDaySelect(day)}>
                      <View style={[styles.dayCircle, isToday && styles.dayCircleToday, isSelected && styles.dayCircleSelected, isDisabled && styles.dayCircleDisabled]}>
                        <Text style={[styles.dayText, isToday && !isSelected && styles.dayTextToday, isSelected && styles.dayTextSelected, isDisabled && styles.dayTextDisabled]}>
                          {day}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {showTodayButton && (
                <Pressable
                  style={styles.todayBtn}
                  onPress={() => {
                    const todayDate = new Date();
                    setCurrentMonth({ year: todayDate.getFullYear(), month: todayDate.getMonth() });
                    if (mode === 'date') {
                      onChange(todayDate);
                      setShow(false);
                    } else {
                      setViewState('calendar');
                    }
                  }}
                >
                  <Text style={styles.todayBtnText}>Today</Text>
                </Pressable>
              )}
            </View>
          )}

          {viewState === 'month' && (
            <View>
              {mode !== 'monthYear' && (
                <Pressable style={styles.backBtn} onPress={() => setViewState('calendar')}>
                  <Ionicons name="arrow-back" size={20} color={colors.text} />
                  <Text style={styles.backBtnText}>Back to Calendar</Text>
                </Pressable>
              )}
              {mode === 'monthYear' && (
                <View style={styles.monthYearRowCenter}>
                  <Pressable style={styles.pickerChip} onPress={() => setViewState('year')}>
                      <Text style={styles.pickerChipText}>{currentMonth.year} ▼</Text>
                  </Pressable>
                </View>
              )}
              <View style={styles.monthGrid}>
                {MONTH_SHORT.map((name, i) => (
                  <Pressable
                    key={name}
                    style={[styles.monthGridItem, i === currentMonth.month && styles.monthGridItemActive]}
                    onPress={() => handleMonthSelect(i)}
                  >
                    <Text style={[styles.monthGridText, i === currentMonth.month && styles.monthGridTextActive]}>{name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {viewState === 'year' && (
            <View>
              <Pressable
                style={styles.backBtn}
                onPress={() => setViewState(mode === 'monthYear' ? 'month' : 'calendar')}
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
                <Text style={styles.backBtnText}>Back</Text>
              </Pressable>
              <ScrollView style={styles.yearList} showsVerticalScrollIndicator={false}>
                {yearRange.map((year) => (
                  <Pressable
                    key={year}
                    style={[styles.yearItem, year === currentMonth.year && styles.yearItemActive]}
                    onPress={() => handleYearSelect(year)}
                  >
                    <Text style={[styles.yearItemText, year === currentMonth.year && styles.yearItemTextActive]}>{year}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </BottomSheet>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: c.textSecondary, marginBottom: spacing.xs },
    trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    dateText: { fontSize: fontSize.md, color: c.text },
    sheetBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
    arrowBtn: { paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
    monthArrow: { fontSize: fontSize['3xl'], color: c.primary, fontWeight: fontWeight.semibold, paddingHorizontal: spacing.sm },
    monthYearRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    monthYearRowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
    pickerChip: { backgroundColor: c.surfaceLight, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md, borderWidth: 1, borderColor: c.border },
    pickerChipText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: c.text },
    weekRow: { flexDirection: 'row', marginBottom: spacing.sm },
    weekCell: { flex: 1, alignItems: 'center' },
    weekDayText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: c.textMuted },
    dayGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
    dayCircle: { width: 34, height: 34, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center' },
    dayCircleToday: { borderWidth: 1.5, borderColor: c.primary },
    dayCircleSelected: { backgroundColor: c.primary },
    dayCircleDisabled: { opacity: 0.3 },
    dayText: { fontSize: fontSize.md, color: c.text, fontWeight: fontWeight.medium },
    dayTextToday: { color: c.primary, fontWeight: fontWeight.bold },
    dayTextSelected: { color: c.black, fontWeight: fontWeight.bold },
    dayTextDisabled: { color: c.textMuted },
    todayBtn: {
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      backgroundColor: c.surfaceLight,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: c.border
    },
    todayBtnText: {
      color: c.primary,
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.xs },
    backBtnText: { fontSize: fontSize.md, color: c.text, fontWeight: fontWeight.medium },
    monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    monthGridItem: { width: '31%', paddingVertical: spacing.md, borderRadius: borderRadius.md, backgroundColor: c.surfaceLight, alignItems: 'center' },
    monthGridItemActive: { backgroundColor: c.primary },
    monthGridText: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: c.text },
    monthGridTextActive: { color: c.black, fontWeight: fontWeight.bold },
    yearList: { maxHeight: 300 },
    yearItem: { paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', marginBottom: spacing.xs },
    yearItemActive: { backgroundColor: c.primary },
    yearItemText: { fontSize: fontSize.lg, fontWeight: fontWeight.medium, color: c.text },
    yearItemTextActive: { color: c.black, fontWeight: fontWeight.bold },
  });
}
