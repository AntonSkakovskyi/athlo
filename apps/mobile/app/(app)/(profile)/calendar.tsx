import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import type { IWorkoutWithRelations } from '@athlo/shared';
import { WorkoutHistoryCard } from '@/features/workout/components';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { formatDuration, formatDate, computeVolume } from '@/utils/workout';
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
              duration={formatDuration(w.started_at, w.ended_at)}
              volume={computeVolume(w)}
              exerciseCount={w.logExercises?.length ?? 0}
              sets={w.logExercises?.map((e: NonNullable<IWorkoutWithRelations['logExercises']>[0]) => ({
                exerciseName: e.exercise?.name ?? '',
                setsCount: e.sets?.length ?? 0,
              })) ?? []}
              onPress={() =>
                router.push({
                  pathname: '/(app)/(workout)/workout-summary',
                  params: { workoutId: String(w.id) },
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
      <Modal
        visible={monthPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMonthPickerVisible(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setMonthPickerVisible(false)}>
          <Pressable style={styles.sheetContent} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Month</Text>
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
          </Pressable>
        </Pressable>
      </Modal>

      {/* Year Picker Modal */}
      <Modal
        visible={yearPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setYearPickerVisible(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setYearPickerVisible(false)}>
          <Pressable style={styles.sheetContent} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Year</Text>
            <ScrollView style={styles.yearList} showsVerticalScrollIndicator={false}>
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
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  selectedDateText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
    maxHeight: '50%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  monthGridItem: {
    width: '30%',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
  },
  monthGridItemActive: {
    backgroundColor: colors.primary,
  },
  monthGridText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  monthGridTextActive: {
    color: colors.black,
    fontWeight: fontWeight.bold,
  },
  yearList: {
    maxHeight: 300,
  },
  yearItem: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  yearItemActive: {
    backgroundColor: colors.primary,
  },
  yearItemText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  yearItemTextActive: {
    color: colors.black,
    fontWeight: fontWeight.bold,
  },
});
