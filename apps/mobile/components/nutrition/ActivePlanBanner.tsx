import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { IUserMealPlan } from '@athlo/shared';
import { colors, borderRadius, spacing } from '../../constants/theme';

interface ActivePlanBannerProps {
  userMealPlan: IUserMealPlan;
  planName?: string;
  onPress: () => void;
}

export function ActivePlanBanner({ userMealPlan, planName, onPress }: ActivePlanBannerProps) {
  const startDate = new Date(userMealPlan.startedAt);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.left}>
        <Text style={styles.icon}>📋</Text>
        <View>
          <Text style={styles.planName}>{planName ?? 'Active Meal Plan'}</Text>
          <Text style={styles.dayInfo}>Day {daysDiff}</Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.lg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  planName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  dayInfo: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: '300',
  },
});
