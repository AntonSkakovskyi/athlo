import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { spacing } from '@/constants/theme';
import { ExerciseLogCard } from '@/features/workout/components';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Button } from '@/components/ui/Button/Button';
import type { ActiveExercise } from '@/contexts/ActiveWorkoutContext';
import type { LogSetData } from '@/features/workout/components/ExerciseLogCard/LogSetRow/LogSetRow';

interface ExerciseListSectionProps {
  exercises: ActiveExercise[];
  isLoadingExercises: boolean;
  workoutId: string;
  onAddExercise: () => void;
  onUpdateExercise: (exIdx: number, data: Partial<ActiveExercise>) => void;
  onUpdateSet: (exIdx: number, setIdx: number, data: Partial<LogSetData>) => void;
  onDeleteSet: (exIdx: number, setIdx: number) => void;
  onToggleSetComplete: (exIdx: number, setIdx: number) => void;
  onAddSet: (exIdx: number) => void;
  onRestTimer: (restTime: number) => void;
  onDeleteExercise: (exIdx: number) => void;
  onMoveExercise: (exIdx: number, direction: 'up' | 'down') => void;
  onPRPress: (exIdx: number, setIdx: number) => void;
}

export function ExerciseListSection({
  exercises,
  isLoadingExercises,
  workoutId,
  onAddExercise,
  onUpdateExercise,
  onUpdateSet,
  onDeleteSet,
  onToggleSetComplete,
  onAddSet,
  onRestTimer,
  onDeleteExercise,
  onMoveExercise,
  onPRPress,
}: ExerciseListSectionProps) {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {isLoadingExercises ? (
        <Spinner style={{ marginTop: spacing['5xl'] }} />
      ) : exercises.length === 0 ? (
        <EmptyState
          title="No exercises yet"
          description="Add an exercise to begin"
          actionLabel="+ Add Exercise"
          onAction={onAddExercise}
        />
      ) : (
        exercises.map((ex, exIdx) => (
          <ExerciseLogCard
            key={ex.logExerciseId ?? `local-${exIdx}`}
            exerciseName={ex.exerciseName}
            trackingType={ex.trackingType}
            mode="active"
            sets={ex.sets}
            notes={ex.notes}
            showNotes={ex.showNotes}
            restTime={ex.restTime}
            onToggleNotes={() => onUpdateExercise(exIdx, { showNotes: !ex.showNotes })}
            onNotesChange={(text) => onUpdateExercise(exIdx, { notes: text })}
            onUpdateSet={(setIdx, data) => onUpdateSet(exIdx, setIdx, data)}
            onDeleteSet={(setIdx) => onDeleteSet(exIdx, setIdx)}
            onToggleSetComplete={(setIdx) => onToggleSetComplete(exIdx, setIdx)}
            onAddSet={() => onAddSet(exIdx)}
            onRestTimer={ex.restTime > 0 ? () => onRestTimer(ex.restTime) : undefined}
            onDeleteExercise={() => onDeleteExercise(exIdx)}
            onMoveUp={exIdx > 0 ? () => onMoveExercise(exIdx, 'up') : undefined}
            onMoveDown={exIdx < exercises.length - 1 ? () => onMoveExercise(exIdx, 'down') : undefined}
            onChangeExercise={() => {
              router.push({
                pathname: '/(app)/(workout)/exercise-picker',
                params: {
                  workoutId,
                  replaceLogExerciseId: String(ex.logExerciseId),
                  replaceOrder: String(exIdx + 1),
                },
              });
            }}
            onPRPress={(setIdx) => onPRPress(exIdx, setIdx)}
          />
        ))
      )}

      {exercises.length > 0 && (
        <Button
          title="+ Add Exercise"
          variant="ghost"
          onPress={onAddExercise}
          style={styles.addExerciseBtn}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  addExerciseBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
});
