import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, borderRadius } from '../../constants/theme';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active = false, onPress }: ChipProps) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

interface SegmentControlProps {
  segments: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function SegmentControl({ segments, activeIndex, onSelect }: SegmentControlProps) {
  return (
    <View style={styles.segmentContainer}>
      {segments.map((seg, i) => (
        <Pressable
          key={seg}
          style={[styles.segment, activeIndex === i && styles.segmentActive]}
          onPress={() => onSelect(i)}
        >
          <Text style={[styles.segmentText, activeIndex === i && styles.segmentTextActive]}>
            {seg}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  segmentActive: {
    backgroundColor: colors.surfaceLight,
  },
  segmentText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
});
