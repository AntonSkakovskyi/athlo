import { TrackingType } from '@athlo/shared';

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

export function formatDuration(startedAt: Date | string, endedAt?: Date | string | null): string {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const diff = Math.floor((end - start) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
