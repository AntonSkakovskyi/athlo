import { useMemo } from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import type { IMealType } from '@athlo/shared';

interface MealTypeChipsProps {
  mealTypes: IMealType[];
  selectedTypeId: number | null;
  onSelectType: (id: number) => void;
}

export function MealTypeChips({ mealTypes, selectedTypeId, onSelectType }: MealTypeChipsProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <>
      <Text style={styles.label}>Meal Type</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeRow}
      >
        {mealTypes.map((type) => (
          <Pressable
            key={type.id}
            style={[styles.typeChip, selectedTypeId === type.id && styles.typeChipActive]}
            onPress={() => onSelectType(type.id)}
          >
            <Text style={[styles.typeChipText, selectedTypeId === type.id && styles.typeChipTextActive]}>
              {type.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: c.textSecondary,
      marginBottom: spacing.sm,
    },
    typeRow: {
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    typeChip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      backgroundColor: c.surfaceLight,
      borderWidth: 1,
      borderColor: c.border,
    },
    typeChipActive: {
      backgroundColor: c.primaryLight,
      borderColor: c.primary,
    },
    typeChipText: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
    },
    typeChipTextActive: {
      color: c.primary,
      fontWeight: fontWeight.semibold,
    },
  });
}
