import { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface DayItem {
  id: number;
  dayNumber: number;
}

interface DayTabsRowProps {
  days: DayItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onAddDay?: () => void;
  onRemoveDay?: (dayId: number) => void;
}

export function DayTabsRow({ days, selectedIndex, onSelect, onAddDay, onRemoveDay }: DayTabsRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleLongPress = (dayId: number) => {
    onRemoveDay?.(dayId);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {days.map((day, index) => (
          <Pressable
            key={day.id}
            style={[styles.tab, index === selectedIndex && styles.tabActive]}
            onPress={() => onSelect(index)}
            onLongPress={onRemoveDay ? () => handleLongPress(day.id) : undefined}
          >
            <Text style={[styles.tabText, index === selectedIndex && styles.tabTextActive]}>
              Day {day.dayNumber}
            </Text>
          </Pressable>
        ))}
        {onAddDay && (
          <Pressable style={styles.addTab} onPress={onAddDay}>
            <Text style={styles.addTabText}>+ Add Day</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    wrapper: {
      marginBottom: spacing.md,
    },
    container: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    tab: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    tabActive: {
      backgroundColor: c.primaryLight,
      borderColor: c.primary,
    },
    tabText: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
      fontWeight: fontWeight.medium,
    },
    tabTextActive: {
      color: c.primary,
      fontWeight: fontWeight.semibold,
    },
    addTab: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: 'dashed',
    },
    addTabText: {
      fontSize: fontSize.sm,
      color: c.textMuted,
      fontWeight: fontWeight.medium,
    },
  });
}
