import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '@/constants/theme';

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
            <View style={styles.exerciseList}>
              {preview.map((item, i) => (
                <View key={i} style={styles.exerciseRow}>
                  <Text style={styles.exerciseName} numberOfLines={1}>{item.exerciseName}</Text>
                  <Text style={styles.exerciseSets}>{item.setsCount} sets</Text>
                </View>
              ))}
              {hasMore && (
                <Pressable onPress={onPress} style={styles.seeMoreWrap}>
                  <Text style={styles.seeMore}>See more</Text>
                </Pressable>
              )}
            </View>
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
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    opacity: 0.8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nameDateCol: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '700',
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
    borderRadius: 50,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTriggerText: {
    fontSize: 18,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingVertical: 5,
    paddingHorizontal: 9,
    gap: 4,
  },
  statIcon: {
    fontSize: 11,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  exerciseList: {
    gap: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseName: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  exerciseSets: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500',
  },
  seeMoreWrap: {
    alignItems: 'center',
    paddingTop: 4,
  },
  seeMore: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
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
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
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
    fontSize: 20,
    width: 24,
    textAlign: 'center',
  },
  menuItemLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  menuItemDanger: {
    color: colors.danger,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  cancelRow: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
});
