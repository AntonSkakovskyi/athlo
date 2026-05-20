import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';

interface WorkoutHeaderBarProps {
  workoutName: string;
  editName: string | null;
  onBack: () => void;
  onEditNameStart: () => void;
  onEditNameChange: (text: string) => void;
  onEditNameSave: () => void;
  onFinish: () => void;
}

export function WorkoutHeaderBar({
  workoutName,
  editName,
  onBack,
  onEditNameStart,
  onEditNameChange,
  onEditNameSave,
  onFinish,
}: WorkoutHeaderBarProps) {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onBack}>
        <Text style={styles.backBtn}>← Back</Text>
      </Pressable>
      {editName !== null ? (
        <TextInput
          style={styles.nameInput}
          value={editName}
          onChangeText={onEditNameChange}
          onBlur={onEditNameSave}
          onSubmitEditing={onEditNameSave}
          autoFocus
          selectionColor={colors.primary}
        />
      ) : (
        <Pressable onPress={onEditNameStart} style={styles.nameWrap}>
          <Text style={styles.workoutName} numberOfLines={1}>
            {workoutName}
          </Text>
        </Pressable>
      )}
      <Pressable style={styles.finishBtn} onPress={onFinish}>
        <Text style={styles.finishText}>✅ Finish</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  nameWrap: {
    flex: 1,
  },
  workoutName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  nameInput: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.xs,
  },
  finishBtn: {
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  finishText: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
  },
});
