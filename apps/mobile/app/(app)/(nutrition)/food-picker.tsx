import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from '@/hooks/useRouter';
import type { IFood } from '@athlo/shared';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Input } from '@/components/ui/Input/Input';
import { useMemo, useState, useCallback } from 'react';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { InfiniteList } from '@/components/ui/InfiniteList/InfiniteList';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { CreateFoodModal } from '@/features/nutrition/components/CreateFoodModal/CreateFoodModal';
import { EditFoodModal } from '@/features/nutrition/components/EditFoodModal/EditFoodModal';
import { useFoodPickerScreen } from '@/features/nutrition/hooks/useFoodPickerScreen';
import { FoodDetailPanel } from '@/features/nutrition/components/FoodDetailPanel/FoodDetailPanel';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography/Typography';

type ListItem = 
  | { type: 'header'; title: string; count?: number; expanded: boolean; onToggle: () => void }
  | { type: 'food'; data: IFood };

export default function FoodPickerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const {
    search, setSearch, selectedFood, setSelectedFood, amount, setAmount, unitId, setUnitId,
    showCreateForm, setShowCreateForm, showEditForm, setShowEditForm,
    newFoodName, setNewFoodName, newFoodBrand, setNewFoodBrand,
    newFoodCalories, setNewFoodCalories, newFoodProteins, setNewFoodProteins,
    newFoodFats, setNewFoodFats, newFoodCarbs, setNewFoodCarbs,
    newFoodServingAmount, setNewFoodServingAmount, newFoodServingUnitId,
    units, foodsQuery, createFood, updateFood, addLogMealItem, addPlanMealItem,
    foodList, calculatedMacros,
    handleSelectFood, handleUnitChange, handleNewFoodServingUnitChange,
    handleAddFood, handleCreateFood, handleDeleteFood, handleEditFood,
    handleDeleteFoodUnit, resetCreateForm, isCreator, params, deleteFood, deleteFoodUnit,
  } = useFoodPickerScreen({ insets, router });
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [myProductsExpanded, setMyProductsExpanded] = useState(true);
  const [othersExpanded, setOthersExpanded] = useState(true);

  const groupedFoods = useMemo(() => {
    const myProducts: IFood[] = [];
    const others: IFood[] = [];

    foodList.forEach(food => {
      if (food.creatorId === user?.id) {
        myProducts.push(food);
      } else {
        others.push(food);
      }
    });

    return { myProducts, others };
  }, [foodList, user?.id]);

  const virtualList = useMemo(() => {
    const list: ListItem[] = [];
    
    // Always show "My Products" header if not searching or if there are matches
    if (!search || groupedFoods.myProducts.length > 0) {
      list.push({ 
        type: 'header', 
        title: 'My Products', 
        count: groupedFoods.myProducts.length, 
        expanded: myProductsExpanded, 
        onToggle: () => setMyProductsExpanded(!myProductsExpanded) 
      });
      if (myProductsExpanded) {
        groupedFoods.myProducts.forEach(food => list.push({ type: 'food', data: food }));
      }
    }

    // Always show "All Others" header
    list.push({ 
      type: 'header', 
      title: search ? 'Search Results' : 'All Others', 
      expanded: othersExpanded, 
      onToggle: () => setOthersExpanded(!othersExpanded) 
    });
    if (othersExpanded) {
      groupedFoods.others.forEach(food => list.push({ type: 'food', data: food }));
    }
    
    return list;
  }, [groupedFoods, myProductsExpanded, othersExpanded, search]);

  const renderFoodItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return (
        <Pressable onPress={item.onToggle} style={styles.sectionHeader}>
          <View style={styles.headerTitleRow}>
            <Typography variant="h4" style={styles.sectionTitle}>{item.title}</Typography>
            {item.count !== undefined && item.count > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{item.count}</Text>
              </View>
            )}
          </View>
          <Ionicons 
            name={item.expanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={colors.textMuted} 
          />
        </Pressable>
      );
    }

    const food = item.data;
    // Determine the "serving" to display in the list
    const firstFact = food.units?.[0];
    const unitName = firstFact?.unit?.name || 'g';
    const factAmount = Number(firstFact?.amount) || 100;
    
    let displayAmount = factAmount;

    // For non-weight units, we usually show 1 unit (e.g. 1 piece)
    if (!['g', 'ml'].includes(unitName.toLowerCase())) {
      displayAmount = 1;
    }

    const multiplier = displayAmount / factAmount;

    const cals = Math.round((firstFact?.calories || 0) * multiplier);
    const prot = Math.round((firstFact?.proteins || 0) * multiplier * 10) / 10;
    const fats = Math.round((firstFact?.fats || 0) * multiplier * 10) / 10;
    const carbs = Math.round((firstFact?.carbs || 0) * multiplier * 10) / 10;

    return (
      <Pressable
        style={[styles.foodItem, selectedFood?.id === food.id && styles.foodItemSelected]}
        onPress={() => handleSelectFood(food)}
      >
        <View style={styles.foodInfo}>
          <Text style={styles.foodName} numberOfLines={1}>{food.name}</Text>
          <Text style={styles.foodBrand} numberOfLines={1}>
            {food.brand ? `${food.brand} · ` : ''}{displayAmount}{unitName}
          </Text>
          <View style={styles.macroRow}>
            <Text style={styles.calorieText}>{cals} kcal</Text>
            <Text style={styles.macroText}>P: {prot}g · F: {fats}g · C: {carbs}g</Text>
          </View>
        </View>
      </Pressable>
    );
  }, [colors.textMuted, handleSelectFood, selectedFood?.id, styles]);

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
          data={virtualList}
          keyExtractor={(item, index) => item.type === 'header' ? `header-${item.title}` : `food-${item.data.id}-${index}`}
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
          setUnitId={handleUnitChange}
          calculatedMacros={calculatedMacros}
          onClose={() => setSelectedFood(null)}
          onAdd={handleAddFood}
          onDelete={handleDeleteFood}
          onEdit={() => setShowEditForm(true)}
          isCreator={isCreator}
          isPending={addLogMealItem.isPending || addPlanMealItem.isPending}
          isDeleting={deleteFood.isPending}
          bottomPadding={insets.bottom + spacing.md}
        />
      )}

      {selectedFood && showEditForm && (
        <EditFoodModal
          visible={showEditForm}
          food={selectedFood}
          units={units}
          onClose={() => setShowEditForm(false)}
          onSave={handleEditFood}
          onDeleteUnit={handleDeleteFoodUnit}
          isPending={updateFood.isPending}
          isDeletingUnit={deleteFoodUnit.isPending}
          topPadding={insets.top + spacing.lg}
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
        setNewFoodServingUnitId={handleNewFoodServingUnitChange}
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
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      backgroundColor: c.background,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionTitle: {
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    countBadge: {
      backgroundColor: c.primary + '20',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
      marginLeft: spacing.sm,
    },
    countText: {
      fontSize: 10,
      fontWeight: '700',
      color: c.primary,
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
