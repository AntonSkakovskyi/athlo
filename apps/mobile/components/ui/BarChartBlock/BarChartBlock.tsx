import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import { BarChart, type barDataItem } from 'react-native-gifted-charts';
import { colors, borderRadius, spacing, fontSize } from '@/constants/theme';
import { PeriodSelector } from './PeriodSelector/PeriodSelector';
import { MetricSelector } from './MetricSelector/MetricSelector';

interface DataPoint {
  label: string;
  headerLabel?: string;
  value: number;
  date: string;
}

interface BarChartBlockProps {
  metricLabel: string;
  data: DataPoint[];
  period: string;
  onPeriodChange: (period: string) => void;
  periods: string[];
  formatValue?: (value: number) => string;
  emptyText?: string;
  metrics?: string[];
  activeMetric?: number;
  onMetricChange?: (index: number) => void;
}

const CHART_HEIGHT = 160;
const CONTAINER_PADDING = spacing.lg;
const Y_AXIS_WIDTH = 45;

export function BarChartBlock({
  metricLabel,
  data,
  period,
  onPeriodChange,
  periods,
  formatValue = (v) => String(Math.round(v * 10) / 10),
  emptyText = 'No data available',
  metrics,
  activeMetric,
  onMetricChange,
}: BarChartBlockProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const displayPoint = useMemo(() => {
    if (data.length === 0) return null;
    const idx = selectedIndex ?? data.length - 1;
    return data[idx];
  }, [data, selectedIndex]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const chartData: barDataItem[] = useMemo(() => {
    if (data.length === 0) return [];

    const shouldShowLabel = (i: number) => {
      if (data.length <= 8) return true;
      if (data.length <= 15) return i % 2 === 0;
      return i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1;
    };

    return data.map((d, i) => ({
      value: d.value,
      label: shouldShowLabel(i) ? d.label : '',
      frontColor: selectedIndex === i ? colors.primary : colors.primary + '80', // semi-transparent if not selected
      onPress: () => setSelectedIndex(i),
    }));
  }, [data, selectedIndex]);

  const plotWidth = containerWidth > 0
    ? containerWidth - CONTAINER_PADDING * 2 - Y_AXIS_WIDTH
    : 0;

  const barWidth = useMemo(() => {
    if (data.length === 0 || plotWidth <= 0) return 30;
    const availableWidth = plotWidth - 20; // some margin
    const width = (availableWidth / data.length) - 4; // gap
    return Math.max(width, 4);
  }, [data.length, plotWidth]);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.metricLabel}>{metricLabel}</Text>
          {displayPoint && (
            <Text style={styles.headerValue}>
              {formatValue(displayPoint.value)}
              <Text style={styles.headerDate}> · {displayPoint.headerLabel || displayPoint.label}</Text>
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <PeriodSelector
            period={period}
            periods={periods}
            open={periodOpen}
            onToggle={() => setPeriodOpen(!periodOpen)}
            onSelect={(p) => { onPeriodChange(p); setPeriodOpen(false); }}
          />
        </View>
      </View>

      {/* Chart */}
      {data.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : plotWidth > 0 ? (
        <View style={styles.chartWrapper}>
          <BarChart
            data={chartData}
            height={CHART_HEIGHT}
            width={plotWidth}
            barWidth={barWidth}
            initialSpacing={10}
            spacing={4}
            yAxisLabelWidth={Y_AXIS_WIDTH}
            noOfSections={3}
            formatYLabel={(val) => formatValue(Number(val))}
            rulesColor={colors.border}
            yAxisColor="transparent"
            xAxisColor={colors.border}
            yAxisTextStyle={yAxisTextStyle}
            xAxisLabelTextStyle={xAxisTextStyle}
            backgroundColor="transparent"
            disableScroll
            hideRules={false}
            showGradient
            gradientColor={colors.primary}
          />
        </View>
      ) : null}

      {/* Metric chips */}
      {metrics && onMetricChange && activeMetric !== undefined && (
        <MetricSelector
          metrics={metrics}
          activeMetric={activeMetric}
          onMetricChange={onMetricChange}
        />
      )}
    </View>
  );
}

const yAxisTextStyle = { color: colors.textMuted, fontSize: 10 };
const xAxisTextStyle = { color: colors.textMuted, fontSize: 10 };

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
  headerLeft: {
    flex: 1,
  },
  metricLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerDate: {
    fontSize: fontSize.sm,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 30,
  },
  chartWrapper: {
    marginBottom: spacing.sm,
    marginLeft: -10, // Adjust for Y-axis labels
  },
});
