import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { IFrequentExercise } from '@athlo/shared';
import { colors, borderRadius, spacing } from '@/constants/theme';
import { Tag } from '@/components/ui/Tag/Tag';

interface ExerciseProgressListItemProps {
  exercise: IFrequentExercise;
  onPress: () => void;
}

export function ExerciseProgressListItem({ exercise, onPress }: ExerciseProgressListItemProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.topRow}>
        <Text style={styles.name} numberOfLines={1}>{exercise.exerciseName}</Text>
        {exercise.equipmentName && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{exercise.equipmentName}</Text>
          </View>
        )}
      </View>

      {exercise.primaryMuscles.length > 0 && (
        <View style={styles.muscleRow}>
          {exercise.primaryMuscles.slice(0, 3).map((m) => (
            <Tag key={m} label={m} />
          ))}
        </View>
      )}

      <Text style={styles.stats}>
        {exercise.totalSets} sets · {exercise.totalWorkouts} workouts
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  badgeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  stats: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
  },
});
