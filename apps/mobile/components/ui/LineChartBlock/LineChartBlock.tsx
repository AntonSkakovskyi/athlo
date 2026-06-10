import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import { LineChart, type lineDataItem } from 'react-native-gifted-charts';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { PeriodSelector } from './PeriodSelector/PeriodSelector';
import { MetricSelector } from './MetricSelector/MetricSelector';

export interface DataPoint {
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
  lineColor?: string;
  goalValue?: number;
  goalLabel?: string;
  goalColor?: string;
}

const CHART_HEIGHT = 180;
const CONTAINER_PADDING = spacing.lg;
const Y_AXIS_WIDTH = 48;

function calculateNiceStep(range: number, targetSteps: number): number {
  if (range <= 0 || isNaN(range)) return 10;
  const rawStep = range / targetSteps;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const factor = rawStep / mag;
  let niceFactor: number;
  if (factor < 1.5) niceFactor = 1;
  else if (factor < 3) niceFactor = 2;
  else if (factor < 7) niceFactor = 5;
  else niceFactor = 10;
  return niceFactor * mag;
}

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
  lineColor,
  goalValue,
  goalLabel,
  goalColor,
}: LineChartBlockProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const resolvedColor = lineColor ?? colors.primary;
  const resolvedGoalColor = goalColor ?? colors.warning;

  const axisTextStyle = useMemo(() => ({
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: fontWeight.regular,
  }), [colors]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    setSelectedIndex(null);
  }, [data]);

  const displayFormatDate = useCallback((d: string) => {
    if (formatDate) return formatDate(d);
    const date = new Date(d);
    if (period === '1 Year' || period === 'All Time') {
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [formatDate, period]);

  const { min, max, stepValue, noOfSections } = useMemo(() => {
    if (data.length === 0) return { min: 0, max: 100, stepValue: 50, noOfSections: 2 };
    const values = data.map((d) => d.value);
    let mn = Math.min(...values);
    let mx = Math.max(...values);

    if (mn === mx) {
      mn = mn > 0 ? mn * 0.8 : 0;
      mx = mx > 0 ? mx * 1.2 : 100;
    } else {
      const diff = mx - mn;
      mn = Math.max(0, mn - diff * 0.15);
      mx = mx + diff * 0.15;
    }

    const niceStep = calculateNiceStep(mx - mn, 4);
    const niceMin = Math.floor(mn / niceStep) * niceStep;
    const niceMax = Math.ceil(mx / niceStep) * niceStep;
    const sections = Math.ceil((niceMax - niceMin) / niceStep) || 1;

    return {
      min: niceMin,
      max: niceMin + sections * niceStep,
      stepValue: niceStep,
      noOfSections: sections
    };
  }, [data]);

  const activePoint = useMemo(() => {
    if (data.length === 0) return null;
    const idx = selectedIndex !== null ? selectedIndex : data.length - 1;
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

    const maxLabels = plotWidth > 0 ? Math.max(1, Math.floor(plotWidth / 70)) : 4;
    const skip = Math.max(1, Math.ceil(data.length / maxLabels));

    return data.map((d, i) => {
      const isSelected = selectedIndex === i || (selectedIndex === null && i === data.length - 1);

      let shouldShowLabel = false;
      if (i === 0 || i === data.length - 1) {
        shouldShowLabel = true;
      } else if (skip > 1) {
        shouldShowLabel = (i % skip === 0) && (data.length - 1 - i > skip / 2);
      } else {
        shouldShowLabel = true;
      }

      let ml = -30;
      let ta: 'left' | 'center' | 'right' = 'center';
      if (i === 0) { ml = 0; ta = 'left'; }
      else if (i === data.length - 1) { ml = -60; ta = 'right'; }

      return {
        value: d.value,
        label: shouldShowLabel ? (d.label ?? displayFormatDate(d.date)) : '',
        labelTextStyle: {
          ...axisTextStyle,
          width: 60,
          marginLeft: ml,
          textAlign: ta,
        },
        focusedDataPointColor: resolvedColor,
        dataPointColor: isSelected ? resolvedColor : resolvedColor + '80',
        dataPointRadius: isSelected ? 5 : 3,
        hideDataPoint: !isSelected && data.length > 14,
      };
    });
  }, [data, displayFormatDate, plotWidth, selectedIndex, axisTextStyle, resolvedColor]);

  const dataSpacing = useMemo(() => {
    if (data.length <= 1 || plotWidth <= 0) return 50;
    const availableWidth = Math.max(0, plotWidth - 40); // 20px initial, 20px end
    return availableWidth / (data.length - 1);
  }, [data.length, plotWidth]);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.metricLabel}>{metricLabel}</Text>
          {activePoint && (
            <View style={styles.valueRow}>
              <Text style={styles.currentValue}>{formatValue(activePoint.value)}</Text>
              <Text style={styles.currentDate}>{displayFormatDate(activePoint.date)}</Text>
            </View>
          )}
        </View>

        {data.length > 0 && (
          <PeriodSelector
            period={period}
            periods={periods}
            open={periodOpen}
            onToggle={() => setPeriodOpen(!periodOpen)}
            onSelect={(p) => { onPeriodChange(p); setPeriodOpen(false); }}
          />
        )}
      </View>

      {/* Chart Section */}
      <View style={styles.chartContainer}>
        {data.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        ) : data.length < 2 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Record at least 2 measurements to display the chart</Text>
          </View>
        ) : plotWidth > 0 ? (
          <LineChart
            data={chartData}
            height={CHART_HEIGHT}
            width={plotWidth}
            spacing={dataSpacing}
            initialSpacing={20}
            endSpacing={20}

            // Y-Axis
            yAxisThickness={0}
            yAxisLabelWidth={Y_AXIS_WIDTH}
            yAxisTextStyle={axisTextStyle}
            yAxisOffset={min}
            maxValue={max - min}
            noOfSections={noOfSections}
            stepValue={stepValue}
            formatYLabel={(val) => formatValue(Math.round(Number(val) * 1000) / 1000)}

            // X-Axis
            xAxisThickness={1}
            xAxisColor={colors.border}
            xAxisLabelTextStyle={axisTextStyle}

            // Line Styling
            color={resolvedColor}
            thickness={3}

            // Area Styling
            areaChart
            startFillColor={resolvedColor}
            endFillColor={resolvedColor}
            startOpacity={0.2}
            endOpacity={0.01}

            // Interaction
            focusEnabled
            showDataPointOnFocus
            focusedDataPointRadius={7}
            focusedDataPointColor={resolvedColor}
            unFocusOnPressOut={false}
            onFocus={(_item: lineDataItem, index: number) => {
              setSelectedIndex(index);
            }}

            // Grid
            rulesType="solid"
            rulesColor={colors.border + '40'}
            hideRules={false}

            // Reference / Goal line
            showReferenceLine1={goalValue !== undefined}
            referenceLine1Position={goalValue ?? 0}
            referenceLine1Config={{
              color: resolvedGoalColor,
              thickness: 1,
              type: 'dashed',
              dashWidth: 6,
              dashGap: 4,
              labelText: goalLabel,
              labelTextStyle: {
                color: resolvedGoalColor,
                fontSize: fontSize.xs,
                fontWeight: fontWeight.regular,
              },
            }}

            // Animation
            isAnimated
            animationDuration={1000}

            // Misc
            disableScroll
            backgroundColor="transparent"
          />
        ) : null}
      </View>

      {/* Metric Selector (Optional Footer) */}
      {data.length > 0 && metrics && onMetricChange && activeMetric !== undefined && (
        <View style={styles.footer}>
          <MetricSelector
            metrics={metrics}
            activeMetric={activeMetric}
            onMetricChange={onMetricChange}
          />
        </View>
      )}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.xl,
      padding: CONTAINER_PADDING,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xl,
    },
    headerLeft: {
      flex: 1,
    },
    metricLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.bold,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: spacing.xs,
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.sm,
    },
    currentValue: {
      fontSize: fontSize['2xl'],
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    currentDate: {
      fontSize: fontSize.sm,
      color: c.textMuted,
    },
    chartContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -4,
    },
    emptyContainer: {
      height: CHART_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: c.textMuted,
      fontStyle: 'italic',
    },
    footer: {
      marginTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border + '40',
    },
  });
}
