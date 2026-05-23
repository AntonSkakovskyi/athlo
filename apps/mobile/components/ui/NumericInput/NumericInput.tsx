import { useMemo, useState, useEffect, useRef } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import type { TextInputProps } from 'react-native';
import { borderRadius, fontSize, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface NumericInputProps extends Omit<TextInputProps, 'keyboardType' | 'style'> {
  wide?: boolean;
}

export function NumericInput({ wide = false, value, onChangeText, ...rest }: NumericInputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [localValue, setLocalValue] = useState(value ?? '');
  // Tracks what we last propagated up so we can distinguish user edits from external updates
  const lastPropagated = useRef(value ?? '');

  useEffect(() => {
    const incoming = value ?? '';
    // Only sync if value changed from something other than our own typing
    if (incoming !== lastPropagated.current) {
      lastPropagated.current = incoming;
      setLocalValue(incoming);
    }
  }, [value]);

  const handleChangeText = (text: string) => {
    lastPropagated.current = text;
    setLocalValue(text);
    onChangeText?.(text);
  };

  return (
    <TextInput
      style={[styles.input, wide && styles.inputWide]}
      keyboardType="numeric"
      placeholderTextColor={colors.textMuted}
      selectionColor={colors.primary}
      textAlign="center"
      selectTextOnFocus
      value={localValue}
      onChangeText={handleChangeText}
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
      minWidth: 52,
    },
    inputWide: {
      flex: 2,
    },
  });
}
