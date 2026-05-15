import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  type LayoutChangeEvent,
} from 'react-native';
import { LineChart, type lineDataItem } from 'react-native-gifted-charts';
import { colors, borderRadius, spacing, fontSize } from '@/constants/theme';
import { Chip } from '@/components/ui/Chip/Chip';

interface DataPoint {
  date: string;
  value: number;
}

interface LineChartBlockProps {
  metricLabel: string;
  data: DataPoint[];
  period: string;
  onPeriodChange: (period: string) => void;
  periods: string[];
  formatValue?: (value: number) => string;
  formatDate?: (date: string) => string;
  emptyText?: string;
  metrics?: string[];
  activeMetric?: number;
  onMetricChange?: (index: number) => void;
}

const CHART_HEIGHT = 160;
const CONTAINER_PADDING = spacing.lg;
const Y_AXIS_WIDTH = 45;

export function LineChartBlock({
  metricLabel,
  data,
  period,
  onPeriodChange,
  periods,
  formatValue = (v) => String(Math.round(v * 10) / 10),
  formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  emptyText = 'No data available',
  metrics,
  activeMetric,
  onMetricChange,
}: LineChartBlockProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const minVal = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.min(...data.map((d) => d.value));
  }, [data]);

  const displayPoint = useMemo(() => {
    if (data.length === 0) return null;
    const idx = selectedIndex ?? data.length - 1;
    return data[idx];
  }, [data, selectedIndex]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const chartData: lineDataItem[] = useMemo(() => {
    if (data.length === 0) return [];

    const shouldShowLabel = (i: number) => {
      if (data.length <= 7) return true;
      return i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1;
    };

    return data.map((d, i) => ({
      value: d.value,
      label: shouldShowLabel(i) ? formatDate(d.date) : '',
    }));
  }, [data, formatDate]);

  const plotWidth = containerWidth > 0
    ? containerWidth - CONTAINER_PADDING * 2 - Y_AXIS_WIDTH
    : 0;

  const dataSpacing = useMemo(() => {
    if (data.length <= 1 || plotWidth <= 0) return plotWidth;
    return plotWidth / (data.length - 1);
  }, [data.length, plotWidth]);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.metricLabel}>{metricLabel}</Text>
        <View style={styles.headerRight}>
          {displayPoint && (
            <Text style={styles.headerValue}>
              {formatValue(displayPoint.value)}{' '}
              <Text style={styles.headerDate}>· {formatDate(displayPoint.date)}</Text>
            </Text>
          )}
          <Pressable
            style={styles.periodDropdown}
            onPress={() => setPeriodOpen(!periodOpen)}
          >
            <Text style={styles.periodText}>{period} ▼</Text>
          </Pressable>
          {periodOpen && (
            <View style={styles.periodMenu}>
              {periods.map((p) => (
                <Pressable
                  key={p}
                  style={[styles.periodItem, p === period && styles.periodItemActive]}
                  onPress={() => {
                    onPeriodChange(p);
                    setPeriodOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.periodItemText,
                      p === period && styles.periodItemTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Chart */}
      {data.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : plotWidth > 0 ? (
        <View style={styles.chartWrapper}>
          <LineChart
            data={chartData}
            height={CHART_HEIGHT}
            width={plotWidth}
            spacing={dataSpacing}
            initialSpacing={0}
            endSpacing={0}
            yAxisLabelWidth={Y_AXIS_WIDTH}
            color={colors.primary}
            thickness={2}
            dataPointsColor={colors.primary}
            dataPointsRadius={4}
            noOfSections={2}
            yAxisOffset={minVal}
            formatYLabel={(val) => formatValue(Number(val))}
            rulesColor={colors.border}
            yAxisColor="transparent"
            xAxisColor={colors.border}
            yAxisTextStyle={yAxisTextStyle}
            xAxisLabelTextStyle={xAxisTextStyle}
            backgroundColor="transparent"
            disableScroll
            focusEnabled
            showDataPointOnFocus
            focusedDataPointRadius={6}
            focusedDataPointColor={colors.text}
            unFocusOnPressOut={false}
            onFocus={(_item: lineDataItem, index: number) => {
              setSelectedIndex(index);
            }}
            areaChart
            startFillColor={colors.primary}
            endFillColor="transparent"
            startOpacity={0.15}
            endOpacity={0}
          />
        </View>
      ) : null}

      {/* Metric chips */}
      {metrics && onMetricChange && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {metrics.map((m, i) => (
            <Chip
              key={m}
              label={m}
              active={activeMetric === i}
              onPress={() => onMetricChange(i)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const yAxisTextStyle = { color: colors.textMuted, fontSize: fontSize.xs };
const xAxisTextStyle = { color: colors.textMuted, fontSize: fontSize.xs };

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: CONTAINER_PADDING,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  metricLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  headerDate: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  periodDropdown: {
    marginTop: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  periodText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  periodMenu: {
    position: 'absolute',
    top: 52,
    right: 0,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 10,
    minWidth: 120,
  },
  periodItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  periodItemActive: {
    backgroundColor: colors.primaryLight,
  },
  periodItemText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  periodItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 30,
  },
  chartWrapper: {
    marginBottom: spacing.sm,
  },
  chipRow: {
    paddingTop: spacing.md,
  },
});
