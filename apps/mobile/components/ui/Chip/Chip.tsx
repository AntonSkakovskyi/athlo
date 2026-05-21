import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface ChipProps {
  label: string;
  active?: boolean;
  borderRadius?: number;
  onPress?: () => void;
}

export function Chip({ label, active = false, borderRadius, onPress }: ChipProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive, { borderRadius }]}
      onPress={onPress}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      marginRight: spacing.sm,
    },
    chipActive: {
      borderColor: c.primary,
      backgroundColor: c.primaryLight,
    },
    label: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
    },
    labelActive: {
      color: c.primary,
      fontWeight: fontWeight.semibold,
    },
  });
}
