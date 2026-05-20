import { View, Text, Pressable, StyleSheet } from 'react-native';
import { VisibilityType } from '@athlo/shared';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { VISIBILITY_OPTIONS } from '@/utils/visibility';

interface VisibilitySelectorProps {
  value: VisibilityType;
  onChange: (value: VisibilityType) => void;
  label?: string;
}

export function VisibilitySelector({ value, onChange, label = 'Visibility' }: VisibilitySelectorProps) {
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {VISIBILITY_OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              style={[styles.btn, active && styles.btnActive]}
              onPress={() => onChange(opt.value)}
            >
              <Text style={styles.icon}>{opt.icon}</Text>
              <Text style={[styles.btnLabel, active && styles.btnLabelActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  icon: {
    fontSize: fontSize.md,
  },
  btnLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  btnLabelActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
});
