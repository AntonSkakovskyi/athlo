import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { TrackingType } from '@athlo/shared';
import { LogSetRow, LogSetData, ExerciseLogMode } from './LogSetRow/LogSetRow';
import { ExerciseHeader } from './ExerciseHeader/ExerciseHeader';
import { Input } from '@/components/ui/Input/Input';
import { BottomSheet, BottomSheetItem, TimePicker, Button } from '@/components/ui';
import { useState } from 'react';

interface ExerciseLogCardProps {
  exerciseName: string;
  trackingType: TrackingType;
  mode: ExerciseLogMode;
  isEditing?: boolean;
  sets: LogSetData[];
  notes?: string;
  showNotes: boolean;
  restTime?: number;
  isFirst?: boolean;
  isLast?: boolean;
  onToggleNotes?: () => void;
  onNotesChange?: (text: string) => void;
  onUpdateSet: (setIndex: number, data: Partial<LogSetData>) => void;
  onToggleSetComplete?: (setIndex: number) => void;
  onAddSet?: () => void;
  onDeleteSet?: (setIndex: number) => void;
  onMoveSet?: (setIndex: number, direction: 'up' | 'down') => void;
  onRestTimer?: () => void;
  // Exercise level actions
  onDeleteExercise?: () => void;
  onChangeExercise?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onPRPress?: (setIndex: number) => void;
}

