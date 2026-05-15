import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { IFood } from '@athlo/shared';
import { colors, borderRadius, spacing, fontSize } from '@/constants/theme';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { InfiniteList } from '@/components/ui/InfiniteList/InfiniteList';
import { useInfiniteSearchFoods, useCreateFood } from '../../../hooks/api/useFoodHooks';
import { useAddLogMealItem } from '../../../hooks/api/useNutritionLogHooks';
import { useAddPlanMealItem } from '../../../hooks/api/useMealPlanHooks';
import { Spinner } from '@/components/ui/Spinner/Spinner';

type PickerMode = 'logMeal' | 'planMeal';

export default function FoodPickerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    mealId?: string;
    planId?: string;
    planMealId?: string;
    mode?: PickerMode;
  }>();

  const mode: PickerMode = (params.mode as PickerMode) ?? 'logMeal';

  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<IFood | null>(null);
  const [amount, setAmount] = useState('100');
  const [unitId, setUnitId] = useState(1); // default: grams
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create food form state
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodBrand, setNewFoodBrand] = useState('');
  const [newFoodCalories, setNewFoodCalories] = useState('');
  const [newFoodProteins, setNewFoodProteins] = useState('');
  const [newFoodFats, setNewFoodFats] = useState('');
  const [newFoodCarbs, setNewFoodCarbs] = useState('');

  const foodsQuery = useInfiniteSearchFoods(search.trim() || undefined);
  const createFood = useCreateFood();
  const addLogMealItem = useAddLogMealItem();
  const addPlanMealItem = useAddPlanMealItem();

  const foodList = useMemo(
    () => (foodsQuery.data?.pages ?? []).flatMap((p) => p.data) as IFood[],
    [foodsQuery.data],
  );

  const calculatedMacros = useMemo(() => {
    if (!selectedFood) return null;
    const factor = (parseFloat(amount) || 0) / 100;
    return {
      calories: Math.round(selectedFood.calories * factor),
      proteins: Math.round(selectedFood.proteins * factor * 10) / 10,
      fats: Math.round(selectedFood.fats * factor * 10) / 10,
      carbs: Math.round(selectedFood.carbs * factor * 10) / 10,
    };
  }, [selectedFood, amount]);

  const handleSelectFood = useCallback((food: IFood) => {
    setSelectedFood(food);
    setAmount('100');
    setUnitId(1);
  }, []);

  const handleAddFood = useCallback(() => {
    const parsedAmount = parseFloat(amount);
    if (!selectedFood || !parsedAmount || parsedAmount <= 0) return;

    if (mode === 'logMeal' && params.mealId) {
      addLogMealItem.mutate(
        {
          mealId: params.mealId,
          data: { foodId: selectedFood.id, unitId, amount: parsedAmount },
        },
        { onSuccess: () => router.back() },
      );
    } else if (mode === 'planMeal' && params.planId && params.planMealId) {
      addPlanMealItem.mutate(
        {
          planId: params.planId,
          mealId: params.planMealId,
          data: { foodId: selectedFood.id, unitId, amount: parsedAmount },
        },
        { onSuccess: () => router.back() },
      );
    }
  }, [selectedFood, amount, unitId, mode, params, addLogMealItem, addPlanMealItem, router]);

  const handleCreateFood = useCallback(() => {
    const cal = parseFloat(newFoodCalories);
    const prot = parseFloat(newFoodProteins);
    const fat = parseFloat(newFoodFats);
    const carb = parseFloat(newFoodCarbs);

    if (!newFoodName.trim() || isNaN(cal) || isNaN(prot) || isNaN(fat) || isNaN(carb)) return;

    createFood.mutate(
      {
        name: newFoodName.trim(),
        brand: newFoodBrand.trim() || undefined,
        calories: cal,
        proteins: prot,
        fats: fat,
        carbs: carb,
      },
      {
        onSuccess: (food) => {
          setShowCreateForm(false);
          setSelectedFood(food);
          setAmount('100');
          resetCreateForm();
        },
      },
    );
  }, [newFoodName, newFoodBrand, newFoodCalories, newFoodProteins, newFoodFats, newFoodCarbs, createFood]);

  const resetCreateForm = () => {
    setNewFoodName('');
    setNewFoodBrand('');
    setNewFoodCalories('');
    setNewFoodProteins('');
    setNewFoodFats('');
    setNewFoodCarbs('');
  };

  const renderFoodItem = ({ item }: { item: IFood }) => (
    <Pressable
      style={[styles.foodItem, selectedFood?.id === item.id && styles.foodItemSelected]}
      onPress={() => handleSelectFood(item)}
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.brand ? (
          <Text style={styles.foodBrand} numberOfLines={1}>
            {item.brand}
          </Text>
        ) : null}
        <View style={styles.macroRow}>
          <Text style={styles.calorieText}>{item.calories} kcal</Text>
          <Text style={styles.macroText}>
            P: {item.proteins}g · F: {item.fats}g · C: {item.carbs}g
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelBtn}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Add Food</Text>
        <Pressable onPress={() => setShowCreateForm(true)}>
          <Text style={styles.createBtn}>+ Create</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Input
          placeholder="Search foods..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* Food List */}
      {foodsQuery.isLoading ? (
        <Spinner size="large" style={styles.loader} />
      ) : (
        <InfiniteList
          data={foodList}
          keyExtractor={(item) => String((item as IFood).id)}
          renderItem={renderFoodItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          hasNextPage={foodsQuery.hasNextPage}
          isFetchingNextPage={foodsQuery.isFetchingNextPage}
          onLoadMore={() => foodsQuery.fetchNextPage()}
          ListEmptyComponent={
            <EmptyState
              title="No foods found"
              description={search ? 'Try a different search term' : 'Search for a food or create a new one'}
              actionLabel="+ Create Food"
              onAction={() => setShowCreateForm(true)}
            />
          }
        />
      )}

      {/* Amount Input Sheet (shown when food selected) */}
      {selectedFood && (
        <View style={[styles.amountSheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.amountSheetHeader}>
            <Text style={styles.amountFoodName} numberOfLines={1}>
              {selectedFood.name}
            </Text>
            <Pressable onPress={() => setSelectedFood(null)}>
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

          {/* Live Macro Preview */}
          {calculatedMacros && (
            <View style={styles.macroPreview}>
              <View style={styles.macroPreviewItem}>
                <Text style={styles.macroPreviewValue}>{calculatedMacros.calories}</Text>
                <Text style={styles.macroPreviewLabel}>kcal</Text>
              </View>
              <View style={styles.macroPreviewItem}>
                <Text style={[styles.macroPreviewValue, { color: '#4DA6FF' }]}>
                  {calculatedMacros.proteins}g
                </Text>
                <Text style={styles.macroPreviewLabel}>Protein</Text>
              </View>
              <View style={styles.macroPreviewItem}>
                <Text style={[styles.macroPreviewValue, { color: '#FFB020' }]}>
                  {calculatedMacros.fats}g
                </Text>
                <Text style={styles.macroPreviewLabel}>Fats</Text>
              </View>
              <View style={styles.macroPreviewItem}>
                <Text style={[styles.macroPreviewValue, { color: '#2BDE6A' }]}>
                  {calculatedMacros.carbs}g
                </Text>
                <Text style={styles.macroPreviewLabel}>Carbs</Text>
              </View>
            </View>
          )}

          <Button
            title="Add"
            variant="primary"
            onPress={handleAddFood}
            isLoading={addLogMealItem.isPending || addPlanMealItem.isPending}
            disabled={!amount || parseFloat(amount) <= 0}
            style={styles.addFoodBtn}
          />
        </View>
      )}

      {/* Create Food Modal */}
      <Modal visible={showCreateForm} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.createContainer, { paddingTop: insets.top + 16 }]}>
          <View style={styles.createHeader}>
            <Pressable onPress={() => { setShowCreateForm(false); resetCreateForm(); }}>
              <Text style={styles.cancelBtn}>Cancel</Text>
            </Pressable>
            <Text style={styles.title}>Create Food</Text>
            <View style={{ width: 60 }} />
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
              onPress={handleCreateFood}
              isLoading={createFood.isPending}
              disabled={!newFoodName.trim() || !newFoodCalories}
              style={styles.createSaveBtn}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: 12,
  },
  cancelBtn: {
    fontSize: 15,
    color: colors.danger,
    fontWeight: '600',
    width: 60,
  },
  createBtn: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    width: 60,
    textAlign: 'right',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: 8,
  },
  searchInput: {
    marginBottom: 0,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 260,
  },
  foodItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  foodItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  foodBrand: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  calorieText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  macroText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  loader: {
    marginTop: 40,
  },

  // Amount Sheet
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
    marginBottom: 12,
  },
  amountFoodName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  amountClose: {
    fontSize: 18,
    color: colors.textMuted,
  },
  amountInputRow: {
    flexDirection: 'row',
    gap: 12,
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
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
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
    paddingVertical: 12,
    alignItems: 'center',
  },
  unitOptionActive: {
    backgroundColor: colors.primary,
  },
  unitOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  unitOptionTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  macroPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  macroPreviewItem: {
    alignItems: 'center',
  },
  macroPreviewValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  macroPreviewLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  addFoodBtn: {
    marginTop: 12,
  },

  // Create Food Modal
  createContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  createHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: 24,
  },
  createForm: {
    paddingHorizontal: spacing.lg,
  },
  createSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 12,
  },
  macroInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  macroInputCol: {
    flex: 1,
  },
  createSaveBtn: {
    marginTop: 16,
  },
});
