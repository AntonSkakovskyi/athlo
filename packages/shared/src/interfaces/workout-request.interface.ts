import type { VisibilityType } from '../enums/visibility-type.enum.js';
import type { IFinalizedExercise } from './finalized-workout.interface.js';

// Request-контракти workout-ендпоінтів. Backend DTO зобов'язані їх
// імплементувати, mobile — використовувати як тип тіла запиту:
// поле, відсутнє в контракті, не пройде компіляцію на жодній стороні.

export interface ICreateWorkoutRequest {
  name: string;
  description?: string;
}

export interface IUpdateWorkoutRequest {
  name?: string;
  description?: string;
  calories?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  rpe?: number;
  feelingScore?: number;
  ended_at?: string;
  visibility?: VisibilityType;
}

export interface ICompleteWorkoutRequest {
  calories?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  rpe?: number;
  feelingScore?: number;
  visibility?: VisibilityType;
  description?: string;
  finalizedExercises?: IFinalizedExercise[];
}
