import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { TrackingType } from '@athlo/shared';
import { SetRow } from './SetRow/SetRow';
import type { SetRowData } from './SetRow/SetRow';
import { Input } from '@/components/ui/Input/Input';

interface ActiveExerciseCardProps {
  exerciseName: string;
  trackingType: TrackingType;
  sets: SetRowData[];
  notes?: string;
  showNotes: boolean;
  onToggleNotes: () => void;
  onNotesChange: (text: string) => void;
  onUpdateSet: (setIndex: number, data: Partial<SetRowData>) => void;
  onToggleSetComplete: (setIndex: number) => void;
  onAddSet: () => void;
  onRestTimer?: () => void;
}

export function ActiveExerciseCard({
  exerciseName,
  trackingType,
  sets,
  notes,
  showNotes,
  onToggleNotes,
  onNotesChange,
  onUpdateSet,
  onToggleSetComplete,
  onAddSet,
  onRestTimer,
}: ActiveExerciseCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.exerciseName} numberOfLines={1}>{exerciseName}</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} onPress={onToggleNotes}>
            <Text style={styles.iconText}>📝</Text>
          </Pressable>
          {onRestTimer && (
            <Pressable style={styles.iconBtn} onPress={onRestTimer}>
              <Text style={styles.iconText}>⏱️</Text>
            </Pressable>
          )}
        </View>
      </View>

      {showNotes && (
        <Input
          label="Notes"
          multiline
          placeholder="Add notes..."
          placeholderTextColor={colors.textMuted}
          value={notes ?? ''}
          onChangeText={onNotesChange}
          style={styles.notesInput}
        />
      )}

      {/* Column headers */}
      <View style={styles.columnHeaders}>
        <Text style={[styles.colHeader, { width: 24 }]}>#</Text>
        <Text style={[styles.colHeader, { width: 60 }]}>Prev</Text>
        {trackingType === TrackingType.WEIGHT_AND_REPS && (
          <>
            <Text style={[styles.colHeader, { flex: 1 }]}>kg</Text>
            <Text style={[styles.colHeader, { flex: 1 }]}>Reps</Text>
          </>
        )}
        {trackingType === TrackingType.REPS_ONLY && (
          <Text style={[styles.colHeader, { flex: 2 }]}>Reps</Text>
        )}
        {trackingType === TrackingType.TIME_BASED && (
          <>
            <Text style={[styles.colHeader, { flex: 1 }]}>Time</Text>
            <Text style={[styles.colHeader, { flex: 1 }]}>Dist</Text>
          </>
        )}
        <Text style={[styles.colHeader, { width: 32 }]}>✓</Text>
      </View>

      {sets.map((set, index) => (
        <SetRow
          key={set.id ?? `new-${index}`}
          set={set}
          trackingType={trackingType}
          onUpdate={(data) => onUpdateSet(index, data)}
          onToggleComplete={() => onToggleSetComplete(index)}
        />
      ))}

      <Pressable style={styles.addSetBtn} onPress={onAddSet}>
        <Text style={styles.addSetText}>+ Add Set</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    exerciseName: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: c.primary,
      flex: 1,
    },
    headerActions: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: borderRadius.sm,
      backgroundColor: c.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: {
      fontSize: fontSize.lg,
    },
    notesInput: {
      backgroundColor: c.surfaceLight,
      borderRadius: borderRadius.sm,
      padding: spacing.sm,
      fontSize: fontSize.md,
      color: c.text,
      marginBottom: spacing.sm,
      minHeight: 40,
    },
    columnHeaders: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.xs,
      paddingBottom: spacing.xs,
      gap: spacing.xs,
    },
    colHeader: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: c.textMuted,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    addSetBtn: {
      marginTop: spacing.sm,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      backgroundColor: c.surfaceLight,
      borderRadius: borderRadius.sm,
    },
    addSetText: {
      color: c.primary,
      fontWeight: fontWeight.semibold,
      fontSize: fontSize.md,
    },
  });
}
