import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { borderRadius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface ChartBarProps {
  value: number;
  maxValue: number;
  label: string;
}

export function ChartBar({ value, maxValue, label }: ChartBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const height = maxValue > 0 ? Math.max((value / maxValue) * 100, 4) : 4;
  return (
    <View style={styles.barWrapper}>
      <View style={styles.barContainer}>
        <View style={[styles.bar, { height: `${height}%` }]} />
      </View>
      <Text style={styles.barLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

interface ChartBlockProps {
  title: string;
  summaryValue: string;
  data: { label: string; value: number }[];
  emptyText?: string;
}

export function ChartBlock({ title, summaryValue, data, emptyText }: ChartBlockProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  return (
    <View style={styles.block}>
      <View style={styles.blockHeader}>
        <Text style={styles.blockTitle}>{title}</Text>
        <Text style={styles.blockSummary}>{summaryValue}</Text>
      </View>
      {data.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText ?? 'No data'}</Text>
      ) : (
        <View style={styles.chartArea}>
          {data.map((item, i) => (
            <ChartBar key={i} value={item.value} maxValue={maxValue} label={item.label} />
          ))}
        </View>
      )}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    block: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    blockHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    blockTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    blockSummary: {
      fontSize: 14,
      fontWeight: '700',
      color: c.primary,
    },
    chartArea: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: 120,
      gap: 6,
    },
    emptyText: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.xl,
    },
    barWrapper: {
      flex: 1,
      alignItems: 'center',
    },
    barContainer: {
      flex: 1,
      width: '100%',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    bar: {
      width: '70%',
      backgroundColor: c.primary,
      borderRadius: borderRadius.sm,
      minHeight: 4,
    },
    barLabel: {
      fontSize: 10,
      color: c.textMuted,
      marginTop: 6,
      textAlign: 'center',
    },
  });
}
