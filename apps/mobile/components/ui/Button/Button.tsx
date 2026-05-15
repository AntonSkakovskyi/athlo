import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

const VARIANT_COLORS: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.primary, text: colors.black },
  secondary: { bg: colors.surfaceLight, text: colors.text },
  danger: { bg: colors.dangerLight, text: colors.danger },
  ghost: { bg: 'transparent', text: colors.textSecondary, border: colors.border },
};

export function Button({
  title,
  variant = 'primary',
  isLoading = false,
  disabled,
  style,
  icon,
  ...rest
}: ButtonProps) {
  const variantColors = VARIANT_COLORS[variant];
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      style={[
        styles.button,
        { backgroundColor: variantColors.bg },
        variantColors.border ? { borderWidth: 1, borderColor: variantColors.border } : undefined,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={variantColors.text} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: variantColors.text }, icon ? { marginLeft: spacing.xs } : undefined]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.md,
  },
  disabled: {
    opacity: 0.5,
  },
});
