import { useState, useMemo, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WorkoutStatus } from '@athlo/shared';
import type { IWorkoutWithRelations } from '@athlo/shared';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { toDateKey } from '@/utils/date';
import { useCreateWorkout, useGetWorkouts } from '@/hooks/api/useWorkoutAPI';

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

function getYearRange(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    years.push(y);
  }
  return years;
}

export function useCalendarScreen() {
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
    const map: Record<string, IWorkoutWithRelations[]> = {};
    completedWorkouts.forEach((w) => {
      const key = toDateKey(new Date(w.started_at));
      if (!map[key]) map[key] = [];
      map[key].push(w);
    });
    return map;
  }, [completedWorkouts]);

  const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month);
  const firstDay = getFirstDayOfMonth(currentMonth.year, currentMonth.month);
  const today = new Date();

  const selectedKey = toDateKey(selectedDate);
  const selectedWorkouts = workoutsByDate[selectedKey] ?? [];

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  }, []);

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

  return {
    insets,
    router,
    currentMonth,
    selectedDate,
    setSelectedDate,
    monthPickerVisible,
    setMonthPickerVisible,
    yearPickerVisible,
    setYearPickerVisible,
    workouts,
    isLoading,
    completedWorkouts,
    workoutsByDate,
    daysInMonth,
    firstDay,
    today,
    selectedKey,
    selectedWorkouts,
    calendarDays,
    yearRange,
    goToPrevMonth,
    goToNextMonth,
    handleSelectMonth,
    handleSelectYear,
    handleStartWorkout,
    createWorkout,
    startWorkout,
    isActive,
    MONTH_NAMES,
    MONTH_SHORT,
    DAYS_OF_WEEK,
  };
}
