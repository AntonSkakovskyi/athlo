import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '@/constants/theme';

interface DataPoint {
  date: string;
  value: number;
}

interface NutritionBarChartProps {
  data: DataPoint[];
  color: string;
  unit: string;
}

export function NutritionBarChart({ data, color, unit }: NutritionBarChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 140;

  // Show max ~14 bars, downsample if needed
  const displayData = data.length > 14 ? downsample(data, 14) : data;

  return (
    <View style={styles.container}>
      {/* Y-axis labels */}
      <View style={styles.yAxis}>
        <Text style={styles.yLabel}>{formatValue(maxValue, unit)}</Text>
        <Text style={styles.yLabel}>{formatValue(maxValue / 2, unit)}</Text>
        <Text style={styles.yLabel}>0</Text>
      </View>

      {/* Bars */}
      <View style={[styles.chartArea, { height: chartHeight }]}>
        {/* Grid lines */}
        <View style={[styles.gridLine, { top: 0 }]} />
        <View style={[styles.gridLine, { top: chartHeight / 2 }]} />
        <View style={[styles.gridLine, { top: chartHeight - 1 }]} />

        {/* Bar container */}
        <View style={styles.barsContainer}>
          {displayData.map((point, index) => {
            const barHeight = (point.value / maxValue) * chartHeight;
            return (
              <View key={index} style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, 2),
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* X-axis labels */}
      <View style={styles.xAxis}>
        {displayData.length > 0 && (
          <>
            <Text style={styles.xLabel}>{formatDate(displayData[0].date)}</Text>
            {displayData.length > 2 && (
              <Text style={styles.xLabel}>
                {formatDate(displayData[Math.floor(displayData.length / 2)].date)}
              </Text>
            )}
            <Text style={styles.xLabel}>
              {formatDate(displayData[displayData.length - 1].date)}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

function downsample(data: DataPoint[], targetCount: number): DataPoint[] {
  const step = Math.ceil(data.length / targetCount);
  const result: DataPoint[] = [];
  for (let i = 0; i < data.length; i += step) {
    const chunk = data.slice(i, i + step);
    const avgValue = chunk.reduce((sum, d) => sum + d.value, 0) / chunk.length;
    result.push({ date: chunk[0].date, value: avgValue });
  }
  return result;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatValue(value: number, unit: string): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${Math.round(value)}`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yAxis: {
    position: 'absolute',
    left: spacing.sm,
    top: spacing.lg,
    bottom: spacing['3xl'],
    justifyContent: 'space-between',
    zIndex: 1,
  },
  yLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  chartArea: {
    marginLeft: 40,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: '70%',
    borderRadius: 3,
    minWidth: 4,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 40,
    marginTop: spacing.sm,
  },
  xLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
