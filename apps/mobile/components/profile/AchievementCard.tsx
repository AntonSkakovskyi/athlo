import { View, Text, StyleSheet } from 'react-native';
import type { IAchievement, IUserAchievement } from '@athlo/shared';
import { colors, borderRadius } from '../../constants/theme';
import { ProgressBar } from '@/components/ui/ProgressBar/ProgressBar';

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
          {exerciseName && (
            <View style={styles.exerciseBadge}>
              <Text style={styles.exerciseBadgeText}>{exerciseName}</Text>
            </View>
          )}
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

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardUnlocked: {
    borderColor: colors.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconContainerUnlocked: {
    backgroundColor: colors.primaryLight,
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
    gap: 8,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  nameLocked: {
    color: colors.textSecondary,
  },
  exerciseBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  exerciseBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  desc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 3,
  },
  unlockedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  unlockedDate: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  unlockedValue: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressSection: {
    marginTop: 10,
  },
  progressText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});
