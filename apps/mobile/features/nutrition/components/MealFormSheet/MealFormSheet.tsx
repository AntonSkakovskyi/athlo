import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { BottomSheet, TimePicker } from '@/components/ui';
import type { IMealType } from '@athlo/shared';
import type { PlanMealWithItems, SelectedPlanItem } from '@/features/nutrition/hooks/useNutritionHomeScreen';

interface MealFormSheetProps {
  title: string;
  confirmLabel: string;
  mealTypes: IMealType[];
  onClose: () => void;
  onConfirm: (data: { 
    mealTypeId: number; 
    name?: string; 
    consumedAt?: string; 
    timeSuggestion?: string;
    items?: SelectedPlanItem[];
  }) => Promise<void> | void;
  
  // Initial values for editing
  initialName?: string;
  initialTypeId?: number | null;
  initialDate?: Date | string | null; // Date object or ISO string
  initialTimeSuggestion?: string; // HH:mm string
  defaultHasTime?: boolean;
  
  // For plan suggestions (LogMeal mode)
  planDayMeals?: PlanMealWithItems[];
  
  showNameInput?: boolean;
  isLoading?: boolean;
}

export function MealFormSheet({
  title,
  confirmLabel,
  mealTypes,
  onClose,
  onConfirm,
  initialName = '',
  initialTypeId = null,
  initialDate = null,
  initialTimeSuggestion = '',
  defaultHasTime = false,
  planDayMeals = [],
  showNameInput = true,
  isLoading = false,
}: MealFormSheetProps) {
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(initialTypeId);
  const [mealName, setMealName] = useState(initialName);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [hasTime, setHasTime] = useState(!!initialDate || !!initialTimeSuggestion || defaultHasTime);
  const [selectedSeconds, setSelectedSeconds] = useState(() => {
    if (initialDate) {
      const date = new Date(initialDate);
      return date.getHours() * 3600 + date.getMinutes() * 60;
    }
    if (initialTimeSuggestion) {
      const [h, m] = initialTimeSuggestion.split(':').map(Number);
      return (h || 0) * 3600 + (m || 0) * 60;
    }
    const now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60;
  });

  const planMeal = useMemo(
    () => planDayMeals.find((m) => m.mealTypeId === selectedTypeId) ?? null,
    [planDayMeals, selectedTypeId],
  );

  const handleSelectType = (id: number) => {
    setSelectedTypeId((prev) => (prev === id ? null : id));
    setSelectedItemIds(new Set());
  };

  const toggleItem = (itemId: number) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (!planMeal?.items) return;
    setSelectedItemIds(new Set(planMeal.items.map((i) => i.id)));
  };

  const handleConfirm = async () => {
    if (!selectedTypeId) return;
    
    let timeStr: string | undefined;
    let consumedAt: string | undefined;

    if (hasTime) {
      const h = Math.floor(selectedSeconds / 3600);
      const m = Math.floor((selectedSeconds % 3600) / 60);
      timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      if (initialDate) {
        const date = new Date(initialDate);
        date.setHours(h, m, 0, 0);
        consumedAt = date.toISOString();
      } else {
        const now = new Date();
        now.setHours(h, m, 0, 0);
        consumedAt = now.toISOString();
      }
    }

    const items: SelectedPlanItem[] = (planMeal?.items ?? [])
      .filter((i) => selectedItemIds.has(i.id))
      .map((i) => ({
        foodId: i.foodId,
        unitId: i.unitId,
        amount: Number(i.amount),
        foodName: i.food?.name ?? '',
      }));

    await onConfirm({
      mealTypeId: selectedTypeId,
      name: mealName.trim() || undefined,
      consumedAt,
      timeSuggestion: timeStr,
      items,
    });
  };

  const formatTimeLabel = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  return (
    <Modal visible transparent animationType="slide">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.timeControls}>
              {hasTime ? (
                <View style={styles.timePickerContainer}>
                  <Pressable 
                    style={styles.timePickerTrigger} 
                    onPress={() => setTimePickerVisible(true)}
                  >
                    <Text style={styles.timePickerText}>{formatTimeLabel(selectedSeconds)}</Text>
                  </Pressable>
                  <Pressable hitSlop={12} onPress={() => setHasTime(false)} style={styles.clearTimeBtn}>
                    <Text style={styles.clearTimeText}>✕</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable 
                  style={styles.addTimeBtn} 
                  onPress={() => {
                    setHasTime(true);
                    setTimePickerVisible(true);
                  }}
                >
                  <Text style={styles.addTimeText}>+ Time</Text>
                </Pressable>
              )}
            </View>
          </View>

          {showNameInput && (
            <Input
              label="Meal Name"
              placeholder="e.g. Breakfast at Home"
              value={mealName}
              onChangeText={setMealName}
              containerStyle={styles.nameInputContainer}
            />
          )}

          <Text style={styles.label}>Meal Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
            {mealTypes.map((type) => (
              <Pressable
                key={type.id}
                style={[styles.typeChip, selectedTypeId === type.id && styles.typeChipActive]}
                onPress={() => handleSelectType(type.id)}
              >
                <Text style={[styles.typeChipText, selectedTypeId === type.id && styles.typeChipTextActive]}>
                  {type.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {planMeal && (
            <>
              <View style={styles.planHeader}>
                <Text style={styles.label}>From your plan</Text>
                {(planMeal.items?.length ?? 0) > 0 && (
                  <Pressable onPress={selectAll}>
                    <Text style={styles.selectAll}>Select all</Text>
                  </Pressable>
                )}
              </View>

              <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false}>
                {(planMeal.items ?? []).map((item) => {
                  const checked = selectedItemIds.has(item.id);
                  return (
                    <Pressable key={item.id} style={styles.itemRow} onPress={() => toggleItem(item.id)}>
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.food?.name ?? 'Unknown food'}</Text>
                        <Text style={styles.itemDetail}>
                          {item.amount} {item.unit?.name ?? 'g'}
                        </Text>
                      </View>
                      {item.food && (
                        <Text style={styles.itemCal}>
                          {Math.round((item.food.calories * item.amount) / 100)} kcal
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
                {(planMeal.items?.length ?? 0) === 0 && (
                  <Text style={styles.emptyPlan}>No items in this plan meal</Text>
                )}
              </ScrollView>
            </>
          )}

          {selectedTypeId && !planMeal && planDayMeals.length > 0 && (
            <Text style={styles.noPlanMeal}>No plan suggestion for this meal type today</Text>
          )}

          <View style={styles.actions}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={styles.actionBtn} />
            <Button
              title={confirmLabel}
              variant="primary"
              onPress={handleConfirm}
              disabled={!selectedTypeId}
              isLoading={isLoading}
              style={styles.actionBtn}
            />
          </View>
        </View>

        <BottomSheet
          visible={timePickerVisible}
          onClose={() => setTimePickerVisible(false)}
          title="Select Meal Time"
          scrollable={false}
        >
          <TimePicker 
            value={selectedSeconds} 
            onChange={setSelectedSeconds}
            hideSeconds={true}
          />
          <Button 
            title="Done" 
            onPress={() => setTimePickerVisible(false)} 
            style={{ marginTop: spacing.md, marginBottom: spacing.lg }}
          />
        </BottomSheet>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing['2xl'],
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingRight: spacing.xs,
  },
  timePickerTrigger: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  timePickerText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  clearTimeBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xxs,
  },
  clearTimeText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: fontWeight.bold,
  },
  addTimeBtn: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addTimeText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  nameInputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  typeRow: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  typeChipTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  selectAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  itemList: {
    maxHeight: 200,
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    fontSize: 12,
    color: colors.black,
    fontWeight: fontWeight.bold,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  itemDetail: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  itemCal: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  emptyPlan: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  noPlanMeal: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});
