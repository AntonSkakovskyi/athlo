import { View, StyleSheet, Pressable } from 'react-native';
import { MetricCard } from '@/components/ui/MetricCard/MetricCard';

interface MetricsRowProps {
  displayDuration: string;
  totalVolume: number;
  exercisesCount: number;
  completedSets: number;
  isEditing: boolean;
  onOpenDurationPicker: () => void;
}

export function MetricsRow({
  displayDuration,
  totalVolume,
  exercisesCount,
  completedSets,
  isEditing,
  onOpenDurationPicker,
}: MetricsRowProps) {
  return (
    <View style={styles.metricsGrid}>
      <View style={styles.metricsRow}>
        <Pressable
          style={styles.metricItem}
          onPress={() => isEditing && onOpenDurationPicker()}
          disabled={!isEditing}
        >
          <MetricCard icon="⏱️" value={displayDuration} label="Duration" />
        </Pressable>
        <View style={styles.metricItem}>
          <MetricCard icon="🏋️" value={`${totalVolume.toLocaleString()} kg`} label="Volume" />
        </View>
      </View>
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <MetricCard icon="💪" value={String(exercisesCount)} label="Exercises" />
        </View>
        <View style={styles.metricItem}>
          <MetricCard icon="✅" value={String(completedSets)} label="Sets" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metricsGrid: {
    gap: 12,
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricItem: {
    flex: 1,
  },
});
