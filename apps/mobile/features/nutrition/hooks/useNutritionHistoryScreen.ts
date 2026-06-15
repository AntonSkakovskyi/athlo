import { useState, useMemo } from 'react';
import { useRouter } from '@/hooks/useRouter';
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

type DataPoint = { date: string; value: number; label?: string };

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // Monday
  return d.toISOString().split('T')[0];
}

function formatWeekLabel(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const sStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const eStr = s.getMonth() === e.getMonth()
    ? e.toLocaleDateString('en-US', { day: 'numeric' })
    : e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${sStr}–${eStr}`;
}

function aggregateWeekly(data: DataPoint[]): DataPoint[] {
  const weekMap = new Map<string, { sum: number; count: number; end: string }>();
  for (const point of data) {
    const ws = getWeekStart(point.date);
    if (!weekMap.has(ws)) {
      const endDate = new Date(ws + 'T00:00:00');
      endDate.setDate(endDate.getDate() + 6);
      weekMap.set(ws, { sum: 0, count: 0, end: endDate.toISOString().split('T')[0] });
    }
    const week = weekMap.get(ws)!;
    week.sum += point.value;
    week.count++;
  }
  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ws, { sum, count, end }]) => ({
      date: ws,
      value: count > 0 ? Math.round((sum / count) * 100) / 100 : 0,
      label: formatWeekLabel(ws, end),
    }));
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

  const caloriesRaw = useMemo(() => (history ?? []).map((d) => ({ date: d.date, value: d.calories })), [history]);
  const proteinRaw  = useMemo(() => (history ?? []).map((d) => ({ date: d.date, value: d.proteins })), [history]);
  const fatRaw      = useMemo(() => (history ?? []).map((d) => ({ date: d.date, value: d.fats })), [history]);
  const carbRaw     = useMemo(() => (history ?? []).map((d) => ({ date: d.date, value: d.carbs })), [history]);
  const waterRaw    = useMemo(() => (history ?? []).map((d) => ({ date: d.date, value: d.waterMl })), [history]);

  const caloriesData = useMemo(() => scope === '3M' ? aggregateWeekly(caloriesRaw) : caloriesRaw, [caloriesRaw, scope]);
  const proteinData  = useMemo(() => scope === '3M' ? aggregateWeekly(proteinRaw)  : proteinRaw,  [proteinRaw,  scope]);
  const fatData      = useMemo(() => scope === '3M' ? aggregateWeekly(fatRaw)      : fatRaw,      [fatRaw,      scope]);
  const carbData     = useMemo(() => scope === '3M' ? aggregateWeekly(carbRaw)     : carbRaw,     [carbRaw,     scope]);
  const waterData    = useMemo(() => scope === '3M' ? aggregateWeekly(waterRaw)    : waterRaw,    [waterRaw,    scope]);

  return {
    router,
    scopeIndex,
    setScopeIndex,
    scope,
    history,
    isLoading,
    avgCalories,
    avgWater,
    caloriesData, caloriesRaw,
    proteinData,  proteinRaw,
    fatData,      fatRaw,
    carbData,     carbRaw,
    waterData,    waterRaw,
  };
}
