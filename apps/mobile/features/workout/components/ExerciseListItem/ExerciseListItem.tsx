import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { RadioCircle } from '@/components/ui/RadioCircle/RadioCircle';
import { Tag } from '@/components/ui/Tag/Tag';

interface ExerciseListItemProps {
  name: string;
  trackingIcon: string;
  equipment?: string;
  muscles?: string;
  selected: boolean;
  onPress: () => void;
}

export function ExerciseListItem({
  name,
  trackingIcon,
  equipment,
  muscles,
  selected,
  onPress,
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
      <RadioCircle selected={selected} size={24} />
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
    backgroundColor: colors.primaryLight,
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
});
