import { useMemo } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import type { TextInputProps } from 'react-native';
import { borderRadius, fontSize, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface NumericInputProps extends Omit<TextInputProps, 'keyboardType' | 'style'> {
  wide?: boolean;
}

export function NumericInput({ wide = false, ...rest }: NumericInputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <TextInput
      style={[styles.input, wide && styles.inputWide]}
      keyboardType="numeric"
      placeholderTextColor={colors.textMuted}
      selectionColor={colors.primary}
      textAlign="center"
      {...rest}
    />
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    input: {
      flex: 1,
      backgroundColor: c.surfaceLight,
      borderRadius: borderRadius.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      fontSize: fontSize.md,
      color: c.text,
      textAlign: 'center',
      minWidth: 52,
    },
    inputWide: {
      flex: 2,
    },
  });
}
