import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface ProgressBarProps {
  progress: number; // 0..100
  color?: string;
  height?: number;
}

export function ProgressBar({ progress, color, height = 6 }: ProgressBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const fillColor = color ?? colors.primary;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${clampedProgress}%`, backgroundColor: fillColor, height }]} />
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    track: {
      backgroundColor: c.surfaceLight,
      borderRadius: borderRadius.full,
      overflow: 'hidden',
      width: '100%',
    },
    fill: {
      borderRadius: borderRadius.full,
    },
  });
}
