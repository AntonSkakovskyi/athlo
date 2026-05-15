import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, borderRadius } from '@/constants/theme';

interface SegmentControlProps {
  segments: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function SegmentControl({ segments, activeIndex, onSelect }: SegmentControlProps) {
  return (
    <View style={styles.container}>
      {segments.map((seg, i) => (
        <Pressable
          key={seg}
          style={[styles.segment, activeIndex === i && styles.segmentActive]}
          onPress={() => onSelect(i)}
        >
          <Text style={[styles.text, activeIndex === i && styles.textActive]}>
            {seg}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  text: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  textActive: {
    color: colors.text,
    fontWeight: '600',
  },
});
