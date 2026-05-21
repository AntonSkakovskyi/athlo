import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { IFrequentExercise } from '@athlo/shared';
import { borderRadius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Tag } from '@/components/ui/Tag/Tag';
import { Badge } from '@/components/ui/Badge/Badge';

interface ExerciseProgressListItemProps {
  exercise: IFrequentExercise;
  onPress: () => void;
}

export function ExerciseProgressListItem({ exercise, onPress }: ExerciseProgressListItemProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.topRow}>
        <Text style={styles.name} numberOfLines={1}>{exercise.exerciseName}</Text>
        {exercise.equipmentName && <Badge label={exercise.equipmentName} variant="default" size="sm" />}
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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 10,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
      flex: 1,
    },
    muscleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: spacing.sm,
    },
    stats: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: spacing.sm,
    },
  });
}