export function ExerciseLogCard({
  exerciseName,
  trackingType,
  mode,
  isEditing = true,
  sets,
  notes,
  showNotes,
  restTime,
  isFirst,
  isLast,
  onToggleNotes,
  onNotesChange,
  onUpdateSet,
  onToggleSetComplete,
  onAddSet,
  onDeleteSet,
  onMoveSet,
  onRestTimer,
  onDeleteExercise,
  onChangeExercise,
  onMoveUp,
  onMoveDown,
  onPRPress,
}: ExerciseLogCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [isSetActionsVisible, setIsSetActionsVisible] = useState(false);
  const [selectedSetIndex, setSelectedSetIndex] = useState<number | null>(null);

// Set-level Time Picker
  const [setTimePickerVisible, setSetTimePickerVisible] = useState(false);
  const [timePickerSetIndex, setTimePickerSetIndex] = useState<number | null>(null);
  const [tempTimeValue, setTempTimeValue] = useState(0);

  const isViewOnly = !isEditing && mode !== 'active';
  const canEditNotes = (isEditing || mode === 'active') && onToggleNotes;
  const displayAddSet = isEditing; // Show when editing, regardless of mode

  const handleOpenSetMenu = (index: number) => {
    setSelectedSetIndex(index);
    setIsSetActionsVisible(true);
  };

  const handleOpenSetTimePicker = (index: number, currentDuration: number) => {
    setTimePickerSetIndex(index);
    setTempTimeValue(currentDuration);
    setSetTimePickerVisible(true);
  };

  const handleSaveSetTime = () => {
    if (timePickerSetIndex !== null) {
      onUpdateSet(timePickerSetIndex, { duration: tempTimeValue });
      setSetTimePickerVisible(false);
      setTimePickerSetIndex(null);
    }
  };

  return (
    <View style={styles.card}>
      <ExerciseHeader
        exerciseName={exerciseName}
        notes={notes}
        restTime={restTime}
        isViewOnly={isViewOnly}
        canEditNotes={!!canEditNotes}
        showRestTimer={!!onRestTimer && (mode === 'active' || isEditing)}
        showMenu={isEditing}
        onToggleNotes={onToggleNotes}
        onRestTimer={onRestTimer}
        onMenuOpen={() => setMenuVisible(true)}
      />

      <BottomSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title={exerciseName}
      >
        {onChangeExercise && (
          <BottomSheetItem
            icon="🔄"
            label="Change Exercise"
            onPress={() => {
              setMenuVisible(false);
              onChangeExercise();
            }}
          />
        )}
        {onMoveUp && !isFirst && (
          <BottomSheetItem
            icon="⬆️"
            label="Move Up"
            onPress={() => {
              setMenuVisible(false);
              onMoveUp();
            }}
          />
        )}
        {onMoveDown && !isLast && (
          <BottomSheetItem
            icon="⬇️"
            label="Move Down"
            onPress={() => {
              setMenuVisible(false);
              onMoveDown();
            }}
          />
        )}
        {onDeleteExercise && (
          <BottomSheetItem
            icon="🗑️"
            label="Delete Exercise"
            danger
            onPress={() => {
              setMenuVisible(false);
              onDeleteExercise();
            }}
          />
        )}
      </BottomSheet>

      <BottomSheet
        visible={isSetActionsVisible}
        onClose={() => {
          setIsSetActionsVisible(false);
          setSelectedSetIndex(null);
        }}
        title={
          selectedSetIndex !== null && sets[selectedSetIndex] 
            ? `Set #${sets[selectedSetIndex].order} Actions` 
            : 'Set Actions'
        }
      >
        {onMoveSet && selectedSetIndex !== null && sets[selectedSetIndex] && selectedSetIndex > 0 && (
          <BottomSheetItem
            icon="⬆️"
            label="Move Up"
            onPress={() => {
              setIsSetActionsVisible(false);
              onMoveSet(selectedSetIndex, 'up');
            }}
          />
        )}
        {onMoveSet && selectedSetIndex !== null && sets[selectedSetIndex] && selectedSetIndex < sets.length - 1 && (
          <BottomSheetItem
            icon="⬇️"
            label="Move Down"
            onPress={() => {
              setIsSetActionsVisible(false);
              onMoveSet(selectedSetIndex, 'down');
            }}
          />
        )}
        {onDeleteSet && selectedSetIndex !== null && sets[selectedSetIndex] && (
          <BottomSheetItem
            icon="🗑️"
            label="Delete Set"
            danger
            onPress={() => {
              setIsSetActionsVisible(false);
              onDeleteSet(selectedSetIndex);
            }}
          />
        )}
      </BottomSheet>

      {showNotes && canEditNotes && (
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

      <View style={styles.columnHeaders}>
        <Text style={[styles.colHeader, { width: 24 }]}>#</Text>
        {(mode === 'active' || (mode === 'summary' && isEditing)) && (
          <Text style={[styles.colHeader, { width: 60 }]}>Prev</Text>
        )}
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
        <Text style={[styles.colHeader, { width: 80 }]}>
          {mode === 'active' ? '✓' : ''}
        </Text>
      </View>
      {sets?.map((set, index) => (
        <LogSetRow
          key={set.id ?? `set-${index}`}
          set={set}
          trackingType={trackingType}
          mode={mode}
          isEditing={isEditing}
          onUpdate={(data) => onUpdateSet(index, data)}
          onToggleComplete={() => onToggleSetComplete?.(index)}
          onOpenMenu={() => handleOpenSetMenu(index)}
          onOpenTimePicker={() => handleOpenSetTimePicker(index, set.duration ?? 0)}
          onPRPress={() => onPRPress?.(index)}
        />
      ))}

      {displayAddSet && onAddSet && (
        <Pressable style={styles.addSetBtn} onPress={onAddSet}>
          <Text style={styles.addSetText}>+ Add Set</Text>
        </Pressable>
      )}

      <BottomSheet
        visible={setTimePickerVisible}
        onClose={() => setSetTimePickerVisible(false)}
        title={timePickerSetIndex !== null ? `Set #${sets[timePickerSetIndex]?.order} Duration` : 'Duration'}
        scrollable={false}
      >
        <TimePicker 
          value={tempTimeValue} 
          onChange={setTempTimeValue}
        />
        <Button 
          title="Set Duration" 
          onPress={handleSaveSetTime} 
          style={styles.saveTimeBtn}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
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
    color: colors.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  addSetBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
  },
  addSetText: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.md,
  },
  saveTimeBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
});
