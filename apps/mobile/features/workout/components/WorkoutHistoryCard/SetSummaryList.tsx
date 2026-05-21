import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { fontSize, spacing, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import type { ExerciseSetSummary } from '@/features/workout/components/WorkoutHistoryCard/WorkoutHistoryCard';

interface SetSummaryListProps {
  sets: ExerciseSetSummary[];
  hasMore: boolean;
  onSeeMore?: () => void;
}

export function SetSummaryList({ sets, hasMore, onSeeMore }: SetSummaryListProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
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
      color: c.text,
      flex: 1,
      marginRight: spacing.sm,
    },
    exerciseSets: {
      fontSize: fontSize.xs,
      color: c.textMuted,
      fontWeight: fontWeight.medium,
    },
    seeMoreWrap: {
      alignItems: 'center',
      paddingTop: spacing.xs,
    },
    seeMore: {
      fontSize: fontSize.sm,
      color: c.primary,
      fontWeight: fontWeight.semibold,
    },
  });
}
