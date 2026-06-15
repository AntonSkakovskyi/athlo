import { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import type { IWorkoutWithRelations } from '@athlo/shared';
import { WorkoutHistoryCard } from '@/features/workout/components';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { BottomSheet } from '@/components/ui';
import { formatDurationRange, formatDate, computeVolume } from '@/utils/workout';
import { formatFullDate } from '@/utils/date';
import { CalendarGrid } from '../../../features/profile/components/CalendarGrid/CalendarGrid';
import { DAYS_OF_WEEK, MONTH_NAMES, MONTH_SHORT, useCalendarScreen } from '@/features/profile/hooks/useCalendarScreen';

export default function CalendarScreen() {
  const {
    insets,
    router,
    currentMonth,
    selectedDate,
    setSelectedDate,
    monthPickerVisible,
    setMonthPickerVisible,
    yearPickerVisible,
    setYearPickerVisible,
    isLoading,
    workoutsByDate,
    selectedKey,
    selectedWorkouts,
    calendarDays,
    yearRange,
    goToPrevMonth,
    goToNextMonth,
    handleSelectMonth,
    handleSelectYear,
    handleStartWorkout,
    today,
  } = useCalendarScreen();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const yearScrollRef = useRef<ScrollView>(null);
  const YEAR_ITEM_HEIGHT = 46; // paddingVertical 12*2 + fontSize ~22
  useEffect(() => {
    if (!yearPickerVisible) return;
    const idx = yearRange.indexOf(currentMonth.year);
    if (idx < 0) return;
    const offset = Math.max(0, idx * YEAR_ITEM_HEIGHT - YEAR_ITEM_HEIGHT * 2);
    setTimeout(() => yearScrollRef.current?.scrollTo({ y: offset, animated: false }), 50);
  }, [yearPickerVisible, yearRange, currentMonth.year]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Training Calendar" onBack={() => router.back()} />

      <CalendarGrid
        calendarDays={calendarDays}
        currentMonth={currentMonth}
        today={today}
        selectedKey={selectedKey}
        workoutsByDate={workoutsByDate}
        onSelectDate={setSelectedDate}
        onPrevMonth={goToPrevMonth}
        onNextMonth={goToNextMonth}
        onOpenMonthPicker={() => setMonthPickerVisible(true)}
        onOpenYearPicker={() => setYearPickerVisible(true)}
        monthName={MONTH_NAMES[currentMonth.month]}
        year={currentMonth.year}
        daysOfWeek={DAYS_OF_WEEK}
        maximumDate={new Date()}
      />

      {/* Selected Day Panel */}
      <View style={styles.section}>
        <Text style={styles.selectedDateText}>{formatFullDate(selectedDate)}</Text>
        {isLoading ? (
          <Spinner style={styles.loader} />
        ) : selectedWorkouts.length > 0 ? (
          selectedWorkouts.map((w) => (
            <WorkoutHistoryCard
              key={w.id}
              name={w.name}
              date={formatDate(w.started_at)}
              duration={formatDurationRange(w.started_at, w.ended_at)}
              volume={computeVolume(w)}
              exerciseCount={w.logExercises?.length ?? 0}
              sets={w.logExercises?.map((e: NonNullable<IWorkoutWithRelations['logExercises']>[0]) => ({
                exerciseName: e.exercise?.name ?? '',
                setsCount: e.sets?.length ?? 0,
              })) ?? []}
              onPress={() =>
                router.push({
                  pathname: '/(app)/(workout)/workout-summary',
                  params: { workoutId: String(w.id), source: 'calendar' },
                })
              }
            />
          ))
        ) : (
          <EmptyState
            title="No workouts on this day"
            actionLabel="Start Workout"
            onAction={handleStartWorkout}
          />
        )}
      </View>

      {/* Month Picker Modal */}
      <BottomSheet
        visible={monthPickerVisible}
        onClose={() => setMonthPickerVisible(false)}
        title="Select Month"
        maxHeight="50%"
      >
        <View style={styles.monthGrid}>
          {MONTH_SHORT.map((name, i) => (
            <Pressable
              key={name}
              style={[styles.monthGridItem, i === currentMonth.month && styles.monthGridItemActive]}
              onPress={() => handleSelectMonth(i)}
            >
              <Text style={[styles.monthGridText, i === currentMonth.month && styles.monthGridTextActive]}>
                {name}
              </Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      {/* Year Picker Modal */}
      <BottomSheet
        visible={yearPickerVisible}
        onClose={() => setYearPickerVisible(false)}
        title="Select Year"
        maxHeight="50%"
      >
        <ScrollView ref={yearScrollRef} style={styles.yearList} showsVerticalScrollIndicator={false}>
          {yearRange.map((year) => (
            <Pressable
              key={year}
              style={[styles.yearItem, year === currentMonth.year && styles.yearItemActive]}
              onPress={() => handleSelectYear(year)}
            >
              <Text style={[styles.yearItemText, year === currentMonth.year && styles.yearItemTextActive]}>
                {year}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
    </ScrollView>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: spacing.lg,
    },
    section: {
      marginBottom: spacing['2xl'],
    },
    selectedDateText: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: c.textSecondary,
      marginBottom: spacing.lg,
    },
    loader: {
      marginVertical: spacing.xl,
    },
    monthGrid: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      justifyContent: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    monthGridItem: {
      width: '30%',
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: c.surfaceLight,
      alignItems: 'center',
    },
    monthGridItemActive: {
      backgroundColor: c.primary,
    },
    monthGridText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.medium,
      color: c.text,
    },
    monthGridTextActive: {
      color: c.black,
      fontWeight: fontWeight.bold,
    },
    yearList: {
      maxHeight: 300,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    yearItem: {
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    yearItemActive: {
      backgroundColor: c.primary,
    },
    yearItemText: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.medium,
      color: c.text,
    },
    yearItemTextActive: {
      color: c.black,
      fontWeight: fontWeight.bold,
    },
  });
}
