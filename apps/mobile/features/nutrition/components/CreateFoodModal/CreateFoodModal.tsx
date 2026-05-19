import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import type { IUnit } from '@athlo/shared';

interface CreateFoodModalProps {
  visible: boolean;
  onClose: () => void;
  newFoodName: string;
  setNewFoodName: (v: string) => void;
  newFoodBrand: string;
  setNewFoodBrand: (v: string) => void;
  newFoodCalories: string;
  setNewFoodCalories: (v: string) => void;
  newFoodProteins: string;
  setNewFoodProteins: (v: string) => void;
  newFoodFats: string;
  setNewFoodFats: (v: string) => void;
  newFoodCarbs: string;
  setNewFoodCarbs: (v: string) => void;
  newFoodServingAmount: string;
  setNewFoodServingAmount: (v: string) => void;
  newFoodServingUnitId: number;
  setNewFoodServingUnitId: (v: number) => void;
  units?: IUnit[];
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
  topPadding: number;
}

export function CreateFoodModal({
  visible,
  onClose,
  newFoodName,
  setNewFoodName,
  newFoodBrand,
  setNewFoodBrand,
  newFoodCalories,
  setNewFoodCalories,
  newFoodProteins,
  setNewFoodProteins,
  newFoodFats,
  setNewFoodFats,
  newFoodCarbs,
  setNewFoodCarbs,
  newFoodServingAmount,
  setNewFoodServingAmount,
  newFoodServingUnitId,
  setNewFoodServingUnitId,
  units = [],
  onSave,
  onCancel,
  isPending,
  topPadding,
}: CreateFoodModalProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.createContainer, { paddingTop: topPadding }]}>
        <View style={styles.createHeader}>
          <Pressable onPress={onCancel}>
            <Text style={styles.cancelBtn}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Create Food</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.createForm} showsVerticalScrollIndicator={false}>
          <Input
            label="Name"
            value={newFoodName}
            onChangeText={setNewFoodName}
            placeholder="e.g. Chicken Breast"
          />
          <Input
            label="Brand (optional)"
            value={newFoodBrand}
            onChangeText={setNewFoodBrand}
            placeholder="e.g. Organic Farm"
          />
          
          <Text style={styles.createSectionTitle}>Serving Size</Text>
          <View style={styles.selectorContainer}>
            <View style={styles.amountInputSection}>
              <Text style={styles.inputLabel}>Amount</Text>
              <Input
                value={newFoodServingAmount}
                onChangeText={setNewFoodServingAmount}
                keyboardType="numeric"
                placeholder="100"
                style={styles.amountInput}
              />
            </View>
            <View style={styles.unitSelectorSection}>
              <Text style={styles.inputLabel}>Unit</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitList}>
                {units.map((u) => (
                  <Pressable
                    key={u.id}
                    style={[styles.unitChip, newFoodServingUnitId === u.id && styles.unitChipActive]}
                    onPress={() => setNewFoodServingUnitId(u.id)}
                  >
                    <Text style={[styles.unitChipText, newFoodServingUnitId === u.id && styles.unitChipTextActive]}>
                      {u.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          <Text style={styles.createSectionTitle}>Nutrition for above serving</Text>
          <Input
            label="Calories (kcal)"
            value={newFoodCalories}
            onChangeText={setNewFoodCalories}
            keyboardType="numeric"
            placeholder="0"
          />
          <View style={styles.macroInputRow}>
            <View style={styles.macroInputCol}>
              <Input
                label="Protein (g)"
                value={newFoodProteins}
                onChangeText={setNewFoodProteins}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.macroInputCol}>
              <Input
                label="Fats (g)"
                value={newFoodFats}
                onChangeText={setNewFoodFats}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.macroInputCol}>
              <Input
                label="Carbs (g)"
                value={newFoodCarbs}
                onChangeText={setNewFoodCarbs}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>

          <Button
            title="Save & Add"
            variant="primary"
            onPress={onSave}
            isLoading={isPending}
            disabled={!newFoodName.trim() || !newFoodCalories || !newFoodServingAmount}
            style={styles.createSaveBtn}
          />
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  createContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  createHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  cancelBtn: {
    fontSize: fontSize.md,
    color: colors.danger,
    fontWeight: fontWeight.semibold,
    width: 60,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: {
    width: 60,
  },
  createForm: {
    paddingHorizontal: spacing.lg,
  },
  createSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
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
  macroInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  macroInputCol: {
    flex: 1,
  },
  unitList: {
    gap: spacing.xs,
    paddingRight: spacing.lg,
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
    minWidth: 52,
  },
  unitChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  unitChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  unitChipTextActive: {
    color: colors.black,
    fontWeight: 'bold',
  },
  createSaveBtn: {
    marginTop: spacing.lg,
  },
});
