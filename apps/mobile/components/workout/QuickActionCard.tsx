import { Text, Pressable, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../../constants/theme';

interface QuickActionCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
}

export function QuickActionCard({ icon, title, description, onPress }: QuickActionCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    fontSize: 28,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  description: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
});
