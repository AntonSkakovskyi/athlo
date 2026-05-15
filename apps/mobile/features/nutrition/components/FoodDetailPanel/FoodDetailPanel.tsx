import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { IFood } from '@athlo/shared';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';

interface FoodDetailPanelProps {
  selectedFood: IFood;
  amount: string;
  setAmount: (v: string) => void;
  unitId: number;
  setUnitId: (v: number) => void;
  calculatedMacros: { calories: number; proteins: number; fats: number; carbs: number } | null;
  onClose: () => void;
  onAdd: () => void;
  isPending: boolean;
  bottomPadding: number;
}

export function FoodDetailPanel({
  selectedFood,
  amount,
  setAmount,
  unitId,
  setUnitId,
  calculatedMacros,
  onClose,
  onAdd,
  isPending,
  bottomPadding,
}: FoodDetailPanelProps) {
  return (
    <View style={[styles.amountSheet, { paddingBottom: bottomPadding }]}>
      <View style={styles.amountSheetHeader}>
        <Text style={styles.amountFoodName} numberOfLines={1}>
          {selectedFood.name}
        </Text>
        <Pressable onPress={onClose}>
          <Text style={styles.amountClose}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.amountInputRow}>
        <View style={styles.amountInputWrap}>
          <Input
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.amountInput}
          />
        </View>
        <View style={styles.unitWrap}>
          <Text style={styles.unitLabel}>Unit</Text>
          <View style={styles.unitSelector}>
            <Pressable
              style={[styles.unitOption, unitId === 1 && styles.unitOptionActive]}
              onPress={() => setUnitId(1)}
            >
              <Text style={[styles.unitOptionText, unitId === 1 && styles.unitOptionTextActive]}>g</Text>
            </Pressable>
            <Pressable
              style={[styles.unitOption, unitId === 2 && styles.unitOptionActive]}
              onPress={() => setUnitId(2)}
            >
              <Text style={[styles.unitOptionText, unitId === 2 && styles.unitOptionTextActive]}>ml</Text>
            </Pressable>
            <Pressable
              style={[styles.unitOption, unitId === 3 && styles.unitOptionActive]}
              onPress={() => setUnitId(3)}
            >
              <Text style={[styles.unitOptionText, unitId === 3 && styles.unitOptionTextActive]}>pcs</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {calculatedMacros && (
        <View style={styles.macroPreview}>
          <View style={styles.macroPreviewItem}>
            <Text style={styles.macroPreviewValue}>{calculatedMacros.calories}</Text>
            <Text style={styles.macroPreviewLabel}>kcal</Text>
          </View>
          <View style={styles.macroPreviewItem}>
            <Text style={[styles.macroPreviewValue, { color: colors.info }]}>
              {calculatedMacros.proteins}g
            </Text>
            <Text style={styles.macroPreviewLabel}>Protein</Text>
          </View>
          <View style={styles.macroPreviewItem}>
            <Text style={[styles.macroPreviewValue, { color: colors.warning }]}>
              {calculatedMacros.fats}g
            </Text>
            <Text style={styles.macroPreviewLabel}>Fats</Text>
          </View>
          <View style={styles.macroPreviewItem}>
            <Text style={[styles.macroPreviewValue, { color: colors.success }]}>
              {calculatedMacros.carbs}g
            </Text>
            <Text style={styles.macroPreviewLabel}>Carbs</Text>
          </View>
        </View>
      )}

      <Button
        title="Add"
        variant="primary"
        onPress={onAdd}
        isLoading={isPending}
        disabled={!amount || parseFloat(amount) <= 0}
        style={styles.addFoodBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  amountSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  amountSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  amountFoodName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.md,
  },
  amountClose: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
  },
  amountInputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  amountInputWrap: {
    flex: 1,
  },
  amountInput: {
    marginBottom: 0,
  },
  unitWrap: {
    width: 120,
  },
  unitLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
    color: colors.textSecondary,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  unitOption: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  unitOptionActive: {
    backgroundColor: colors.primary,
  },
  unitOptionText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  unitOptionTextActive: {
    color: colors.black,
    fontWeight: fontWeight.bold,
  },
  macroPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  macroPreviewItem: {
    alignItems: 'center',
  },
  macroPreviewValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  macroPreviewLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  addFoodBtn: {
    marginTop: spacing.md,
  },
});
