import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import { LineChart, type lineDataItem } from 'react-native-gifted-charts';
import { borderRadius, spacing, fontSize } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { PeriodSelector } from './PeriodSelector/PeriodSelector';
import { MetricSelector } from './MetricSelector/MetricSelector';

interface DataPoint {
  date: string;
  value: number;
  label?: string;
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
  formatDate,
  emptyText = 'No data available',
  metrics,
  activeMetric,
  onMetricChange,
}: LineChartBlockProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const axisTextStyle = useMemo(() => ({ color: colors.textMuted, fontSize: fontSize.xs }), [colors]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const displayFormatDate = useCallback((d: string) => {
    if (formatDate) return formatDate(d);
    const date = new Date(d);
    if (period === '1 Year' || period === 'All Time') {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [formatDate, period]);

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

  const plotWidth = containerWidth > 0
    ? containerWidth - CONTAINER_PADDING * 2 - Y_AXIS_WIDTH
    : 0;

  const chartData: lineDataItem[] = useMemo(() => {
    if (data.length === 0) return [];

    // Aim for one label every ~70 pixels
    const maxLabels = plotWidth > 0 ? Math.floor(plotWidth / 70) : 5;
    const skip = Math.max(1, Math.ceil(data.length / maxLabels));

    const shouldShowLabel = (i: number) => {
      if (data.length <= maxLabels && plotWidth > 0) return true;
      return i % skip === 0 || i === data.length - 1;
    };

    return data.map((d, i) => ({
      value: d.value,
      label: shouldShowLabel(i) ? (d.label ?? displayFormatDate(d.date)) : '',
    }));
  }, [data, displayFormatDate, plotWidth]);

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
              <Text style={styles.headerDate}>· {displayFormatDate(displayPoint.date)}</Text>
            </Text>
          )}
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
            yAxisTextStyle={axisTextStyle}
            xAxisLabelTextStyle={axisTextStyle}
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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: CONTAINER_PADDING,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
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
      color: c.text,
      flex: 1,
    },
    headerRight: {
      alignItems: 'flex-end',
    },
    headerValue: {
      fontSize: 14,
      fontWeight: '700',
      color: c.primary,
    },
    headerDate: {
      fontSize: 12,
      fontWeight: '400',
      color: c.textSecondary,
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: c.textMuted,
      textAlign: 'center',
      paddingVertical: 30,
    },
    chartWrapper: {
      marginBottom: spacing.sm,
    },
  });
}
