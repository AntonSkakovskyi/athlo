import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { IUserMealPlan } from '@athlo/shared';
import { borderRadius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface ActivePlanBannerProps {
  userMealPlan: IUserMealPlan;
  planName?: string;
  onPress: () => void;
  onApplyToday?: () => void;
}

export function ActivePlanBanner({ userMealPlan, planName, onPress }: ActivePlanBannerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const startDate = new Date(userMealPlan.startedAt);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <View style={styles.outerContainer}>
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
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    outerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    container: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.primaryLight,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.primary,
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
      color: c.text,
    },
    dayInfo: {
      fontSize: 12,
      color: c.primary,
      marginTop: 2,
    },
    chevron: {
      fontSize: 22,
      color: c.primary,
      fontWeight: '300',
    },
    applyBtn: {
      backgroundColor: c.surface,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: c.primary,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 90,
    },
    applyBtnText: {
      color: c.primary,
      fontWeight: 'bold',
      fontSize: 12,
    },
  });
}
