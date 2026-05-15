import { View, StyleSheet } from 'react-native';
import { colors, borderRadius } from '@/constants/theme';

interface ProgressBarProps {
  progress: number; // 0..100
  color?: string;
  height?: number;
}

export function ProgressBar({ progress, color = colors.primary, height = 6 }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${clampedProgress}%`, backgroundColor: color, height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: borderRadius.full,
  },
});
