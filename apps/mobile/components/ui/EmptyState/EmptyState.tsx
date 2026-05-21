import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: spacing['4xl'],
      paddingHorizontal: spacing['2xl'],
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: c.textSecondary,
      textAlign: 'center',
    },
    description: {
      fontSize: fontSize.md,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    button: {
      marginTop: spacing.lg,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      backgroundColor: c.primaryLight,
      borderRadius: borderRadius.md,
    },
    buttonText: {
      color: c.primary,
      fontWeight: fontWeight.semibold,
      fontSize: fontSize.md,
    },
  });
}
