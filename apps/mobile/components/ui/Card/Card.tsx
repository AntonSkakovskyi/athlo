import { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { borderRadius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface CardProps extends Omit<PressableProps, 'style'> {
  padding?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Card({ style, padding, children, onPress, ...rest }: CardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
  });
}
