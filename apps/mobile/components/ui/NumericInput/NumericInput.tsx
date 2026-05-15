import { TextInput, StyleSheet } from 'react-native';
import type { TextInputProps } from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '@/constants/theme';

interface NumericInputProps extends Omit<TextInputProps, 'keyboardType' | 'style'> {
  wide?: boolean;
}

export function NumericInput({ wide = false, ...rest }: NumericInputProps) {
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

const styles = StyleSheet.create({
  input: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
    minWidth: 52,
  },
  inputWide: {
    flex: 2,
  },
});
