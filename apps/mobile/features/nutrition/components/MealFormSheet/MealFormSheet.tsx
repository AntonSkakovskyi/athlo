import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { BottomSheet } from '@/components/ui';
import type { IMealType } from '@athlo/shared';
import type { PlanMealWithItems, SelectedPlanItem } from '@/features/nutrition/hooks/useNutritionHomeScreen';
import { MealTypeChips } from './MealTypeChips/MealTypeChips';
import { PlanItemPicker } from './PlanItemPicker/PlanItemPicker';
import { TimePickerSection } from './TimePickerSection/TimePickerSection';

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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(initialTypeId);
  const [mealName, setMealName] = useState(initialName);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());

  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (!selectedTypeId || isSubmitting) return;

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

    setIsSubmitting(true);
    try {
      await onConfirm({
        mealTypeId: selectedTypeId,
        name: mealName.trim() || undefined,
        consumedAt,
        timeSuggestion: timeStr,
        items,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerRight = (
    <TimePickerSection
      hasTime={hasTime}
      selectedSeconds={selectedSeconds}
      timePickerVisible={timePickerVisible}
      onAddTime={() => { setHasTime(true); setTimePickerVisible(true); }}
      onClearTime={() => setHasTime(false)}
      onOpenPicker={() => setTimePickerVisible(true)}
      onClosePicker={() => setTimePickerVisible(false)}
      onTimeChange={setSelectedSeconds}
    />
  );

  const footer = (
    <View style={styles.actions}>
      <Button title="Cancel" variant="ghost" onPress={onClose} style={styles.actionBtn} />
      <Button
        title={confirmLabel}
        variant="primary"
        onPress={handleConfirm}
        disabled={!selectedTypeId}
        isLoading={isLoading || isSubmitting}
        style={styles.actionBtn}
      />
    </View>
  );

  return (
    <BottomSheet
      visible={true}
      onClose={onClose}
      title={title}
      headerRight={headerRight}
      footer={footer}
      maxHeight="85%"
      scrollable={false}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          {showNameInput && (
            <Input
              label="Meal Name"
              placeholder="e.g. Breakfast at Home"
              value={mealName}
              onChangeText={setMealName}
              containerStyle={styles.nameInputContainer}
            />
          )}

          <MealTypeChips
            mealTypes={mealTypes}
            selectedTypeId={selectedTypeId}
            onSelectType={handleSelectType}
          />

          {planMeal && (
            <PlanItemPicker
              planMeal={planMeal}
              selectedItemIds={selectedItemIds}
              onToggleItem={toggleItem}
              onSelectAll={selectAll}
            />
          )}

          {selectedTypeId && !planMeal && planDayMeals.length > 0 && (
            <Text style={styles.noPlanMeal}>No plan suggestion for this meal type today</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    keyboardView: {
    },
    scroll: {
      paddingHorizontal: spacing.lg,
    },
    nameInputContainer: {
      marginBottom: spacing.lg,
    },
    noPlanMeal: {
      fontSize: fontSize.sm,
      color: c.textMuted,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    actionBtn: {
      flex: 1,
    },
  });
}
