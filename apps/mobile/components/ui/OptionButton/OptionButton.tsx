import { useMemo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface OptionButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function OptionButton({ label, active, onPress, style }: OptionButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      style={[styles.option, active && styles.optionActive, style]}
      onPress={onPress}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    option: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      backgroundColor: c.surfaceLight,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionActive: {
      backgroundColor: c.primaryLight,
      borderColor: c.primary,
    },
    label: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.textSecondary,
    },
    labelActive: {
      color: c.primary,
    },
  });
}
