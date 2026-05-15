import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Input } from '@/components/ui/Input/Input';

interface TemplateDetailHeaderProps {
  name: string;
  description: string | null | undefined;
  editName: string | null;
  editDesc: string | null;
  exerciseCount: number;
  onEditName: () => void;
  onEditDesc: () => void;
  onChangeEditName: (value: string) => void;
  onChangeEditDesc: (value: string) => void;
  onSaveName: () => void;
  onSaveDesc: () => void;
}

export function TemplateDetailHeader({
  name,
  description,
  editName,
  editDesc,
  exerciseCount,
  onEditName,
  onEditDesc,
  onChangeEditName,
  onChangeEditDesc,
  onSaveName,
  onSaveDesc,
}: TemplateDetailHeaderProps) {
  return (
    <View>
      {editName !== null ? (
        <Input
          value={editName}
          onChangeText={onChangeEditName}
          onBlur={onSaveName}
          onSubmitEditing={onSaveName}
          autoFocus
          selectionColor={colors.primary}
          style={styles.nameInput}
        />
      ) : (
        <Pressable onPress={onEditName}>
          <Text style={styles.title}>{name}</Text>
        </Pressable>
      )}

      {editDesc !== null ? (
        <Input
          value={editDesc}
          onChangeText={onChangeEditDesc}
          onBlur={onSaveDesc}
          multiline
          placeholder="Add description..."
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          style={styles.descInput}
        />
      ) : (
        <Pressable onPress={onEditDesc}>
          <Text style={styles.description}>
            {description || 'Tap to add description'}
          </Text>
        </Pressable>
      )}

      <Text style={styles.sectionTitle}>Exercises ({exerciseCount})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  nameInput: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  descInput: {
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
});
