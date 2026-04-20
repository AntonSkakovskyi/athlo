import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { IWorkout } from '@athlo/shared';
import { TrackingType } from '@athlo/shared';
import type { SetRowData } from '../components/workout/SetRow';

export interface ActiveExercise {
  logExerciseId?: number;
  exerciseId: number;
  exerciseName: string;
  trackingType: TrackingType;
  order: number;
  notes: string;
  restTime: number;
  showNotes: boolean;
  sets: SetRowData[];
}

interface ActiveWorkoutState {
  workout: IWorkout | null;
  exercises: ActiveExercise[];
  isActive: boolean;
}

interface ActiveWorkoutContextType extends ActiveWorkoutState {
  startWorkout: (workout: IWorkout, exercises?: ActiveExercise[]) => void;
  endWorkout: () => void;
  addExercise: (exercise: Omit<ActiveExercise, 'order' | 'showNotes' | 'sets' | 'notes'> & { sets?: SetRowData[]; notes?: string }) => void;
  removeExercise: (index: number) => void;
  updateExercise: (index: number, data: Partial<ActiveExercise>) => void;
  addSet: (exerciseIndex: number) => void;
  updateSet: (exerciseIndex: number, setIndex: number, data: Partial<SetRowData>) => void;
  toggleSetComplete: (exerciseIndex: number, setIndex: number) => void;
  totalVolume: number;
  completedSets: number;
  totalSets: number;
  startTime: number;
}

const ActiveWorkoutContext = createContext<ActiveWorkoutContextType | null>(null);

export function ActiveWorkoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ActiveWorkoutState>({
    workout: null,
    exercises: [],
    isActive: false,
  });

  const startTimeRef = useRef<number>(Date.now());

  const startWorkout = useCallback((workout: IWorkout, exercises: ActiveExercise[] = []) => {
    startTimeRef.current = Date.now();
    setState({ workout, exercises, isActive: true });
  }, []);

  const endWorkout = useCallback(() => {
    setState({ workout: null, exercises: [], isActive: false });
  }, []);

  const addExercise = useCallback(
    (exercise: Omit<ActiveExercise, 'order' | 'showNotes' | 'sets' | 'notes'> & { sets?: SetRowData[]; notes?: string }) => {
      setState((prev) => ({
        ...prev,
        exercises: [
          ...prev.exercises,
          {
            ...exercise,
            order: prev.exercises.length + 1,
            showNotes: false,
            notes: exercise.notes ?? '',
            sets: exercise.sets ?? [
              { order: 1, isCompleted: false },
            ],
          },
        ],
      }));
    },
    [],
  );

  const removeExercise = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index).map((e, i) => ({ ...e, order: i + 1 })),
    }));
  }, []);

  const updateExercise = useCallback((index: number, data: Partial<ActiveExercise>) => {
    setState((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e, i) => (i === index ? { ...e, ...data } : e)),
    }));
  }, []);

  const addSet = useCallback((exerciseIndex: number) => {
    setState((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e, i) => {
        if (i !== exerciseIndex) return e;
        return {
          ...e,
          sets: [...e.sets, { order: e.sets.length + 1, isCompleted: false }],
        };
      }),
    }));
  }, []);

  const updateSet = useCallback(
    (exerciseIndex: number, setIndex: number, data: Partial<SetRowData>) => {
      setState((prev) => ({
        ...prev,
        exercises: prev.exercises.map((e, i) => {
          if (i !== exerciseIndex) return e;
          return {
            ...e,
            sets: e.sets.map((s, j) => (j === setIndex ? { ...s, ...data } : s)),
          };
        }),
      }));
    },
    [],
  );

  const toggleSetComplete = useCallback((exerciseIndex: number, setIndex: number) => {
    setState((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e, i) => {
        if (i !== exerciseIndex) return e;
        return {
          ...e,
          sets: e.sets.map((s, j) =>
            j === setIndex ? { ...s, isCompleted: !s.isCompleted } : s,
          ),
        };
      }),
    }));
  }, []);

  const totalVolume = useMemo(() => {
    return state.exercises.reduce((acc, ex) => {
      return (
        acc +
        ex.sets
          .filter((s) => s.isCompleted)
          .reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0)
      );
    }, 0);
  }, [state.exercises]);

  const completedSets = useMemo(
    () => state.exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.isCompleted).length, 0),
    [state.exercises],
  );

  const totalSets = useMemo(
    () => state.exercises.reduce((acc, ex) => acc + ex.sets.length, 0),
    [state.exercises],
  );

  const value = useMemo(
    () => ({
      ...state,
      startWorkout,
      endWorkout,
      addExercise,
      removeExercise,
      updateExercise,
      addSet,
      updateSet,
      toggleSetComplete,
      totalVolume,
      completedSets,
      totalSets,
      startTime: startTimeRef.current,
    }),
    [state, startWorkout, endWorkout, addExercise, removeExercise, updateExercise, addSet, updateSet, toggleSetComplete, totalVolume, completedSets, totalSets],
  );

  return (
    <ActiveWorkoutContext.Provider value={value}>{children}</ActiveWorkoutContext.Provider>
  );
}

export function useActiveWorkout() {
  const ctx = useContext(ActiveWorkoutContext);
  if (!ctx) throw new Error('useActiveWorkout must be used within ActiveWorkoutProvider');
  return ctx;
}
