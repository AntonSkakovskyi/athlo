import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import type { IFood, INutritionFact, IUnit } from '@athlo/shared';
import type { NutritionFactData } from '@/hooks/api/useFoodAPI';
import { ServingSizeSelector } from '../CreateFoodModal/ServingSizeSelector/ServingSizeSelector';
import { Ionicons } from '@expo/vector-icons';

interface EditFoodModalProps {
  visible: boolean;
  food: IFood;
  units: IUnit[];
  onClose: () => void;
  onSave: (name: string, brand: string, newUnit: NutritionFactData | null) => void;
  onDeleteUnit: (unitId: number) => Promise<void>;
  isPending: boolean;
  isDeletingUnit: boolean;
  topPadding: number;
}

type FormMode = 'add' | 'edit';

export function EditFoodModal({
  visible,
  food,
  units,
  onClose,
  onSave,
  onDeleteUnit,
  isPending,
  isDeletingUnit,
  topPadding,
}: EditFoodModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');

  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [formAmount, setFormAmount] = useState('100');
  const [formUnitId, setFormUnitId] = useState(units[0]?.id ?? 1);
  const [formCalories, setFormCalories] = useState('');
  const [formProteins, setFormProteins] = useState('');
  const [formFats, setFormFats] = useState('');
  const [formCarbs, setFormCarbs] = useState('');

  useEffect(() => {
    if (visible) {
      setName(food.name);
      setBrand(food.brand || '');
      resetForm();
    }
  }, [visible, food.id]);

  const resetForm = () => {
    setFormMode(null);
    setEditingUnitId(null);
    setFormAmount('100');
    setFormUnitId(units[0]?.id ?? 1);
    setFormCalories('');
    setFormProteins('');
    setFormFats('');
    setFormCarbs('');
  };

  const handleUnitChange = (unitId: number) => {
    setFormUnitId(unitId);
    const unit = units.find(u => u.id === unitId);
    const unitName = unit?.name?.toLowerCase() ?? '';
    setFormAmount(['g', 'ml'].includes(unitName) ? '100' : '1');
  };

  const handleEditUnit = (fact: INutritionFact) => {
    setFormMode('edit');
    setEditingUnitId(fact.unitId);
    setFormUnitId(fact.unitId);
    setFormAmount(String(Number(fact.amount)));
    setFormCalories(String(Number(fact.calories)));
    setFormProteins(String(Number(fact.proteins)));
    setFormFats(String(Number(fact.fats)));
    setFormCarbs(String(Number(fact.carbs)));
  };

  const handleAddNew = () => {
    setFormMode('add');
    setEditingUnitId(null);
    setFormAmount('100');
    setFormUnitId(units[0]?.id ?? 1);
    setFormCalories('');
    setFormProteins('');
    setFormFats('');
    setFormCarbs('');
  };

  const handleSaveUnit = () => {
    const unit: NutritionFactData | null =
      parseFloat(formAmount) > 0
        ? {
            unitId: formUnitId,
            amount: parseFloat(formAmount),
            calories: parseFloat(formCalories) || 0,
            proteins: parseFloat(formProteins) || 0,
            fats: parseFloat(formFats) || 0,
            carbs: parseFloat(formCarbs) || 0,
          }
        : null;
    onSave(name.trim(), brand.trim(), unit);
  };

  const handleSaveNameBrand = () => {
    onSave(name.trim(), brand.trim(), null);
  };

  const existingUnits = food.units ?? [];
  const showForm = formMode !== null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.cancelBtn}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Edit Food</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Chicken Breast" />
          <Input label="Brand (optional)" value={brand} onChangeText={setBrand} placeholder="e.g. Organic Farm" />

          <Button
            title="Save Name & Brand"
            variant="secondary"
            onPress={handleSaveNameBrand}
            isLoading={isPending && !showForm}
            disabled={!name.trim()}
            style={styles.saveNameBtn}
          />

          {existingUnits.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Existing Servings</Text>
              {existingUnits.map((u) => (
                <View
                  key={u.unitId}
                  style={[
                    styles.existingUnitRow,
                    editingUnitId === u.unitId && styles.existingUnitRowActive,
                  ]}
                >
                  <View style={styles.existingUnitInfo}>
                    <Text style={styles.existingUnitName}>
                      {u.unit?.name ?? String(u.unitId)} · {Number(u.amount)}
                    </Text>
                    <Text style={styles.existingUnitMacros}>
                      {Math.round(Number(u.calories))} kcal · P {Number(u.proteins)}g · F {Number(u.fats)}g · C {Number(u.carbs)}g
                    </Text>
                  </View>
                  <View style={styles.unitActions}>
                    <Pressable
                      style={styles.unitActionBtn}
                      onPress={() => handleEditUnit(u)}
                      hitSlop={8}
                    >
                      <Ionicons name="pencil-outline" size={18} color={colors.primary} />
                    </Pressable>
                    <Pressable
                      style={styles.unitActionBtn}
                      onPress={() => onDeleteUnit(u.unitId)}
                      hitSlop={8}
                      disabled={isDeletingUnit}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          )}

          <Pressable
            style={styles.addUnitToggle}
            onPress={formMode === 'add' ? resetForm : handleAddNew}
          >
            <Text style={styles.addUnitToggleText}>
              {formMode === 'add' ? '− Cancel New Serving' : '+ Add New Serving'}
            </Text>
          </Pressable>

          {showForm && (
            <>
              {formMode === 'add' ? (
                <ServingSizeSelector
                  servingAmount={formAmount}
                  setServingAmount={setFormAmount}
                  servingUnitId={formUnitId}
                  setServingUnitId={handleUnitChange}
                  units={units}
                />
              ) : (
                <View style={styles.editUnitHeader}>
                  <Text style={styles.sectionTitle}>
                    Editing: {units.find(u => u.id === formUnitId)?.name ?? String(formUnitId)}
                  </Text>
                  <Input
                    label="Amount"
                    value={formAmount}
                    onChangeText={setFormAmount}
                    keyboardType="numeric"
                    placeholder="100"
                  />
                </View>
              )}
              <Text style={styles.sectionTitle}>
                {formMode === 'edit' ? 'Nutrition values' : 'Nutrition for above serving'}
              </Text>
              <Input
                label="Calories (kcal)"
                value={formCalories}
                onChangeText={setFormCalories}
                keyboardType="numeric"
                placeholder="0"
              />
              <View style={styles.macroRow}>
                <View style={styles.macroCol}>
                  <Input label="Protein (g)" value={formProteins} onChangeText={setFormProteins} keyboardType="numeric" placeholder="0" />
                </View>
                <View style={styles.macroCol}>
                  <Input label="Fats (g)" value={formFats} onChangeText={setFormFats} keyboardType="numeric" placeholder="0" />
                </View>
                <View style={styles.macroCol}>
                  <Input label="Carbs (g)" value={formCarbs} onChangeText={setFormCarbs} keyboardType="numeric" placeholder="0" />
                </View>
              </View>

              <Button
                title={formMode === 'edit' ? 'Update Serving' : 'Add Serving'}
                variant="primary"
                onPress={handleSaveUnit}
                isLoading={isPending}
                disabled={!name.trim() || parseFloat(formAmount) <= 0}
                style={styles.saveBtn}
              />
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    cancelBtn: {
      fontSize: fontSize.md,
      color: c.danger,
      fontWeight: fontWeight.semibold,
      width: 60,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    headerSpacer: {
      width: 60,
    },
    form: {
      paddingHorizontal: spacing.lg,
    },
    saveNameBtn: {
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.textSecondary,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    existingUnitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceLight,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    existingUnitRowActive: {
      borderColor: c.primary,
      backgroundColor: c.primaryLight,
    },
    existingUnitInfo: {
      flex: 1,
    },
    existingUnitName: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.text,
    },
    existingUnitMacros: {
      fontSize: fontSize.sm,
      color: c.textMuted,
      marginTop: 2,
    },
    unitActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginLeft: spacing.sm,
    },
    unitActionBtn: {
      padding: spacing.xs,
    },
    editUnitHeader: {
      marginBottom: spacing.xs,
    },
    addUnitToggle: {
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
      marginBottom: spacing.md,
      paddingVertical: spacing.xs,
    },
    addUnitToggleText: {
      fontSize: fontSize.md,
      color: c.primary,
      fontWeight: fontWeight.semibold,
    },
    macroRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    macroCol: {
      flex: 1,
    },
    saveBtn: {
      marginTop: spacing.lg,
    },
    bottomSpacer: {
      height: 100,
    },
  });
}
