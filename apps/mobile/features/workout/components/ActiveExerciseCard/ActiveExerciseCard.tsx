import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius } from '@/constants/theme';
import { TrackingType } from '@athlo/shared';
import { SetRow } from './SetRow/SetRow';
import type { SetRowData } from './SetRow/SetRow';

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
        <TextInput
          style={styles.notesInput}
          placeholder="Add notes..."
          placeholderTextColor={colors.textMuted}
          value={notes ?? ''}
          onChangeText={onNotesChange}
          multiline
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
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
    fontSize: 16,
  },
  notesInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    padding: 10,
    fontSize: 14,
    color: colors.text,
    marginBottom: 10,
    minHeight: 40,
  },
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 6,
    gap: 6,
  },
  colHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  addSetBtn: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
  },
  addSetText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
