import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Input } from '@/components/ui/Input/Input';
import type { IUnit } from '@athlo/shared';

interface ServingSizeSelectorProps {
  servingAmount: string;
  setServingAmount: (v: string) => void;
  servingUnitId: number;
  setServingUnitId: (v: number) => void;
  units: IUnit[];
}

export function ServingSizeSelector({
  servingAmount,
  setServingAmount,
  servingUnitId,
  setServingUnitId,
  units,
}: ServingSizeSelectorProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <>
      <Text style={styles.sectionTitle}>Serving Size</Text>
      <View style={styles.selectorContainer}>
        <View style={styles.amountInputSection}>
          <Text style={styles.inputLabel}>Amount</Text>
          <Input
            value={servingAmount}
            onChangeText={setServingAmount}
            keyboardType="numeric"
            placeholder="100"
            style={styles.amountInput}
          />
        </View>
        <View style={styles.unitSelectorSection}>
          <Text style={styles.inputLabel}>Unit</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.unitList}
          >
            {units.map((u) => (
              <Pressable
                key={u.id}
                style={[styles.unitChip, servingUnitId === u.id && styles.unitChipActive]}
                onPress={() => setServingUnitId(u.id)}
              >
                <Text style={[styles.unitChipText, servingUnitId === u.id && styles.unitChipTextActive]}>
                  {u.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.textSecondary,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    selectorContainer: {
      flexDirection: 'row',
      backgroundColor: c.surfaceLight,
      borderRadius: borderRadius.lg,
      padding: spacing.sm,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.md,
    },
    amountInputSection: {
      flex: 1,
    },
    unitSelectorSection: {
      flex: 2,
      borderLeftWidth: 1,
      borderLeftColor: c.border,
      paddingLeft: spacing.sm,
    },
    inputLabel: {
      fontSize: 10,
      fontWeight: fontWeight.bold,
      color: c.textMuted,
      textTransform: 'uppercase',
      marginBottom: 4,
      marginLeft: 4,
    },
    amountInput: {
      marginBottom: 0,
      height: 44,
      backgroundColor: 'transparent',
      borderWidth: 0,
      paddingHorizontal: 8,
      fontSize: fontSize.lg,
    },
    unitList: {
      gap: spacing.xs,
      paddingRight: spacing.lg,
      paddingVertical: 2,
    },
    unitChip: {
      height: 40,
      paddingHorizontal: spacing.md,
      backgroundColor: c.surface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 52,
    },
    unitChipActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
      elevation: 2,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    unitChipText: {
      fontSize: 12,
      color: c.textSecondary,
      fontWeight: fontWeight.medium,
    },
    unitChipTextActive: {
      color: c.black,
      fontWeight: 'bold',
    },
  });
}
