import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Tag } from '@/components/ui/Tag/Tag';
import { Ionicons } from '@expo/vector-icons';

interface ExerciseListItemProps {
  name: string;
  trackingIcon: string;
  equipment?: string;
  muscles?: string;
  selected: boolean;
  onPress: () => void;
  onRightIconPress?: () => void;
  rightIconName?: keyof typeof Ionicons.glyphMap;
}

export function ExerciseListItem({
  name,
  trackingIcon,
  equipment,
  muscles,
  selected,
  onPress,
  onRightIconPress,
  rightIconName = 'stats-chart',
}: ExerciseListItemProps) {
  return (
    <Pressable
      style={[styles.item, selected && styles.itemSelected]}
      onPress={onPress}
    >
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.icon}>{trackingIcon}</Text>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
        </View>
        <View style={styles.tags}>
          {equipment && <Tag label={equipment} />}
          {muscles ? <Text style={styles.muscleText}>{muscles}</Text> : null}
        </View>
      </View>
      
      <Pressable 
        style={styles.rightBtn} 
        onPress={(e) => {
          e.stopPropagation();
          onRightIconPress?.();
        }}
        hitSlop={8}
      >
        <Ionicons name={rightIconName} size={20} color={colors.primary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10', // Consistent with picker filters
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: fontSize.lg,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  muscleText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  rightBtn: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
  },
});
