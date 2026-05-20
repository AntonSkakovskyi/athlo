import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { confirmDestructive } from '@/utils/alerts';
import type { IFood, IUnit } from '@athlo/shared';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { MacroBreakdown } from './MacroBreakdown/MacroBreakdown';

interface FoodDetailPanelProps {
  selectedFood: IFood;
  amount: string;
  setAmount: (v: string) => void;
  unitId: number;
  setUnitId: (v: number) => void;
  calculatedMacros: { calories: number; proteins: number; fats: number; carbs: number } | null;
  onClose: () => void;
  onAdd: () => void;
  onDelete?: () => void;
  isCreator?: boolean;
  isPending: boolean;
  isDeleting?: boolean;
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
  onDelete,
  isCreator,
  isPending,
  isDeleting,
  bottomPadding,
}: FoodDetailPanelProps) {
  const handleDelete = () => {
    if (onDelete) confirmDestructive('Delete Food', 'Are you sure you want to delete this food item? This action cannot be undone.', onDelete);
  };

  const foodUnits = selectedFood.units ?? [];

  return (
    <View style={[styles.amountSheet, { paddingBottom: bottomPadding }]}>
      <View style={styles.amountSheetHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.amountFoodName} numberOfLines={1}>
            {selectedFood.name}
          </Text>
          {isCreator && (
            <Pressable onPress={handleDelete} style={styles.deleteBtn} disabled={isDeleting}>
              <Text style={styles.deleteBtnText}>{isDeleting ? '...' : 'Delete'}</Text>
            </Pressable>
          )}
        </View>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.amountClose}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.selectorContainer}>
        <View style={styles.amountInputSection}>
          <Text style={styles.inputLabel}>Amount</Text>
          <Input
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.amountInput}
            placeholder="100"
          />
        </View>
        
        <View style={styles.unitSelectorSection}>
          <Text style={styles.inputLabel}>Unit</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.unitList}
            decelerationRate="fast"
          >
            {foodUnits.length > 0 ? (
              foodUnits.map((u) => (
                <Pressable
                  key={u.unitId}
                  style={[styles.unitChip, unitId === u.unitId && styles.unitChipActive]}
                  onPress={() => setUnitId(u.unitId)}
                >
                  <Text style={[styles.unitChipText, unitId === u.unitId && styles.unitChipTextActive]}>
                    {u.unit?.name ?? String(u.unitId)}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Pressable
                style={[styles.unitChip, unitId === 1 && styles.unitChipActive]}
                onPress={() => setUnitId(1)}
              >
                <Text style={[styles.unitChipText, unitId === 1 && styles.unitChipTextActive]}>g</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>

      {calculatedMacros && (
        <MacroBreakdown
          calories={calculatedMacros.calories}
          proteins={calculatedMacros.proteins}
          fats={calculatedMacros.fats}
          carbs={calculatedMacros.carbs}
        />
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  amountFoodName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    maxWidth: '70%',
  },
  deleteBtn: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteBtnText: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  amountClose: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountInputSection: {
    flex: 1,
  },
  unitSelectorSection: {
    flex: 2,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: spacing.sm,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
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
    paddingVertical: 2,
  },
  unitChip: {
    height: 40,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  unitChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  unitChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  unitChipTextActive: {
    color: colors.black,
    fontWeight: fontWeight.bold,
  },
  addFoodBtn: {
    marginTop: spacing.md,
  },
});
