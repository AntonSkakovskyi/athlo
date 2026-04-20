import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius } from '../../constants/theme';

interface WorkoutHistoryCardProps {
  name: string;
  date: string;
  duration: string;
  volume: number;
  exerciseCount: number;
  onPress?: () => void;
}

export function WorkoutHistoryCard({
  name,
  date,
  duration,
  volume,
  exerciseCount,
  onPress,
}: WorkoutHistoryCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{duration}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{volume.toLocaleString()} kg</Text>
          <Text style={styles.statLabel}>Volume</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{exerciseCount}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  date: {
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: 8,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
});
