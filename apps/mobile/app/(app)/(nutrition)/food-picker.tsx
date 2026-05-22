import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { IFood } from '@athlo/shared';
import { spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Input } from '@/components/ui/Input/Input';
import { useMemo } from 'react';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { InfiniteList } from '@/components/ui/InfiniteList/InfiniteList';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { CreateFoodModal } from '@/features/nutrition/components/CreateFoodModal/CreateFoodModal';
import { useFoodPickerScreen } from '@/features/nutrition/hooks/useFoodPickerScreen';
import { FoodDetailPanel } from '@/features/nutrition/components/FoodDetailPanel/FoodDetailPanel';

export default function FoodPickerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    search, setSearch, selectedFood, setSelectedFood, amount, setAmount, unitId, setUnitId,
    showCreateForm, setShowCreateForm, newFoodName, setNewFoodName, newFoodBrand, setNewFoodBrand,
    newFoodCalories, setNewFoodCalories, newFoodProteins, setNewFoodProteins,
    newFoodFats, setNewFoodFats, newFoodCarbs, setNewFoodCarbs,
    newFoodServingAmount, setNewFoodServingAmount, newFoodServingUnitId, setNewFoodServingUnitId,
    units, foodsQuery, createFood, addLogMealItem, addPlanMealItem,
    foodList, calculatedMacros, handleSelectFood, handleAddFood, handleCreateFood,
    handleDeleteFood, handleAddCustomUnit, resetCreateForm, isCreator,
    params, deleteFood,
  } = useFoodPickerScreen({ insets, router });
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const renderFoodItem = ({ item }: { item: IFood }) => {
    // Determine the "serving" to display in the list
    const firstUnit = item.units?.[0];
    const unitName = firstUnit?.unit?.name || 'g';
    const factor = Number(firstUnit?.conversionFactor || 1);
    
    let displayAmount = 100;
    let macroFactor = 1; // since DB stores per 100g

    if (!['g', 'ml'].includes(unitName.toLowerCase())) {
      displayAmount = 1;
      macroFactor = factor / 100;
    }

    const cals = Math.round(item.calories * macroFactor);
    const prot = Math.round(item.proteins * macroFactor * 10) / 10;
    const fats = Math.round(item.fats * macroFactor * 10) / 10;
    const carbs = Math.round(item.carbs * macroFactor * 10) / 10;

    return (
      <Pressable
        style={[styles.foodItem, selectedFood?.id === item.id && styles.foodItemSelected]}
        onPress={() => handleSelectFood(item)}
      >
        <View style={styles.foodInfo}>
          <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.foodBrand} numberOfLines={1}>
            {item.brand ? `${item.brand} · ` : ''}{displayAmount}{unitName}
          </Text>
          <View style={styles.macroRow}>
            <Text style={styles.calorieText}>{cals} kcal</Text>
            <Text style={styles.macroText}>P: {prot}g · F: {fats}g · C: {carbs}g</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelBtn}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>{params.swapItemId ? 'Swap Food' : 'Add Food'}</Text>
        <Pressable onPress={() => setShowCreateForm(true)}>
          <Text style={styles.createBtn}>+ Create</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Input placeholder="Search foods..." value={search} onChangeText={setSearch} style={styles.searchInput} />
      </View>

      {foodsQuery.isLoading ? (
        <Spinner size="large" style={styles.loader} />
      ) : (
        <InfiniteList
          data={foodList}
          keyExtractor={(item) => String(item.id)}
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

      {selectedFood && (
        <FoodDetailPanel
          selectedFood={selectedFood}
          amount={amount}
          setAmount={setAmount}
          unitId={unitId}
          setUnitId={setUnitId}
          calculatedMacros={calculatedMacros}
          onClose={() => setSelectedFood(null)}
          onAdd={handleAddFood}
          onDelete={handleDeleteFood}
          isCreator={isCreator}
          isPending={addLogMealItem.isPending || addPlanMealItem.isPending}
          isDeleting={deleteFood.isPending}
          bottomPadding={insets.bottom + spacing.md}
        />
      )}

      <CreateFoodModal
        visible={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        newFoodName={newFoodName}
        setNewFoodName={setNewFoodName}
        newFoodBrand={newFoodBrand}
        setNewFoodBrand={setNewFoodBrand}
        newFoodCalories={newFoodCalories}
        setNewFoodCalories={setNewFoodCalories}
        newFoodProteins={newFoodProteins}
        setNewFoodProteins={setNewFoodProteins}
        newFoodFats={newFoodFats}
        setNewFoodFats={setNewFoodFats}
        newFoodCarbs={newFoodCarbs}
        setNewFoodCarbs={setNewFoodCarbs}
        newFoodServingAmount={newFoodServingAmount}
        setNewFoodServingAmount={setNewFoodServingAmount}
        newFoodServingUnitId={newFoodServingUnitId}
        setNewFoodServingUnitId={setNewFoodServingUnitId}
        units={units}
        onSave={handleCreateFood}
        onCancel={() => { setShowCreateForm(false); resetCreateForm(); }}
        isPending={createFood.isPending}
        topPadding={insets.top + spacing.lg}
      />
    </KeyboardAvoidingView>
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
      marginBottom: spacing.md,
    },
    cancelBtn: {
      fontSize: fontSize.md,
      color: c.danger,
      fontWeight: fontWeight.semibold,
      width: 60,
    },
    createBtn: {
      fontSize: fontSize.md,
      color: c.primary,
      fontWeight: fontWeight.semibold,
      width: 60,
      textAlign: 'right',
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    searchWrap: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    searchInput: {
      marginBottom: 0,
    },
    list: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 260,
    },
    foodItem: {
      backgroundColor: c.surface,
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    foodItemSelected: {
      borderColor: c.primary,
      backgroundColor: c.primaryLight,
    },
    foodInfo: {
      flex: 1,
    },
    foodName: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: c.text,
    },
    foodBrand: {
      fontSize: fontSize.sm,
      color: c.textMuted,
      marginTop: spacing.xxs,
    },
    macroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xs,
      gap: spacing.md,
    },
    calorieText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.primary,
    },
    macroText: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
    },
    loader: {
      marginTop: 40,
    },
  });
}
