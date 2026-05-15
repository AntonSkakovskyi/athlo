import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { NutritionBarChart } from '@/features/nutrition/components';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { SegmentControl } from '@/components/ui/SegmentControl/SegmentControl';
import { SCOPE_LABELS, useNutritionHistoryScreen } from '@/features/nutrition/hooks/useNutritionHistoryScreen';

export default function NutritionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const {
    router, scopeIndex, setScopeIndex, history, isLoading,
    avgCalories, avgWater, caloriesData, proteinData, fatData, carbData, waterData,
  } = useNutritionHistoryScreen();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Nutrition History</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.scopeWrapper}>
        <SegmentControl segments={SCOPE_LABELS} activeIndex={scopeIndex} onSelect={setScopeIndex} />
      </View>

      {isLoading ? (
        <Spinner style={styles.loader} />
      ) : !history?.length ? (
        <EmptyState title="No nutrition data" description="Start logging your meals to see history" />
      ) : (
        <>
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Calories</Text>
              <Text style={styles.chartAvg}>Avg: {avgCalories} kcal</Text>
            </View>
            <NutritionBarChart data={caloriesData} color={colors.primary} unit="kcal" />
          </View>

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
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  backBtn: { color: colors.primary, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  screenTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  headerSpacer: { width: 50 },
  scopeWrapper: { paddingHorizontal: spacing.lg, marginBottom: spacing['2xl'] },
  loader: { marginTop: 60 },
  chartSection: { paddingHorizontal: spacing.lg, marginBottom: spacing['2xl'] },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  chartTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: spacing.sm },
  chartAvg: { fontSize: fontSize.sm, color: colors.textSecondary },
});
