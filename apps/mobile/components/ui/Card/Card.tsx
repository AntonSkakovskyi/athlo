import { View, StyleSheet } from 'react-native';
import type { ViewProps } from 'react-native';
import { colors, borderRadius, spacing } from '@/constants/theme';

interface CardProps extends ViewProps {
  padding?: number;
}

export function Card({ style, padding, children, ...rest }: CardProps) {
  return (
    <View
      style={[styles.card, padding !== undefined ? { padding } : undefined, style]}
      {...rest}
    >
      {children}
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
