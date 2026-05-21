import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface SegmentControlProps {
  segments: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
  style?: StyleProp<ViewStyle>;
}

export function SegmentControl({ segments, activeIndex, onSelect, style }: SegmentControlProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.container, style]}>
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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: c.surface,
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
      backgroundColor: c.surfaceLight,
    },
    text: {
      fontSize: 14,
      color: c.textMuted,
      fontWeight: '500',
    },
    textActive: {
      color: c.text,
      fontWeight: '600',
    },
  });
}
