import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '@/constants/theme';

interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

interface NutritionBarChartProps {
  data: DataPoint[];
  color: string;
  unit: string;
}

export function NutritionBarChart({ data, color, unit }: NutritionBarChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 140;

  const displayData = data;
  const selected = selectedIndex !== null ? displayData[selectedIndex] : null;

  const handleBarPress = (index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <View>
    <View style={styles.container}>
      {/* Y-axis labels */}
      <View style={styles.yAxis}>
        <Text style={styles.yLabel}>{formatValue(maxValue)}</Text>
        <Text style={styles.yLabel}>{formatValue(maxValue / 2)}</Text>
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
            const isSelected = selectedIndex === index;
            return (
              <Pressable key={index} style={styles.barWrapper} onPress={() => handleBarPress(index)}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, 2),
                      backgroundColor: color,
                      opacity: selectedIndex === null || isSelected ? 1 : 0.4,
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* X-axis labels */}
      <View style={styles.xAxis}>
        {displayData.length > 0 && (
          <>
            <Text style={styles.xLabel}>{displayData[0].label ?? formatDate(displayData[0].date)}</Text>
            {displayData.length > 2 && (
              <Text style={styles.xLabel}>
                {(() => { const m = displayData[Math.floor(displayData.length / 2)]; return m.label ?? formatDate(m.date); })()}
              </Text>
            )}
            <Text style={styles.xLabel}>
              {(() => { const l = displayData[displayData.length - 1]; return l.label ?? formatDate(l.date); })()}
            </Text>
          </>
        )}
      </View>

    </View>

    {/* Detail panel — sibling of chart card, fixed height */}
    <View style={styles.detailPanel}>
      {selected ? (
        <>
          <Text style={styles.detailDate}>{selected.label ?? formatDate(selected.date)}</Text>
          <Text style={[styles.detailValue, { color }]}>{formatValueFull(selected.value, unit)}</Text>
        </>
      ) : (
        <Text style={styles.detailHint}>Tap a bar for details</Text>
      )}
    </View>
    </View>
  );
}


function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatValue(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${Math.round(value)}`;
}

function formatValueFull(value: number, unit: string): string {
  return `${Math.round(value)} ${unit}`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailPanel: {
    height: 44,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  detailDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  detailHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    flex: 1,
    textAlign: 'center',
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
