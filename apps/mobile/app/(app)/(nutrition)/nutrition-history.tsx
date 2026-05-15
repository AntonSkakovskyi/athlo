import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGetNutritionHistory } from '@/features/nutrition/hooks';
import { SegmentControl } from '@/components/ui/SegmentControl/SegmentControl';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { NutritionBarChart } from '@/features/nutrition/components';
import { Spinner } from '@/components/ui/Spinner/Spinner';

type Scope = '1W' | '1M' | '3M';
const SCOPES: Scope[] = ['1W', '1M', '3M'];
const SCOPE_LABELS = ['1 Week', '1 Month', '3 Months'];

function getDateRange(scope: Scope): { from: string; to: string } {
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

export default function NutritionHistoryScreen() {
  const insets = useSafeAreaInsets();
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Nutrition History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Scope Selector */}
      <View style={styles.scopeWrapper}>
        <SegmentControl
          segments={SCOPE_LABELS}
          activeIndex={scopeIndex}
          onSelect={setScopeIndex}
        />
      </View>

      {isLoading ? (
        <Spinner style={styles.loader} />
      ) : !history?.length ? (
        <EmptyState
          title="No nutrition data"
          description="Start logging your meals to see history"
        />
      ) : (
        <>
          {/* Calories Chart */}
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Calories</Text>
              <Text style={styles.chartAvg}>Avg: {avgCalories} kcal</Text>
            </View>
            <NutritionBarChart data={caloriesData} color={colors.primary} unit="kcal" />
          </View>

          {/* Macros Chart */}
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Protein</Text>
            <NutritionBarChart data={proteinData} color={colors.info} unit="g" />
          </View>

          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Fats</Text>
            <NutritionBarChart data={fatData} color={colors.warning} unit="g" />
          </View>

          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Carbs</Text>
            <NutritionBarChart data={carbData} color={colors.primary} unit="g" />
          </View>

          {/* Water Chart */}
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Water</Text>
              <Text style={styles.chartAvg}>Avg: {avgWater} ml</Text>
            </View>
            <NutritionBarChart data={waterData} color={colors.info} unit="ml" />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  backBtn: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  screenTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: {
    width: 50,
  },
  scopeWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  loader: {
    marginTop: 60,
  },
  chartSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  chartTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chartAvg: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
