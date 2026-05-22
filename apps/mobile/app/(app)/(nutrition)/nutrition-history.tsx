import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { useMemo } from 'react';
import { NutritionBarChart } from '@/features/nutrition/components';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { SegmentControl } from '@/components/ui/SegmentControl/SegmentControl';
import { SCOPE_LABELS, useNutritionHistoryScreen } from '@/features/nutrition/hooks/useNutritionHistoryScreen';

const WINDOW_WIDTH = Dimensions.get('window').width;

interface Metric {
  title: string;
  unit: string;
  color: string;
  data: { date: string; value: number }[];
}

function computeStats(data: { date: string; value: number }[], unit: string) {
  const nonZero = data.filter((d) => d.value > 0);
  if (nonZero.length === 0) return null;
  const values = nonZero.map((d) => d.value);
  const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const maxDay = nonZero.find((d) => d.value === maxVal)!;
  const minDay = nonZero.find((d) => d.value === minVal)!;
  return { avg, maxVal, minVal, maxDay, minDay, unit };
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NutritionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const {
    router, scopeIndex, setScopeIndex, history, isLoading,
    caloriesData, proteinData, fatData, carbData, waterData,
  } = useNutritionHistoryScreen();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [pageIndex, setPageIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: pageIndex * WINDOW_WIDTH, animated: false });
  }, [scopeIndex]);

  const metrics: Metric[] = [
    { title: 'Calories', unit: 'kcal', color: colors.primary, data: caloriesData },
    { title: 'Protein',  unit: 'g',    color: colors.info,    data: proteinData },
    { title: 'Fats',     unit: 'g',    color: colors.warning, data: fatData },
    { title: 'Carbs',    unit: 'g',    color: colors.primary, data: carbData },
    { title: 'Water',    unit: 'ml',   color: colors.info,    data: waterData },
  ];

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const newPage = Math.round(x / WINDOW_WIDTH);
    if (newPage !== pageIndex) setPageIndex(newPage);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
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
          {/* Metric tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow} contentContainerStyle={styles.tabRowContent}>
            {metrics.map((m, i) => (
              <Pressable
                key={m.title}
                style={[styles.tab, pageIndex === i && { borderBottomColor: m.color, borderBottomWidth: 2 }]}
                onPress={() => {
                  setPageIndex(i);
                  scrollRef.current?.scrollTo({ x: i * WINDOW_WIDTH, animated: true });
                }}
              >
                <Text style={[styles.tabText, pageIndex === i && { color: m.color }]}>{m.title}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Carousel */}
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
          >
            {metrics.map((metric) => {
              const stats = computeStats(metric.data, metric.unit);
              return (
                <View key={metric.title} style={[styles.page, { width: WINDOW_WIDTH }]}>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent}>
                    <NutritionBarChart key={`${metric.title}-${pageIndex}`} data={metric.data} color={metric.color} unit={metric.unit} />
                    {stats && (
                      <View style={styles.statsRow}>
                        <StatCard label="Avg" value={`${stats.avg}`} unit={metric.unit} color={metric.color} />
                        <StatCard
                          label="Max"
                          value={`${Math.round(stats.maxVal)}`}
                          unit={metric.unit}
                          color={metric.color}
                          sub={formatShortDate(stats.maxDay.date)}
                        />
                        <StatCard
                          label="Min"
                          value={`${Math.round(stats.minVal)}`}
                          unit={metric.unit}
                          color={metric.color}
                          sub={formatShortDate(stats.minDay.date)}
                        />
                      </View>
                    )}
                  </ScrollView>
                </View>
              );
            })}
          </ScrollView>

        </>
      )}
    </View>
  );
}

function StatCard({ label, value, unit, color, sub }: { label: string; value: string; unit: string; color: string; sub?: string }) {
  const { colors } = useTheme();
  const statStyles = useMemo(() => makeStatStyles(colors), [colors]);
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.unit}>{unit}</Text>
      {sub && <Text style={statStyles.sub}>{sub}</Text>}
    </View>
  );
}

function makeStatStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    label: {
      fontSize: fontSize.xs,
      color: c.textMuted,
      marginBottom: 2,
    },
    value: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
    },
    unit: {
      fontSize: fontSize.xs,
      color: c.textSecondary,
      marginTop: 1,
    },
    sub: {
      fontSize: fontSize.xs,
      color: c.textMuted,
      marginTop: 2,
    },
  });
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
    backBtn: { color: c.primary, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
    screenTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: c.text },
    headerSpacer: { width: 50 },
    scopeWrapper: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
    loader: { marginTop: 60 },
    tabsRow: { flexGrow: 0, flexShrink: 0, marginBottom: spacing.md },
    tabRowContent: { paddingHorizontal: spacing.lg, gap: spacing.xs, flex: 1 },
    tab: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabText: {
      textAlign: 'center',
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: c.textSecondary,
    },
    page: { paddingBottom: spacing['2xl'] },
    pageContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing['2xl']},
    statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  });
}
