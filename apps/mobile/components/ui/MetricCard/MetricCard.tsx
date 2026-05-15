import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, fontSize } from '@/constants/theme';

interface MetricCardProps {
  icon?: string;
  value: string;
  label: string;
  size?: 'sm' | 'md';
  highlighted?: boolean;
}

export function MetricCard({ icon, value, label, size = 'md', highlighted = false }: MetricCardProps) {
  return (
    <View style={[styles.card, size === 'sm' && styles.cardSm, highlighted && styles.cardHighlighted]}>
      {icon && <Text style={[styles.icon, size === 'sm' && styles.iconSm]}>{icon}</Text>}
      <Text style={[styles.value, size === 'sm' && styles.valueSm]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSm: {
    padding: 12,
    minWidth: 'auto',
  },
  cardHighlighted: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  icon: {
    fontSize: 24,
    marginBottom: 6,
  },
  iconSm: {
    fontSize: 18,
    marginBottom: 4,
  },
  value: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  valueSm: {
    fontSize: fontSize.md,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
