import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';

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

        <View style={styles.createForm}>
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
          <Text style={styles.createSectionTitle}>Nutrition per 100g</Text>
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
            disabled={!newFoodName.trim() || !newFoodCalories}
            style={styles.createSaveBtn}
          />
        </View>
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
    marginBottom: spacing['2xl'],
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
  macroInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  macroInputCol: {
    flex: 1,
  },
  createSaveBtn: {
    marginTop: spacing.lg,
  },
});
