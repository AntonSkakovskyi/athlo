import { View, StyleSheet, Pressable } from 'react-native';
import type { ViewProps, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '@/constants/theme';

interface CardProps extends Omit<PressableProps, 'style'> {
  padding?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Card({ style, padding, children, onPress, ...rest }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        style={[styles.card, padding !== undefined ? { padding } : undefined, style] as any}
        onPress={onPress}
        {...rest}
      >
        {children as any}
      </Pressable>
    );
  }

  return (
    <View
      style={[styles.card, padding !== undefined ? { padding } : undefined, style]}
      {...rest}
    >
      {children as React.ReactNode}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
