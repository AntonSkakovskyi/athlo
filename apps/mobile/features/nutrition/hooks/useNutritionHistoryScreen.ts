import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useGetNutritionHistory } from '@/features/nutrition/hooks';

export type Scope = '1W' | '1M' | '3M';
export const SCOPES: Scope[] = ['1W', '1M', '3M'];
export const SCOPE_LABELS = ['1 Week', '1 Month', '3 Months'];

export function getDateRange(scope: Scope): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  switch (scope) {
    case '1W':
      from.setDate(from.getDate() - 7);
      break;
    case '1M':
      from.setMonth(from.getMonth() - 1);
      break;
    case '3M':
      from.setMonth(from.getMonth() - 3);
      break;
  }
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

export function useNutritionHistoryScreen() {
  const router = useRouter();
  const [scopeIndex, setScopeIndex] = useState(0);
  const scope = SCOPES[scopeIndex];

  const { from, to } = useMemo(() => getDateRange(scope), [scope]);
  const { data: history, isLoading } = useGetNutritionHistory(from, to);

  const avgCalories = useMemo(() => {
    if (!history?.length) return 0;
    return Math.round(history.reduce((sum, d) => sum + d.calories, 0) / history.length);
  }, [history]);

  const avgWater = useMemo(() => {
    if (!history?.length) return 0;
    return Math.round(history.reduce((sum, d) => sum + d.waterMl, 0) / history.length);
  }, [history]);

  const caloriesData = useMemo(
    () => (history ?? []).map((d) => ({ date: d.date, value: d.calories })),
    [history],
  );

  const proteinData = useMemo(
    () => (history ?? []).map((d) => ({ date: d.date, value: d.proteins })),
    [history],
  );

  const fatData = useMemo(
    () => (history ?? []).map((d) => ({ date: d.date, value: d.fats })),
    [history],
  );

  const carbData = useMemo(
    () => (history ?? []).map((d) => ({ date: d.date, value: d.carbs })),
    [history],
  );

  const waterData = useMemo(
    () => (history ?? []).map((d) => ({ date: d.date, value: d.waterMl })),
    [history],
  );

  return {
    router,
    scopeIndex,
    setScopeIndex,
    scope,
    history,
    isLoading,
    avgCalories,
    avgWater,
    caloriesData,
    proteinData,
    fatData,
    carbData,
    waterData,
  };
}
