import { useMemo, useState } from 'react';
import { TextInput as RNTextInput, StyleSheet, Text, View, Pressable } from 'react-native';
import type { TextInputProps as RNTextInputProps, ViewStyle, StyleProp } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({ label, error, style, secureTextEntry, containerStyle, ...rest }: InputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [hidden, setHidden] = useState(true);

  const isPassword = secureTextEntry === true;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        <RNTextInput
          style={[styles.input, isPassword && styles.inputPassword, error && styles.inputError, style]}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          secureTextEntry={isPassword && hidden}
          autoCapitalize={isPassword ? 'none' : rest.autoCapitalize}
          autoCorrect={isPassword ? false : rest.autoCorrect}
          {...rest}
        />
        {isPassword && (
          <Pressable style={styles.eyeBtn} onPress={() => setHidden((v) => !v)} hitSlop={8}>
            <Text style={styles.eyeIcon}>{hidden ? '👁' : '🙈'}</Text>
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    wrapper: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.medium,
      marginBottom: spacing.xs,
      color: c.textSecondary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSize.lg,
      color: c.text,
      backgroundColor: c.surface,
    },
    inputPassword: {
      paddingRight: 44,
    },
    inputError: {
      borderColor: c.danger,
    },
    eyeBtn: {
      position: 'absolute',
      right: spacing.md,
      padding: spacing.xs,
    },
    eyeIcon: {
      fontSize: fontSize.xl,
    },
    errorText: {
      fontSize: fontSize.sm,
      color: c.danger,
      marginTop: spacing.xs,
    },
  });
}
