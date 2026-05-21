import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { borderRadius, fontSize, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface MetricCardProps {
  icon?: string;
  value: string;
  label: string;
  size?: 'sm' | 'md';
  highlighted?: boolean;
}

export function MetricCard({ icon, value, label, size = 'md', highlighted = false }: MetricCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.card, size === 'sm' && styles.cardSm, highlighted && styles.cardHighlighted]}>
      {icon && <Text style={[styles.icon, size === 'sm' && styles.iconSm]}>{icon}</Text>}
      <Text style={[styles.value, size === 'sm' && styles.valueSm]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    cardSm: {
      padding: spacing.md,
      minWidth: 'auto',
    },
    cardHighlighted: {
      borderColor: c.primary,
      backgroundColor: c.primaryLight,
    },
    icon: {
      fontSize: 24,
      marginBottom: 6,
    },
    iconSm: {
      fontSize: 18,
      marginBottom: spacing.xs,
    },
    value: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: c.text,
    },
    valueSm: {
      fontSize: fontSize.md,
    },
    label: {
      fontSize: fontSize.xs,
      color: c.textMuted,
      marginTop: spacing.xxs,
      textTransform: 'uppercase',
    },
  });
}
