import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';

interface DayItem {
  id: number;
  dayNumber: number;
}

interface DayTabsRowProps {
  days: DayItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onAddDay: () => void;
  onRemoveDay: (dayId: number) => void;
}

export function DayTabsRow({ days, selectedIndex, onSelect, onAddDay, onRemoveDay }: DayTabsRowProps) {
  const handleLongPress = (dayId: number) => {
    onRemoveDay(dayId);
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
            onLongPress={() => handleLongPress(day.id)}
          >
            <Text style={[styles.tabText, index === selectedIndex && styles.tabTextActive]}>
              Day {day.dayNumber}
            </Text>
          </Pressable>
        ))}
        <Pressable style={styles.addTab} onPress={onAddDay}>
          <Text style={styles.addTabText}>+ Add Day</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  addTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addTabText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
});
