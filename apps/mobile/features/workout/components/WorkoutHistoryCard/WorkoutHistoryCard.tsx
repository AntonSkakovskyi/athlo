import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { colors, borderRadius, fontSize, spacing, fontWeight } from '@/constants/theme';
import { SetSummaryList } from './SetSummaryList';

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
  onCopyWorkout?: () => void;
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
  onCopyWorkout,
  onEdit,
  onDelete,
}: WorkoutHistoryCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);

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
        <Modal
          visible={menuVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
            <View style={styles.sheet} onStartShouldSetResponder={() => true}>
              <View style={styles.sheetHandle} />

              {onSaveAsTemplate && (
                <MenuItem icon="📋" label="Save as Template" onPress={() => closeAndRun(onSaveAsTemplate)} />
              )}
              {onCopyWorkout && (
                <MenuItem icon="📄" label="Copy Workout" onPress={() => closeAndRun(onCopyWorkout)} />
              )}
              {onEdit && (
                <MenuItem icon="✏️" label="Edit Workout" onPress={() => closeAndRun(onEdit)} />
              )}
              {onDelete && (
                <>
                  <View style={styles.menuDivider} />
                  <MenuItem icon="🗑" label="Delete Workout" danger onPress={() => closeAndRun(onDelete)} />
                </>
              )}

              <View style={styles.menuDivider} />
              <Pressable style={styles.cancelRow} onPress={() => setMenuVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

function StatBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.statBadge}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  danger,
  onPress,
}: {
  icon: string;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      onPress={onPress}
    >
      <Text style={styles.menuItemIcon}>{icon}</Text>
      <Text style={[styles.menuItemLabel, danger && styles.menuItemDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text,
    marginBottom: 3,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  menuTrigger: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTriggerText: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  statIcon: {
    fontSize: 11,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  // Modal / bottom sheet
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: borderRadius.xs,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  menuItemPressed: {
    opacity: 0.6,
  },
  menuItemIcon: {
    fontSize: fontSize.xl,
    width: 24,
    textAlign: 'center',
  },
  menuItemLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  menuItemDanger: {
    color: colors.danger,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  cancelRow: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});
