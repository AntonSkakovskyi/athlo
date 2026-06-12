import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import { BarChart, type barDataItem } from 'react-native-gifted-charts';
import { borderRadius, spacing, fontSize } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { PeriodSelector } from './PeriodSelector/PeriodSelector';
import { MetricSelector } from './MetricSelector/MetricSelector';
import { Spinner } from '../Spinner/Spinner';

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
  isLoading?: boolean;
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
  isLoading,
}: BarChartBlockProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const axisTextStyle = useMemo(() => ({ color: colors.textMuted, fontSize: 10 }), [colors]);
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
    return data.map((d, i) => ({
      value: d.value,
      frontColor: selectedIndex === i ? colors.primary : colors.primary + '80',
      onPress: () => setSelectedIndex(i),
    }));
  }, [data, selectedIndex, colors]);

  const xAxisLabels = useMemo(() => {
    if (data.length === 0) return [];
    if (data.length <= 3) return data.map((d) => d.label);
    return [
      data[0].label,
      data[Math.floor(data.length / 2)].label,
      data[data.length - 1].label,
    ];
  }, [data]);

  const plotWidth = containerWidth > 0
    ? containerWidth - CONTAINER_PADDING * 2 - Y_AXIS_WIDTH
    : 0;

  const barWidth = useMemo(() => {
    if (data.length === 0 || plotWidth <= 0) return 30;
    const availableWidth = plotWidth - 20; // some margin
    const width = (availableWidth / data.length) - 4; // gap
    return Math.max(width, 4);
  }, [data.length, plotWidth]);

  const hasContent = isLoading || data.length > 0;

  return (
    <View style={[styles.container, hasContent && styles.containerFull]} onLayout={handleLayout}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Spinner size="small" />
        </View>
      ) : data.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : (
        <>
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

          {plotWidth > 0 && (
            <View style={styles.chartWrapper}>
              <BarChart
                data={chartData}
                height={CHART_HEIGHT}
                width={plotWidth}
                barWidth={barWidth}
                spacing={4}
                yAxisLabelWidth={Y_AXIS_WIDTH}
                noOfSections={3}
                formatYLabel={(val) => formatValue(Number(val))}
                rulesColor={colors.border}
                yAxisColor="transparent"
                xAxisColor={colors.border}
                yAxisTextStyle={axisTextStyle}
                backgroundColor="transparent"
                disableScroll
                hideRules={false}
                showGradient
                gradientColor={colors.primary}
              />
              <View style={styles.xAxis}>
                {xAxisLabels.map((label, i) => (
                  <Text key={i} style={styles.xLabel}>{label}</Text>
                ))}
              </View>
            </View>
          )}

          {metrics && onMetricChange && activeMetric !== undefined && (
            <MetricSelector
              metrics={metrics}
              activeMetric={activeMetric}
              onMetricChange={onMetricChange}
            />
          )}
        </>
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
    containerFull: {
      minHeight: 250,
    },
    loadingContainer: {
      height: CHART_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
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
      color: c.textSecondary,
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
      color: c.text,
    },
    headerDate: {
      fontSize: fontSize.sm,
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
      marginLeft: -10,
    },
    xAxis: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginLeft: Y_AXIS_WIDTH,
    },
    xLabel: {
      fontSize: 10,
      color: c.textMuted,
    },
  });
}
