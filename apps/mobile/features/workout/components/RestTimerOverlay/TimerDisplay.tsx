import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface TimerDisplayProps {
  remaining: number;
  formatTime: (s: number) => string;
}

export function TimerDisplay({ remaining, formatTime }: TimerDisplayProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.timerCircle}>
      <Text style={styles.timerText}>{formatTime(remaining)}</Text>
      {remaining === 0 && <Text style={styles.doneText}>Done!</Text>}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    timerCircle: {
      width: 180,
      height: 180,
      borderRadius: borderRadius.full,
      borderWidth: 4,
      borderColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing['2xl'],
    },
    timerText: {
      fontSize: 48,
      fontWeight: fontWeight.bold,
      color: c.text,
      fontVariant: ['tabular-nums'],
    },
    doneText: {
      fontSize: fontSize.md,
      color: c.primary,
      fontWeight: fontWeight.semibold,
      marginTop: spacing.xs,
    },
  });
}
