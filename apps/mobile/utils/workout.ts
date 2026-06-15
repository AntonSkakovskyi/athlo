import { TrackingType } from '@athlo/shared';
import type { IWorkoutWithRelations, IFinalizedExercise, IFinalizedSet } from '@athlo/shared';
import { ICONS } from '@/utils/icons';
import { formatSeconds } from '@/utils/time';
import { serverNow } from '@/utils/serverTime';

interface FormattableSet {
  weight?: number | null;
  reps?: number | null;
  duration?: number | null;
  distance?: number | null;
}

// Людиночитний підсумок значень підходу залежно від типу трекінгу
// (напр. "50kg × 5 reps", "20 reps", "1:30 200m"). Порожній рядок, якщо даних нема.
export function formatSetValue(
  trackingType: TrackingType,
  set: FormattableSet,
): string {
  switch (trackingType) {
    case TrackingType.WEIGHT_AND_REPS:
      if (set.weight != null && set.reps != null) {
        return `${set.weight}kg × ${set.reps} reps`;
      }
      if (set.weight != null) return `${set.weight}kg`;
      if (set.reps != null) return `${set.reps} reps`;
      return '';
    case TrackingType.REPS_ONLY:
      return set.reps != null ? `${set.reps} reps` : '';
    case TrackingType.TIME_BASED:
      return set.duration != null ? formatSeconds(set.duration) : '';
    case TrackingType.DISTANCE_AND_TIME: {
      const dur = set.duration ? formatSeconds(set.duration) : '';
      const dist = set.distance ? `${set.distance}m` : '';
      return [dur, dist].filter(Boolean).join(' ');
    }
    case TrackingType.DISTANCE_ONLY:
      return set.distance != null ? `${set.distance}m` : '';
    default:
      return '';
  }
}

export interface ValidatableSet {
  isCompleted?: boolean;
  weight?: number | null;
  reps?: number | null;
  duration?: number | null;
  distance?: number | null;
  placeholderWeight?: number | null;
  placeholderReps?: number | null;
  placeholderDuration?: number | null;
  placeholderDistance?: number | null;
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

    const hasDistance = set.distance != null || (allowPlaceholders && set.placeholderDistance != null);

    switch (trackingType) {
      case TrackingType.WEIGHT_AND_REPS:
        return !hasWeight || !hasReps;
      case TrackingType.REPS_ONLY:
        return !hasReps;
      case TrackingType.TIME_BASED:
        return !hasDuration;
      case TrackingType.DISTANCE_AND_TIME:
        return !hasDuration;
      case TrackingType.DISTANCE_ONLY:
        return !hasDistance;
      default:
        return false;
    }
  });
}


export interface FinalizableExercise {
  logExerciseId?: number;
  trackingType: TrackingType;
  sets: ValidatableSet[];
}

export interface FinalizeResult {
  finalizedExercises: IFinalizedExercise[];
  hasEmptyCompleted: boolean;
}

/**
 * Build the payload sent to PATCH /workouts/:id/complete.
 * - Keeps only completed sets, in display order, renumbered 1..N.
 * - Resolves placeholder* values into actual values.
 * - Drops exercises with no completed sets or no logExerciseId.
 * - Reports if any completed set has a required field still empty after resolution.
 */
export function buildFinalizedExercises(
  exercises: FinalizableExercise[],
): FinalizeResult {
  const finalizedExercises: IFinalizedExercise[] = [];
  let hasEmptyCompleted = false;

  for (const ex of exercises) {
    if (ex.logExerciseId == null) continue;
    const completed = ex.sets.filter((s) => s.isCompleted);
    if (completed.length === 0) continue;

    const sets: IFinalizedSet[] = completed.map((s, idx) => {
      const weight = s.weight ?? s.placeholderWeight ?? undefined;
      const reps = s.reps ?? s.placeholderReps ?? undefined;
      const duration = s.duration ?? s.placeholderDuration ?? undefined;
      const distance = s.distance ?? s.placeholderDistance ?? undefined;

      switch (ex.trackingType) {
        case TrackingType.WEIGHT_AND_REPS:
          if (weight == null || reps == null) hasEmptyCompleted = true;
          break;
        case TrackingType.REPS_ONLY:
          if (reps == null) hasEmptyCompleted = true;
          break;
        case TrackingType.TIME_BASED:
        case TrackingType.DISTANCE_AND_TIME:
          if (duration == null) hasEmptyCompleted = true;
          break;
        case TrackingType.DISTANCE_ONLY:
          if (distance == null) hasEmptyCompleted = true;
          break;
      }

      return {
        order: idx + 1,
        weight: weight ?? undefined,
        reps: reps ?? undefined,
        duration: duration ?? undefined,
        distance: distance ?? undefined,
      };
    });

    finalizedExercises.push({ logExerciseId: ex.logExerciseId, sets });
  }

  return { finalizedExercises, hasEmptyCompleted };
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
    case 4:
      return TrackingType.DISTANCE_AND_TIME;
    case 5:
      return TrackingType.DISTANCE_ONLY;
    default:
      return TrackingType.WEIGHT_AND_REPS;
  }
}

export function trackingTypeIcon(trackingTypeId?: number | null): string {
  switch (trackingTypeId) {
    case 2:
      return ICONS.reps;
    case 3:
      return ICONS.time;
    case 4:
      return ICONS.distanceAndTime;
    case 5:
      return ICONS.distanceOnly;
    default:
      return ICONS.volume;
  }
}

export function formatDurationRange(startedAt: Date | string, endedAt?: Date | string | null): string {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : serverNow();
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
