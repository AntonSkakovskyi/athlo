import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const VARIANT_COLORS: Record<ButtonVariant, { bg: string; text: string }> = {
  primary: { bg: '#007AFF', text: '#fff' },
  secondary: { bg: '#E5E5EA', text: '#007AFF' },
  danger: { bg: '#FF3B30', text: '#fff' },
};

export function Button({
  title,
  variant = 'primary',
  isLoading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const colors = VARIANT_COLORS[variant];
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      style={[
        styles.button,
        { backgroundColor: colors.bg },
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={[styles.text, { color: colors.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
});
