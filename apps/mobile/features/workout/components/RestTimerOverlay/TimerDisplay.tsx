import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

interface TimerDisplayProps {
  remaining: number;
  formatTime: (s: number) => string;
}

export function TimerDisplay({ remaining, formatTime }: TimerDisplayProps) {
  return (
    <View style={styles.timerCircle}>
      <Text style={styles.timerText}>{formatTime(remaining)}</Text>
      {remaining === 0 && <Text style={styles.doneText}>Done!</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  timerCircle: {
    width: 180,
    height: 180,
    borderRadius: borderRadius.full,
    borderWidth: 4,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  timerText: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  doneText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xs,
  },
});
