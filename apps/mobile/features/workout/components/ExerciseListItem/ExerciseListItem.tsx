import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    itemSelected: {
      borderColor: c.primary,
      backgroundColor: c.primary + '10', // Consistent with picker filters
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
      color: c.text,
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
      color: c.textMuted,
    },
    rightBtn: {
      padding: spacing.sm,
      marginLeft: spacing.sm,
      backgroundColor: c.surfaceLight,
      borderRadius: borderRadius.sm,
    },
  });
}
