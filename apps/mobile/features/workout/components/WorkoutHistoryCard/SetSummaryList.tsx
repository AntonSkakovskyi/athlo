import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, fontSize, spacing, fontWeight } from '@/constants/theme';
import type { ExerciseSetSummary } from '@/features/workout/components/WorkoutHistoryCard/WorkoutHistoryCard';

interface SetSummaryListProps {
  sets: ExerciseSetSummary[];
  hasMore: boolean;
  onSeeMore?: () => void;
}

export function SetSummaryList({ sets, hasMore, onSeeMore }: SetSummaryListProps) {
  return (
    <View style={styles.exerciseList}>
      {sets.map((item, i) => (
        <View key={i} style={styles.exerciseRow}>
          <Text style={styles.exerciseName} numberOfLines={1}>{item.exerciseName}</Text>
          <Text style={styles.exerciseSets}>{item.setsCount} sets</Text>
        </View>
      ))}
      {hasMore && (
        <Pressable onPress={onSeeMore} style={styles.seeMoreWrap}>
          <Text style={styles.seeMore}>See more</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  exerciseList: {
    gap: spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseName: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  exerciseSets: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  seeMoreWrap: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  seeMore: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});
