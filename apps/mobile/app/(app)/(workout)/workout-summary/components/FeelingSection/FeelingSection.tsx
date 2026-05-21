import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, fontSize } from '@/constants/theme';
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

const styles = StyleSheet.create({
  optionalItem: {
    alignItems: 'center',
    minWidth: 70,
    flex: 1,
  },
  optionalLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  optionalValueLarge: {
    fontSize: 24,
  },
  feelingRow: {
    flexDirection: 'row',
    gap: 8,
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
