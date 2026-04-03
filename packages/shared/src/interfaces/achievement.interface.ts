import type { AchievementType } from '../enums/achievement-type.enum.js';
import type { TrackingMetric } from '../enums/tracking-metric.enum.js';

export interface IAchievement {
  id: number;
  name: string;
  description: string;
  type: AchievementType;
  threshold: number;
  exerciseId: number | null;
  trackingMetric: TrackingMetric | null;
  iconUrl: string | null;
  order: number;
}
