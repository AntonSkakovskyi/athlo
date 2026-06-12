import { AchievementType, TrackingMetric } from '@athlo/shared';

function fmtNum(n: number): string {
  return n % 1 === 0 ? String(Math.round(n)) : n.toFixed(1);
}

function getMetricUnit(metric: TrackingMetric | null | undefined): string | null {
  switch (metric) {
    case TrackingMetric.WEIGHT:
    case TrackingMetric.ESTIMATED_1RM:
    case TrackingMetric.VOLUME:
      return 'kg';
    case TrackingMetric.REPS:
      return 'reps';
    case TrackingMetric.DISTANCE:
      return 'km';
    case TrackingMetric.DURATION:
      return 's';
    default:
      return null;
  }
}

export function formatAchievementProgress(
  progress: number,
  threshold: number,
  type: AchievementType,
  trackingMetric?: TrackingMetric | null,
): string {
  switch (type) {
    case AchievementType.GLOBAL_TIME: {
      const ph = Math.floor(progress / 3600);
      const pm = Math.floor((progress % 3600) / 60);
      const th = Math.round(threshold / 3600);
      const progressStr = ph > 0 ? (pm > 0 ? `${ph}h ${pm}m` : `${ph}h`) : `${pm}m`;
      return `${progressStr} / ${th}h`;
    }
    case AchievementType.GLOBAL_WEIGHT:
      return `${fmtNum(progress)} / ${fmtNum(threshold)} kg`;
    case AchievementType.EXERCISE_PERSONAL_RECORD: {
      const unit = getMetricUnit(trackingMetric);
      return unit
        ? `${fmtNum(progress)} / ${fmtNum(threshold)} ${unit}`
        : `${fmtNum(progress)} / ${fmtNum(threshold)}`;
    }
    default:
      return `${fmtNum(progress)} / ${fmtNum(threshold)}`;
  }
}
