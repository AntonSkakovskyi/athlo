import { useMemo, useState, useEffect, useRef } from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import type { TextInputProps } from 'react-native';
import { borderRadius, fontSize, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface NumericInputProps extends Omit<TextInputProps, 'keyboardType' | 'style'> {
  wide?: boolean;
  error?: string;
}

export function NumericInput({ wide = false, error, value, onChangeText, ...rest }: NumericInputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [localValue, setLocalValue] = useState(value ?? '');
  const lastPropagated = useRef(value ?? '');

  useEffect(() => {
    const incoming = value ?? '';
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
    <View style={styles.container}>
      <TextInput
        style={[styles.input, wide && styles.inputWide, error && styles.inputError]}
        keyboardType="numeric"
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        textAlign="center"
        selectTextOnFocus
        value={localValue}
        onChangeText={handleChangeText}
        {...rest}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      width: '100%',
    },
    input: {
      backgroundColor: c.surfaceLight,
      borderRadius: borderRadius.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      fontSize: fontSize.md,
      color: c.text,
      minWidth: 52,
      width: '100%',
    },
    inputWide: {
      minWidth: 80,
    },
    inputError: {
      borderWidth: 1,
      borderColor: c.danger,
    },
    errorText: {
      fontSize: fontSize.sm,
      color: c.danger,
      marginTop: spacing.xs,
    },
  });
}
