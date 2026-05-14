import { useState } from 'react';
import { TextInput as RNTextInput, StyleSheet, Text, View, Pressable } from 'react-native';
import type { TextInputProps as RNTextInputProps } from 'react-native';
import { colors, borderRadius } from '../../constants/theme';

interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, secureTextEntry, ...rest }: InputProps) {
  const [hidden, setHidden] = useState(true);

  const isPassword = secureTextEntry === true;

  return (
    <View style={styles.wrapper}>
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

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputPassword: {
    paddingRight: 44,
  },
  inputError: {
    borderColor: colors.danger,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
});
