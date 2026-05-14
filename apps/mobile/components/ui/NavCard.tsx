import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing } from '../../constants/theme';

interface NavCardProps {
  icon: string;
  title: string;
  description?: string;
  onPress: () => void;
  variant?: 'default' | 'compact';
}

export function NavCard({ icon, title, description, onPress, variant = 'default' }: NavCardProps) {
  if (variant === 'compact') {
    return (
      <Pressable style={compactStyles.card} onPress={onPress}>
        <Text style={compactStyles.icon}>{icon}</Text>
        <Text style={compactStyles.title}>{title}</Text>
        {description && <Text style={compactStyles.description}>{description}</Text>}
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const compactStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  icon: {
    fontSize: 28,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  icon: {
    fontSize: 24,
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  description: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: colors.textMuted,
    fontWeight: '300',
  },
});
