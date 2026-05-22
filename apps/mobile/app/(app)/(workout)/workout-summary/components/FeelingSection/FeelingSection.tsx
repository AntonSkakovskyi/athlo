import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { fontSize, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { FEELING_OPTIONS } from '@/utils/icons';

interface FeelingScectionProps {
  isEditing: boolean;
  localFeeling: number | null;
  workoutFeelingScore?: number | null;
  onFeelingChange: (value: number) => void;
}

export function FeelingSection({
  isEditing,
  localFeeling,
  workoutFeelingScore,
  onFeelingChange,
}: FeelingScectionProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.optionalItem}>
      <Text style={styles.optionalLabel}>Feeling</Text>
      {isEditing ? (
        <View style={styles.feelingRow}>
          {FEELING_OPTIONS.map((opt) => (
            <Pressable key={opt.value} onPress={() => onFeelingChange(opt.value)}>
              <Text style={[styles.emoji, localFeeling === opt.value && styles.selectedEmoji]}>
                {opt.emoji}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={styles.optionalValueLarge}>
          {FEELING_OPTIONS.find((o) => o.value === workoutFeelingScore)?.emoji ?? '😐'}
        </Text>
      )}
    </View>
  );
}

export default FeelingSection;

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    optionalItem: {
      alignItems: 'center',
      minWidth: 70,
      flex: 1,
    },
    optionalLabel: {
      fontSize: fontSize.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
    },
    optionalValueLarge: {
      fontSize: 24,
    },
    feelingRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    emoji: {
      fontSize: 20,
      opacity: 0.5,
    },
    selectedEmoji: {
      opacity: 1,
      transform: [{ scale: 1.2 }],
    },
  });
}
