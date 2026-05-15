import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { TemplateExerciseWithRelations } from '@/features/workout/types';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';

interface TemplateExerciseListProps {
  item: TemplateExerciseWithRelations;
  onDeleteExercise: (id: number) => void;
}

export function TemplateExerciseList({ item, onDeleteExercise }: TemplateExerciseListProps) {
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>
            {item.exercise?.name ?? `Exercise #${item.order}`}
          </Text>
          {item.exercise?.equipment?.name && (
            <Text style={styles.equipmentTag}>{item.exercise.equipment.name}</Text>
          )}
        </View>
        <View style={styles.exerciseActions}>
          <Text style={styles.setsCount}>{item.templateSets?.length ?? 0} sets</Text>
          <Pressable onPress={() => onDeleteExercise(item.id)}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </Pressable>
        </View>
      </View>

      {item.restTime != null && item.restTime > 0 && (
        <Text style={styles.restTime}>⏱️ Rest: {item.restTime}s</Text>
      )}

      {item.templateSets
        ?.sort((a, b) => a.order - b.order)
        .map((set) => (
          <View key={set.id} style={styles.setRow}>
            <Text style={styles.setNum}>Set {set.order}</Text>
            {(set.weight ?? 0) > 0 && <Text style={styles.setValue}>{set.weight} kg</Text>}
            {(set.reps ?? 0) > 0 && <Text style={styles.setValue}>× {set.reps}</Text>}
            {(set.duration ?? 0) > 0 && <Text style={styles.setValue}>{set.duration}s</Text>}
            {(set.distance ?? 0) > 0 && <Text style={styles.setValue}>{set.distance}m</Text>}
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  equipmentTag: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  setsCount: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  deleteIcon: {
    fontSize: fontSize.xl,
  },
  restTime: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  setNum: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    width: 48,
  },
  setValue: {
    fontSize: fontSize.md,
    color: colors.text,
  },
});
