import { ScrollView, StyleSheet } from 'react-native';
import { spacing } from '@/constants/theme';
import { Chip } from '@/components/ui/Chip/Chip';

interface MetricSelectorProps {
  metrics: string[];
  activeMetric: number;
  onMetricChange: (index: number) => void;
}

export function MetricSelector({
  metrics,
  activeMetric,
  onMetricChange,
}: MetricSelectorProps) {
  return (
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
          borderRadius={spacing.md}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    paddingTop: spacing.md,
  },
});
