import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { borderRadius, spacing, fontSize } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 140;

  const displayIndex = selectedIndex ?? data.length - 1;
  const displayPoint = data[displayIndex];

  const handleBarPress = (index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerValue, { color }]}>{formatValueFull(displayPoint.value, unit)}</Text>
        <Text style={styles.headerDate}>{displayPoint.label ?? formatDate(displayPoint.date)}</Text>
      </View>

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
          {data.map((point, index) => {
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
        {data.length > 0 && (
          <>
            <Text style={styles.xLabel}>{data[0].label ?? formatDate(data[0].date)}</Text>
            {data.length > 2 && (
              <Text style={styles.xLabel}>
                {(() => { const m = data[Math.floor(data.length / 2)]; return m.label ?? formatDate(m.date); })()}
              </Text>
            )}
            <Text style={styles.xLabel}>
              {(() => { const l = data[data.length - 1]; return l.label ?? formatDate(l.date); })()}
            </Text>
          </>
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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: spacing.md,
    },
    headerValue: {
      fontSize: fontSize.xl,
      fontWeight: '700',
    },
    headerDate: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
    },
    yAxis: {
      position: 'absolute',
      left: spacing.sm,
      top: 52, // header height (~32) + marginBottom (spacing.md)
      bottom: spacing['3xl'],
      justifyContent: 'space-between',
      zIndex: 1,
    },
    yLabel: {
      fontSize: fontSize.xs,
      color: c.textMuted,
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
      backgroundColor: c.border,
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
      color: c.textMuted,
    },
  });
}
