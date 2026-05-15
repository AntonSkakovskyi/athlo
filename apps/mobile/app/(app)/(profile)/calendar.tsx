import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WorkoutStatus } from '@athlo/shared';
import type { IWorkout } from '@athlo/shared';
import { colors, borderRadius, spacing } from '../../../constants/theme';
import { useGetWorkouts, useCreateWorkout } from '../../../hooks/api/useWorkoutHooks';
import { useActiveWorkout } from '../../../contexts/ActiveWorkoutContext';
import { WorkoutHistoryCard } from '../../../components/workout/WorkoutHistoryCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { formatDuration, formatDate, computeVolume } from '../../../utils/workout';
import { toDateKey, formatFullDate } from '../../../utils/date';
import { Spinner } from '@/components/ui/Spinner/Spinner';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday-based
}

function getYearRange(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    years.push(y);
  }
  return years;
}

interface WorkoutWithRelations extends IWorkout {
  logExercises?: Array<{
    exercise?: { name: string };
    sets?: Array<{ weight?: number; reps?: number; isCompleted?: boolean }>;
  }>;
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { startWorkout, isActive } = useActiveWorkout();
  const createWorkout = useCreateWorkout();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);

  const { data: workouts, isLoading } = useGetWorkouts();

  const completedWorkouts = useMemo(
    () => (workouts ?? []).filter((w) => w.status === WorkoutStatus.COMPLETED),
    [workouts],
  );

  const workoutsByDate = useMemo(() => {
    const map: Record<string, WorkoutWithRelations[]> = {};
    completedWorkouts.forEach((w) => {
      const key = toDateKey(new Date(w.started_at));
      if (!map[key]) map[key] = [];
      map[key].push(w as WorkoutWithRelations);
    });
    return map;
  }, [completedWorkouts]);

  const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month);
  const firstDay = getFirstDayOfMonth(currentMonth.year, currentMonth.month);
  const today = new Date();

  const selectedKey = toDateKey(selectedDate);
  const selectedWorkouts = workoutsByDate[selectedKey] ?? [];

  const goToPrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const handleSelectMonth = useCallback((month: number) => {
    setCurrentMonth((prev) => ({ ...prev, month }));
    setMonthPickerVisible(false);
  }, []);

  const handleSelectYear = useCallback((year: number) => {
    setCurrentMonth((prev) => ({ ...prev, year }));
    setYearPickerVisible(false);
  }, []);

  const handleStartWorkout = useCallback(() => {
    if (isActive) return;
    createWorkout.mutate(
      { name: 'Quick Workout' },
      {
        onSuccess: (workout) => {
          startWorkout(workout, []);
          router.push('/(app)/(workout)/active-workout');
        },
      },
    );
  }, [isActive, createWorkout, startWorkout, router]);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [firstDay, daysInMonth]);

  const yearRange = useMemo(() => getYearRange(), []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <ScreenHeader title="Training Calendar" onBack={() => router.back()} />

      {/* Calendar */}
      <View style={styles.calendarCard}>
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <Pressable onPress={goToPrevMonth} style={styles.arrowBtn}>
            <Text style={styles.monthArrow}>‹</Text>
          </Pressable>
          <View style={styles.monthYearRow}>
            <Pressable style={styles.pickerChip} onPress={() => setMonthPickerVisible(true)}>
              <Text style={styles.pickerChipText}>
                {MONTH_NAMES[currentMonth.month]} ▼
              </Text>
            </Pressable>
            <Pressable style={styles.pickerChip} onPress={() => setYearPickerVisible(true)}>
              <Text style={styles.pickerChipText}>
                {currentMonth.year} ▼
              </Text>
            </Pressable>
          </View>
          <Pressable onPress={goToNextMonth} style={styles.arrowBtn}>
            <Text style={styles.monthArrow}>›</Text>
          </Pressable>
        </View>

        {/* Weekday Headers */}
        <View style={styles.weekRow}>
          {DAYS_OF_WEEK.map((day) => (
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
            const isToday =
              date.getDate() === today.getDate() &&
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear();
            const isSelected = key === selectedKey;

            return (
              <Pressable
                key={key}
                style={styles.dayCell}
                onPress={() => setSelectedDate(date)}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isToday && styles.dayCircleToday,
                    isSelected && styles.dayCircleSelected,
                    hasWorkout && !isSelected && styles.dayCircleHasWorkout,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday && !isSelected && styles.dayTextToday,
                      isSelected && styles.dayTextSelected,
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
              sets={w.logExercises?.map((e) => ({
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

      {/* Month Picker Bottom Sheet */}
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
                  style={[
                    styles.monthGridItem,
                    i === currentMonth.month && styles.monthGridItemActive,
                  ]}
                  onPress={() => handleSelectMonth(i)}
                >
                  <Text
                    style={[
                      styles.monthGridText,
                      i === currentMonth.month && styles.monthGridTextActive,
                    ]}
                  >
                    {name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Year Picker Bottom Sheet */}
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
                  style={[
                    styles.yearItem,
                    year === currentMonth.year && styles.yearItemActive,
                  ]}
                  onPress={() => handleSelectYear(year)}
                >
                  <Text
                    style={[
                      styles.yearItemText,
                      year === currentMonth.year && styles.yearItemTextActive,
                    ]}
                  >
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
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  arrowBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  monthArrow: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  monthYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerChip: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
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
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayCircleSelected: {
    backgroundColor: colors.primary,
  },
  dayCircleHasWorkout: {
    backgroundColor: colors.primaryLight,
  },
  dayText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  dayTextToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: '#000',
    fontWeight: '700',
  },
  workoutDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    position: 'absolute',
    bottom: 4,
  },
  section: {
    marginBottom: 24,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  loader: {
    marginVertical: 20,
  },
  // Bottom Sheet styles
  sheetOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '50%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  // Month picker grid (3×4)
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  monthGridItem: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
  },
  monthGridItemActive: {
    backgroundColor: colors.primary,
  },
  monthGridText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  monthGridTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  // Year picker list
  yearList: {
    maxHeight: 300,
  },
  yearItem: {
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: 4,
  },
  yearItemActive: {
    backgroundColor: colors.primary,
  },
  yearItemText: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.text,
  },
  yearItemTextActive: {
    color: '#000',
    fontWeight: '700',
  },
});
