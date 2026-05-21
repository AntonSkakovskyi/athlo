import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { IAchievement, IUserAchievement } from '@athlo/shared';
import { borderRadius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { ProgressBar } from '@/components/ui/ProgressBar/ProgressBar';
import { Badge } from '@/components/ui/Badge/Badge';

interface AchievementCardProps {
  achievement: IAchievement;
  userAchievement?: IUserAchievement;
  isUnlocked: boolean;
  exerciseName?: string;
  currentProgress: number;
}

export function AchievementCard({
  achievement,
  userAchievement,
  isUnlocked,
  exerciseName,
  currentProgress,
}: AchievementCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const progressPercent =
    achievement.threshold > 0
      ? Math.min((currentProgress / achievement.threshold) * 100, 100)
      : 0;

  return (
    <View style={[styles.card, isUnlocked && styles.cardUnlocked]}>
      <View style={[styles.iconContainer, isUnlocked && styles.iconContainerUnlocked]}>
        <Text style={styles.icon}>{isUnlocked ? '🏆' : '🔒'}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, !isUnlocked && styles.nameLocked]} numberOfLines={1}>
            {achievement.name}
          </Text>
          {exerciseName && <Badge label={exerciseName} variant="default" size="sm" />}
        </View>
        <Text style={styles.desc} numberOfLines={2}>
          {achievement.description}
        </Text>

        {isUnlocked && userAchievement ? (
          <View style={styles.unlockedInfo}>
            <Text style={styles.unlockedDate}>
              {new Date(userAchievement.unlockedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <Text style={styles.unlockedValue}>Value: {userAchievement.value}</Text>
          </View>
        ) : (
          <View style={styles.progressSection}>
            <ProgressBar progress={progressPercent} />
            <Text style={styles.progressText}>
              {currentProgress} / {achievement.threshold}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.md,
    },
    cardUnlocked: {
      borderColor: c.primary,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: borderRadius['2xl'],
      backgroundColor: c.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    iconContainerUnlocked: {
      backgroundColor: c.primaryLight,
    },
    icon: {
      fontSize: 22,
    },
    content: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: 2,
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
      flexShrink: 1,
    },
    nameLocked: {
      color: c.textSecondary,
    },
    desc: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 3,
    },
    unlockedInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    unlockedDate: {
      fontSize: 12,
      color: c.primary,
      fontWeight: '500',
    },
    unlockedValue: {
      fontSize: 12,
      color: c.textSecondary,
    },
    progressSection: {
      marginTop: 10,
    },
    progressText: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: spacing.xs,
    },
  });
}
