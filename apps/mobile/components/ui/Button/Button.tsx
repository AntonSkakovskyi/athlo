import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'ghost-primary' | 'outline';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

function makeVariantColors(
  c: ColorPalette,
): Record<ButtonVariant, { bg: string; text: string; border?: string }> {
  return {
    primary: { bg: c.primary, text: c.black },
    secondary: { bg: c.surfaceLight, text: c.text },
    danger: { bg: c.dangerLight, text: c.danger },
    ghost: { bg: 'transparent', text: c.textSecondary },
    'ghost-primary': { bg: 'transparent', text: c.primary },
    outline: { bg: 'transparent', text: c.primary, border: c.primary },
  };
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  style,
  icon,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const variantColors = makeVariantColors(colors)[variant];
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
          <Text style={[styles.text, size === 'sm' && styles.textSm, { color: variantColors.text }, icon ? { marginLeft: spacing.xs } : undefined]}>{title}</Text>
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
  textSm: {
    fontSize: fontSize.sm,
  },
  disabled: {
    opacity: 0.5,
  },
});
