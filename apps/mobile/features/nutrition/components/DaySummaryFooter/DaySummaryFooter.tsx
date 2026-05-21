import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface DaySummaryFooterProps {
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

export function DaySummaryFooter({ calories, proteins, fats, carbs }: DaySummaryFooterProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Text style={styles.value}>{Math.round(calories)}</Text>
        <Text style={styles.label}>kcal</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.item}>
        <Text style={[styles.value, styles.proteinColor]}>{Math.round(proteins)}g</Text>
        <Text style={styles.label}>Protein</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.item}>
        <Text style={[styles.value, styles.fatColor]}>{Math.round(fats)}g</Text>
        <Text style={styles.label}>Fats</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.item}>
        <Text style={[styles.value, styles.carbColor]}>{Math.round(carbs)}g</Text>
        <Text style={styles.label}>Carbs</Text>
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    item: {
      alignItems: 'center',
    },
    value: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    label: {
      fontSize: fontSize.xs,
      color: c.textMuted,
      marginTop: 2,
    },
    separator: {
      width: 1,
      height: 28,
      backgroundColor: c.border,
    },
    proteinColor: {
      color: c.info,
    },
    fatColor: {
      color: c.warning,
    },
    carbColor: {
      color: c.primary,
    },
  });
}
