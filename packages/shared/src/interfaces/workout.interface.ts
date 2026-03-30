import type { WorkoutStatus } from '../enums/workout-status.enum';

export interface IWorkout {
  id: number;
  userId: number;
  visibilityTypeId: number;
  name: string;
  status: WorkoutStatus;
  started_at: string;
  ended_at: string;
  description: string;
  feelingScore: number;
}
