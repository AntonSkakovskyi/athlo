import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet/BottomSheet';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { calcItemMacrosByUnit, type NutritionFactLike } from '@/features/nutrition/utils/macros';
import { useToast } from '@/contexts/ToastContext';
import { validateFields, required, minNumber } from '@/utils/validation';

interface MealItemDisplay {
  id: number;
  amount: number;
  unitId: number;
  food?: {
    id: number;
    name: string;
    brand?: string | null;
    units?: NutritionFactLike[];
  };
  unit?: { id: number; name: string };
}

interface MealItemActionSheetProps {
  visible: boolean;
  onClose: () => void;
  item: MealItemDisplay | null;
  onUpdate: (amount: number, unitId: number) => Promise<void> | void;
  onDelete: () => void;
  onSwap: () => void;
  isUpdating?: boolean;
}

export function MealItemActionSheet({
  visible,
  onClose,
  item,
  onUpdate,
  onDelete,
  onSwap,
  isUpdating,
}: MealItemActionSheetProps) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [amount, setAmount] = useState('');
  const [unitId, setUnitId] = useState<number>(1);

  useEffect(() => {
    if (item) {
      setAmount(String(item.amount));
      setUnitId(item.unitId);
    }
  }, [item, visible]);

  const calculatedMacros = useMemo(() => {
    if (!item?.food?.units?.length) return null;
    const numericAmount = parseFloat(amount) || 0;
    const macros = calcItemMacrosByUnit(item.food.units, unitId, numericAmount);
    return {
      calories: Math.round(macros.calories),
      proteins: Math.round(macros.proteins * 10) / 10,
      fats: Math.round(macros.fats * 10) / 10,
      carbs: Math.round(macros.carbs * 10) / 10,
    };
  }, [item, amount, unitId]);

  const hasChanges = item ? parseFloat(amount) !== item.amount || unitId !== item.unitId : false;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {item && (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.foodName}>{item.food?.name}</Text>
            <Text style={styles.brandName}>{item.food?.brand || 'Generic'}</Text>
          </View>

          {calculatedMacros && (
            <View style={styles.macroRow}>
              <MacroBox label="kcal" value={calculatedMacros.calories} color={colors.text} />
              <MacroBox label="Protein" value={calculatedMacros.proteins} color={colors.info} />
              <MacroBox label="Fats" value={calculatedMacros.fats} color={colors.warning} />
              <MacroBox label="Carbs" value={calculatedMacros.carbs} color={colors.success} />
            </View>
          )}

          <View style={styles.inputSection}>
            <View style={styles.inputWrap}>
              <Input
                label="Amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.unitWrap}>
              <Text style={styles.unitLabel}>Unit</Text>
              <View style={styles.unitSelector}>
                <View style={[styles.unitBadge, styles.unitBadgeActive]}>
                  <Text style={styles.unitTextActive}>{item.unit?.name || 'g'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Save Changes"
              onPress={() => {
                const error = validateFields([
                  { value: amount, rules: [required('Amount'), minNumber('Amount', 0.01)] },
                ]);
                if (error) { showToast({ title: error, variant: 'error' }); return; }
                onUpdate(parseFloat(amount), unitId);
              }}
              isLoading={isUpdating}
              disabled={!hasChanges || !amount || parseFloat(amount) <= 0}
              style={styles.saveBtn}
            />

            <View style={styles.secondaryActions}>
              <Pressable style={styles.actionItem} onPress={onSwap}>
                <Text style={styles.actionIcon}>🔄</Text>
                <Text style={styles.actionText}>Change Product</Text>
              </Pressable>

              <Pressable style={[styles.actionItem, styles.deleteItem]} onPress={onDelete}>
                <Text style={[styles.actionIcon, { color: colors.danger }]}>🗑️</Text>
                <Text style={[styles.actionText, { color: colors.danger }]}>Delete from Meal</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </BottomSheet>
  );
}

function MacroBox({ label, value, color }: { label: string; value: number; color: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.macroBox}>
      <Text style={[styles.macroValue, { color }]}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      paddingBottom: spacing.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    foodName: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: c.text,
      textAlign: 'center',
    },
    brandName: {
      fontSize: fontSize.sm,
      color: c.textMuted,
      marginTop: 4,
    },
    macroRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: c.surfaceLight,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      marginBottom: spacing.xl,
    },
    macroBox: {
      alignItems: 'center',
    },
    macroValue: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
    },
    macroLabel: {
      fontSize: fontSize.xs,
      color: c.textMuted,
      marginTop: 2,
    },
    inputSection: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    inputWrap: {
      flex: 1,
    },
    unitWrap: {
      width: 100,
    },
    unitLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: c.textSecondary,
      marginBottom: spacing.xs,
    },
    unitSelector: {
      height: 48,
      justifyContent: 'center',
    },
    unitBadge: {
      backgroundColor: c.surfaceLight,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    unitBadgeActive: {
      backgroundColor: c.primaryLight,
      borderWidth: 1,
      borderColor: c.primary,
    },
    unitTextActive: {
      color: c.primary,
      fontWeight: fontWeight.bold,
      fontSize: fontSize.md,
    },
    actions: {
      gap: spacing.lg,
    },
    saveBtn: {
      width: '100%',
    },
    secondaryActions: {
      gap: spacing.xs,
    },
    actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: c.surfaceLight,
      gap: spacing.md,
    },
    deleteItem: {
      marginTop: spacing.sm,
      backgroundColor: c.dangerLight,
    },
    actionIcon: {
      fontSize: 20,
    },
    actionText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.medium,
      color: c.text,
    },
  });
}
