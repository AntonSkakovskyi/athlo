import type { WorkoutStatus } from '../enums/workout-status.enum.js';

export interface IWorkout {
  id: number;
  userId: number;
  visibilityTypeId: number;
  name: string;
  status: WorkoutStatus;
  started_at: Date | string;
  ended_at?: Date | string | null;
  description?: string | null;
  calories?: number | null;
  avgHeartRate?: number | null;
  maxHeartRate?: number | null;
  rpe?: number | null;
  feelingScore?: number | null;
}
