import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius } from '@/constants/theme';

interface ChartBarProps {
  value: number;
  maxValue: number;
  label: string;
}

export function ChartBar({ value, maxValue, label }: ChartBarProps) {
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

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text,
  },
  blockSummary: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 6,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
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
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
});
