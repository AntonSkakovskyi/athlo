import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    title: {
      fontSize: fontSize['3xl'],
      fontWeight: fontWeight.bold,
      color: c.text,
      marginBottom: spacing.xs,
    },
    nameInput: {
      fontSize: fontSize['3xl'],
      fontWeight: fontWeight.bold,
      color: c.text,
      marginBottom: spacing.xs,
    },
    description: {
      fontSize: fontSize.md,
      color: c.textSecondary,
      marginBottom: spacing.xl,
    },
    descInput: {
      fontSize: fontSize.md,
      color: c.text,
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.semibold,
      color: c.text,
      marginBottom: spacing.md,
    },
  });
}
