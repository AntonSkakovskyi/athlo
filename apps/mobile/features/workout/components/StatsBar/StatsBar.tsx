import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius } from '@/constants/theme';

interface StatsBarProps {
  duration: string;
  volume: number;
  completedSets: number;
  totalSets: number;
}

export function StatsBar({ duration, volume, completedSets, totalSets }: StatsBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.icon}>⏱️</Text>
        <Text style={styles.value}>{duration}</Text>
        <Text style={styles.label}>Duration</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.icon}>🏋️</Text>
        <Text style={styles.value}>{volume.toLocaleString()} kg</Text>
        <Text style={styles.label}>Volume</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.icon}>✅</Text>
        <Text style={styles.value}>{completedSets}/{totalSets}</Text>
        <Text style={styles.label}>Sets</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
});
