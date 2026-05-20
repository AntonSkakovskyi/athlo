import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';

interface ExerciseHeaderProps {
  exerciseName: string;
  notes?: string;
  restTime?: number;
  isViewOnly: boolean;
  canEditNotes: boolean;
  showRestTimer: boolean;
  showMenu: boolean;
  onToggleNotes?: () => void;
  onRestTimer?: () => void;
  onMenuOpen: () => void;
}

export function ExerciseHeader({
  exerciseName,
  notes,
  restTime,
  isViewOnly,
  canEditNotes,
  showRestTimer,
  showMenu,
  onToggleNotes,
  onRestTimer,
  onMenuOpen,
}: ExerciseHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.nameWrap}>
        <Text style={styles.exerciseName} numberOfLines={1}>{exerciseName}</Text>
        <View style={styles.subtitleRow}>
          {isViewOnly && notes ? (
            <Text style={styles.notesText}>{notes}</Text>
          ) : null}
          {restTime !== undefined && restTime > 0 && (
            <Text style={styles.restTimeText}>⏱️ {restTime}s</Text>
          )}
        </View>
      </View>

      <View style={styles.headerActions}>
        {canEditNotes && (
          <Pressable style={styles.iconBtn} onPress={onToggleNotes}>
            <Text style={styles.iconText}>📝</Text>
          </Pressable>
        )}
        {showRestTimer && (
          <Pressable style={styles.iconBtn} onPress={onRestTimer}>
            <Text style={styles.iconText}>⏱️</Text>
          </Pressable>
        )}
        {showMenu && (
          <Pressable style={styles.iconBtn} onPress={onMenuOpen}>
            <Text style={styles.iconText}>⋮</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  nameWrap: {
    flex: 1,
  },
  exerciseName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  notesText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  restTimeText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: fontSize.lg,
  },
});
