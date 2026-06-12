import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Button } from '@/components/ui/Button/Button';
import { Tag } from '@/components/ui/Tag/Tag';

interface TemplateCardProps {
  name: string;
  description?: string | null;
  exerciseCount?: number;
  muscles?: string[];
  author?: string;
  authorId?: number;
  onAuthorPress?: (authorId: number) => void;
  variant: 'my' | 'saved' | 'public';
  onPress?: () => void;
  onStart?: () => void;
  isStartingWorkout?: boolean;
  onDelete?: () => void;
  onSave?: () => void;
  onUnsave?: () => void;
}

export default function TemplateCard({
  name,
  description,
  exerciseCount,
  muscles,
  author,
  authorId,
  onAuthorPress,
  variant,
  onPress,
  onStart,
  isStartingWorkout,
  onDelete,
  onSave,
  onUnsave,
}: TemplateCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {exerciseCount !== undefined && (
            <Text style={styles.count}>{exerciseCount} exercises</Text>
          )}
        </View>

        {description ? (
          <Text style={styles.description} numberOfLines={2}>{description}</Text>
        ) : null}

        {author ? (
          <Pressable onPress={() => authorId && onAuthorPress?.(authorId)}>
            <Text style={styles.author}>@{author}</Text>
          </Pressable>
        ) : null}

        {muscles && muscles.length > 0 && (
          <View style={styles.muscleRow}>
            {muscles.slice(0, 4).map((m) => (
              <Tag key={m} label={m} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {onStart && (
          <Button title="▶ Start" variant="primary" onPress={onStart} isLoading={isStartingWorkout} style={styles.actionFlex} />
        )}
        {variant === 'my' && onDelete && (
          <Button title="Delete" variant="danger" onPress={onDelete} />
        )}
        {variant === 'public' && onSave && (
          <Button title="Save" variant="secondary" onPress={onSave} style={styles.actionFlex} />
        )}
        {variant === 'saved' && onUnsave && (
          <Button title="Remove" variant="danger" onPress={onUnsave} />
        )}
      </View>
    </Pressable>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      height: 160,
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      justifyContent: 'space-between',
    },
    content: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    name: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: c.text,
      flex: 1,
    },
    count: {
      fontSize: fontSize.sm,
      color: c.primary,
      fontWeight: fontWeight.medium,
      marginLeft: spacing.sm,
    },
    description: {
      fontSize: fontSize.md,
      color: c.textSecondary,
      marginTop: spacing.xs,
    },
    author: {
      fontSize: fontSize.sm,
      color: c.textMuted,
      marginVertical: spacing.xs,
    },
    muscleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: spacing.sm,
      gap: spacing.xs,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionFlex: {
      flex: 1,
    },
  });
}
