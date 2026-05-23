import { TrackingType } from '@athlo/shared';
import type { IWorkoutWithRelations } from '@athlo/shared';

export interface ValidatableSet {
  isCompleted?: boolean;
  weight?: number | null;
  reps?: number | null;
  duration?: number | null;
  placeholderWeight?: number;
  placeholderReps?: number;
  placeholderDuration?: number;
}

/**
 * Returns true if any set has an empty required field with no placeholder to fall back on.
 * completedOnly — check only completed sets.
 * allowPlaceholders — treat a placeholder value as sufficient (active workout context).
 */
export function hasEmptySets(
  sets: ValidatableSet[],
  trackingType: TrackingType,
  options: { completedOnly?: boolean; allowPlaceholders?: boolean } = {},
): boolean {
  const { completedOnly = false, allowPlaceholders = false } = options;
  const toCheck = completedOnly ? sets.filter((s) => s.isCompleted) : sets;

  return toCheck.some((set) => {
    const hasWeight = set.weight != null || (allowPlaceholders && set.placeholderWeight != null);
    const hasReps = set.reps != null || (allowPlaceholders && set.placeholderReps != null);
    const hasDuration = set.duration != null || (allowPlaceholders && set.placeholderDuration != null);

    switch (trackingType) {
      case TrackingType.WEIGHT_AND_REPS:
        return !hasWeight || !hasReps;
      case TrackingType.REPS_ONLY:
        return !hasReps;
      case TrackingType.TIME_BASED:
        return !hasDuration;
      default:
        return false;
    }
  });
}


export function computeVolume(workout: IWorkoutWithRelations): number {
  return (
    workout.logExercises?.reduce(
      (acc, ex) =>
        acc +
        (ex.sets ?? []).reduce(
          (sum, s) => (s.isCompleted ? sum + (s.weight ?? 0) * (s.reps ?? 0) : sum),
          0,
        ),
      0,
    ) ?? 0
  );
}

export function getTrackingType(trackingTypeId?: number | null): TrackingType {
  switch (trackingTypeId) {
    case 1:
      return TrackingType.WEIGHT_AND_REPS;
    case 2:
      return TrackingType.REPS_ONLY;
    case 3:
      return TrackingType.TIME_BASED;
    default:
      return TrackingType.WEIGHT_AND_REPS;
  }
}

export function trackingTypeIcon(trackingTypeId?: number | null): string {
  switch (trackingTypeId) {
    case 2:
      return '🔄';
    case 3:
      return '⏱️';
    default:
      return '🏋️';
  }
}

export function formatDurationRange(startedAt: Date | string, endedAt?: Date | string | null): string {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const diff = Math.floor((end - start) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
