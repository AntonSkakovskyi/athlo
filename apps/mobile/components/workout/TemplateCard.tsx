import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius } from '../../constants/theme';

interface TemplateCardProps {
  name: string;
  description?: string | null;
  exerciseCount?: number;
  muscles?: string[];
  author?: string;
  variant: 'my' | 'saved' | 'public';
  onPress?: () => void;
  onStart?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  onUnsave?: () => void;
}

export function TemplateCard({
  name,
  description,
  exerciseCount,
  muscles,
  author,
  variant,
  onPress,
  onStart,
  onDelete,
  onSave,
  onUnsave,
}: TemplateCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {exerciseCount !== undefined && (
          <Text style={styles.count}>{exerciseCount} exercises</Text>
        )}
      </View>

      {description ? (
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
      ) : null}

      {author ? <Text style={styles.author}>@{author}</Text> : null}

      {muscles && muscles.length > 0 && (
        <View style={styles.muscleRow}>
          {muscles.slice(0, 4).map((m) => (
            <View key={m} style={styles.muscleChip}>
              <Text style={styles.muscleText}>{m}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        {onStart && (
          <Pressable style={styles.actionPrimary} onPress={onStart}>
            <Text style={styles.actionPrimaryText}>▶ Start</Text>
          </Pressable>
        )}
        {variant === 'my' && onDelete && (
          <Pressable style={styles.actionDanger} onPress={onDelete}>
            <Text style={styles.actionDangerText}>Delete</Text>
          </Pressable>
        )}
        {variant === 'public' && onSave && (
          <Pressable style={styles.actionSecondary} onPress={onSave}>
            <Text style={styles.actionSecondaryText}>Save</Text>
          </Pressable>
        )}
        {variant === 'saved' && onUnsave && (
          <Pressable style={styles.actionDanger} onPress={onUnsave}>
            <Text style={styles.actionDangerText}>Remove</Text>
          </Pressable>
        )}
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  count: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
  },
  author: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  muscleChip: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  muscleText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  actionPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  actionPrimaryText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  actionSecondary: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  actionSecondaryText: {
    color: colors.text,
    fontWeight: '500',
    fontSize: 14,
  },
  actionDanger: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
  },
  actionDangerText: {
    color: colors.danger,
    fontWeight: '500',
    fontSize: 14,
  },
});
