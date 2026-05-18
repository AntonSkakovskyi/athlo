import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { IWorkout } from '@athlo/shared';
import { TrackingType } from '@athlo/shared';
import type { LogSetData as SetRowData } from '@/features/workout/components/ExerciseLogCard/LogSetRow/LogSetRow';

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
  replaceExercise: (index: number, exercise: Omit<ActiveExercise, 'order' | 'showNotes' | 'sets' | 'notes'> & { sets?: SetRowData[]; notes?: string }) => void;
  removeExercise: (index: number) => void;
  updateExercise: (index: number, data: Partial<ActiveExercise>) => void;
  addSet: (exerciseIndex: number) => void;
  updateSet: (exerciseIndex: number, setIndex: number, data: Partial<SetRowData>) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  reorderExercises: (fromIndex: number, toIndex: number) => void;
  reorderSets: (exerciseIndex: number, fromIndex: number, toIndex: number) => void;
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
      setState((prev) => {
        const newExercise = {
          ...exercise,
          order: prev.exercises.length + 1,
          showNotes: false,
          notes: exercise.notes ?? '',
          sets: exercise.sets ?? [{ order: 1, isCompleted: false }],
        };

        // Prevent duplicate logExerciseId by replacing the existing one
        const existingIndex = exercise.logExerciseId != null 
          ? prev.exercises.findIndex(e => e.logExerciseId === exercise.logExerciseId)
          : -1;

        if (existingIndex >= 0) {
          const updatedExercises = [...prev.exercises];
          newExercise.order = prev.exercises[existingIndex].order;
          updatedExercises[existingIndex] = newExercise;
          return { ...prev, exercises: updatedExercises };
        }

        return {
          ...prev,
          exercises: [...prev.exercises, newExercise],
        };
      });
    },
    [],
  );

  const replaceExercise = useCallback(
    (index: number, exercise: Omit<ActiveExercise, 'order' | 'showNotes' | 'sets' | 'notes'> & { sets?: SetRowData[]; notes?: string }) => {
      setState((prev) => ({
        ...prev,
        exercises: prev.exercises.map((e, i) =>
          i === index
            ? {
                ...exercise,
                order: i + 1,
                showNotes: false,
                notes: exercise.notes ?? '',
                sets: exercise.sets ?? [{ order: 1, isCompleted: false }],
              }
            : e,
        ),
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
        const lastSet = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [
            ...e.sets,
            {
              id: Date.now() + Math.random(),
              order: e.sets.length + 1,
              isCompleted: false,
              placeholderWeight: lastSet?.weight ?? lastSet?.placeholderWeight,
              placeholderReps: lastSet?.reps ?? lastSet?.placeholderReps,
              placeholderDuration: lastSet?.duration ?? lastSet?.placeholderDuration,
              placeholderDistance: lastSet?.distance ?? lastSet?.placeholderDistance,
            },
          ],
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

  const removeSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setState((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e, i) => {
        if (i !== exerciseIndex) return e;
        return {
          ...e,
          sets: e.sets.filter((_, j) => j !== setIndex).map((s, j) => ({ ...s, order: j + 1 })),
        };
      }),
    }));
  }, []);

  const reorderExercises = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      const newExercises = [...prev.exercises];
      const [movedItem] = newExercises.splice(fromIndex, 1);
      newExercises.splice(toIndex, 0, movedItem);
      return {
        ...prev,
        exercises: newExercises.map((e, i) => ({ ...e, order: i + 1 })),
      };
    });
  }, []);

  const reorderSets = useCallback((exerciseIndex: number, fromIndex: number, toIndex: number) => {
    setState((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e, i) => {
        if (i !== exerciseIndex) return e;
        const newSets = [...e.sets];
        const [movedItem] = newSets.splice(fromIndex, 1);
        newSets.splice(toIndex, 0, movedItem);
        return {
          ...e,
          sets: newSets.map((s, j) => ({ ...s, order: j + 1 })),
        };
      }),
    }));
  }, []);

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
      replaceExercise,
      removeExercise,
      updateExercise,
      addSet,
      updateSet,
      removeSet,
      reorderExercises,
      reorderSets,
      toggleSetComplete,
      totalVolume,
      completedSets,
      totalSets,
      startTime: startTimeRef.current,
    }),
    [state, startWorkout, endWorkout, addExercise, replaceExercise, removeExercise, updateExercise, addSet, updateSet, removeSet, reorderExercises, reorderSets, toggleSetComplete, totalVolume, completedSets, totalSets],
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
