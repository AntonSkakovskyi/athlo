import { View, Pressable, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/Button/Button';
import { Tag } from '@/components/ui/Tag/Tag';
import { Typography } from '@/components/ui/Typography/Typography';
import { colors, borderRadius, spacing } from '@/constants/theme';
import { getVisibilityLabel } from '@/utils/visibility';
import type { IMealPlan } from '@athlo/shared';

export type PlanCardVariant = 'my' | 'public' | 'saved';

interface PlanCardProps {
  plan: IMealPlan;
  variant: PlanCardVariant;
  isActive: boolean;
  onOpen: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onSave?: () => void;
  onUnsave?: () => void;
  onDelete?: () => void;
}

export function PlanCard({
  plan,
  variant,
  isActive,
  onOpen,
  onActivate,
  onDeactivate,
  onSave,
  onUnsave,
  onDelete,
}: PlanCardProps) {
  const isOwned = variant === 'my';

  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      <Pressable onPress={onOpen}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Typography variant="h4" numberOfLines={1} style={styles.name}>
              {plan.name}
            </Typography>
            {isActive && <Tag label="Active" color="primary" />}
          </View>
          <Typography variant="caption">{getVisibilityLabel(plan.visibilityTypeId)}</Typography>
        </View>

        {plan.description ? (
          <Typography variant="bodySmall" numberOfLines={2} style={styles.desc}>
            {plan.description}
          </Typography>
        ) : null}
        <Typography variant="caption" style={styles.meta}>
          {plan.totalDays} day(s)
        </Typography>
      </Pressable>

      <View style={styles.actions}>
        {!isActive && variant !== 'saved' && (
          <Button title="Activate" variant="primary" onPress={onActivate} style={styles.actionBtn} />
        )}
        {isActive && (
          <Button title="Deactivate" variant="danger" onPress={onDeactivate} style={styles.actionBtn} />
        )}

        {variant === 'public' && onSave && (
          <Button title="Save" variant="secondary" onPress={onSave} style={styles.actionBtn} />
        )}

        {variant === 'saved' && (
          <>
            {!isActive && (
              <Button title="Activate" variant="primary" onPress={onActivate} style={styles.actionBtn} />
            )}
            {onUnsave && (
              <Button title="Unsave" variant="ghost" onPress={onUnsave} style={styles.actionBtn} />
            )}
          </>
        )}

        {isOwned && onDelete && (
          <Button title="🗑️" variant="danger" onPress={onDelete} style={styles.iconBtn} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  name: {
    flexShrink: 1,
  },
  desc: {
    marginTop: spacing.xs,
  },
  meta: {
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  iconBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
