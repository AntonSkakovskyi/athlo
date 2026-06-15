import { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { borderRadius, fontSize, spacing, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { ICONS } from '@/utils/icons';
import { BottomSheet } from '@/components/ui';
import { SetSummaryList } from './SetSummaryList';
import { StatBadge } from './StatBadge/StatBadge';
import { MenuItem } from './MenuItem/MenuItem';

export interface ExerciseSetSummary {
  exerciseName: string;
  setsCount: number;
}

interface WorkoutHistoryCardProps {
  name: string;
  date: string;
  duration: string;
  volume: number;
  exerciseCount: number;
  sets?: ExerciseSetSummary[];
  onPress?: () => void;
  onSaveAsTemplate?: () => void;
  isSavingAsTemplate?: boolean;
  onCopyWorkout?: () => void;
  isCopyingWorkout?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function WorkoutHistoryCard({
  name,
  date,
  duration,
  volume,
  exerciseCount,
  sets = [],
  onPress,
  onSaveAsTemplate,
  isSavingAsTemplate = false,
  onCopyWorkout,
  isCopyingWorkout = false,
  onEdit,
  onDelete,
}: WorkoutHistoryCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [menuVisible, setMenuVisible] = useState(false);
  const wasSavingRef = useRef(false);
  const wasCopyingRef = useRef(false);

  useEffect(() => {
    if (wasSavingRef.current && !isSavingAsTemplate) {
      setMenuVisible(false);
    }
    wasSavingRef.current = isSavingAsTemplate;
  }, [isSavingAsTemplate]);

  useEffect(() => {
    if (wasCopyingRef.current && !isCopyingWorkout) {
      setMenuVisible(false);
    }
    wasCopyingRef.current = isCopyingWorkout;
  }, [isCopyingWorkout]);

  const preview = sets.slice(0, 3);
  const hasMore = exerciseCount > 3;
  const hasMenu = !!(onSaveAsTemplate || onCopyWorkout || onEdit || onDelete);

  const closeAndRun = (action?: () => void) => {
    setMenuVisible(false);
    if (action) setTimeout(action, 150);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={onPress}
      >
        {/* Header row */}
        <View style={styles.topRow}>
          <View style={styles.nameDateCol}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.date}>{date}</Text>
          </View>
          {hasMenu && (
            <Pressable
              style={styles.menuTrigger}
              onPress={(e) => { e.stopPropagation(); setMenuVisible(true); }}
              hitSlop={10}
            >
              <Text style={styles.menuTriggerText}>⋮</Text>
            </Pressable>
          )}
        </View>

        {/* Stats badges */}
        <View style={styles.statsRow}>
          <StatBadge icon="⏱" label={duration} />
          <StatBadge icon="🏋️" label={`${volume.toLocaleString()} kg`} />
          <StatBadge icon="💪" label={`${exerciseCount} ex`} />
        </View>

        {/* Exercise list */}
        {preview.length > 0 && (
          <>
            <View style={styles.divider} />
            <SetSummaryList sets={preview} hasMore={hasMore} onSeeMore={onPress} />
          </>
        )}
      </Pressable>

      {/* Bottom sheet menu */}
      {hasMenu && (
        <BottomSheet
          visible={menuVisible}
          onClose={isSavingAsTemplate || isCopyingWorkout ? () => {} : () => setMenuVisible(false)}
          scrollable={false}
        >
          <View style={styles.sheetBody}>
            {onSaveAsTemplate && (
              <MenuItem
                icon="📋"
                label="Save as Template"
                loading={isSavingAsTemplate}
                onPress={() => onSaveAsTemplate()}
              />
            )}
            {onCopyWorkout && (
              <MenuItem icon="📄" label="Copy Workout" loading={isCopyingWorkout} onPress={onCopyWorkout} />
            )}
            {onEdit && (
              <MenuItem icon="✏️" label="Edit Workout" onPress={() => closeAndRun(onEdit)} />
            )}
            {onDelete && (
              <>
                <View style={styles.menuDivider} />
                <MenuItem icon={ICONS.delete} label="Delete Workout" danger onPress={() => closeAndRun(onDelete)} />
              </>
            )}

          </View>
        </BottomSheet>
      )}
    </>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardPressed: {
      opacity: 0.8,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    nameDateCol: {
      flex: 1,
      marginRight: spacing.sm,
    },
    name: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: c.text,
      marginBottom: 3,
    },
    date: {
      fontSize: fontSize.xs,
      color: c.textMuted,
    },
    menuTrigger: {
      width: 28,
      height: 28,
      borderRadius: borderRadius.full,
      backgroundColor: c.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuTriggerText: {
      fontSize: fontSize.xl,
      color: c.textSecondary,
      lineHeight: 20,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    divider: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: spacing.md,
    },
    sheetBody: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    menuDivider: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: spacing.xs,
    },
  });
}
