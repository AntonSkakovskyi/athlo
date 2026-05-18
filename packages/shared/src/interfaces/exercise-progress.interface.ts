import { ILogSet } from './log-set.interface';

export interface IExerciseProgressRecord {
  date: string;
  workoutId: number;
  heaviestWeight: number | null;
  bestSetVolume: number | null;
  totalVolume: number | null;
  totalReps: number | null;
  bestDuration: number | null;
  bestDistance: number | null;
  sets: ILogSet[];
}

export interface IExerciseProgress {
  exerciseId: number;
  trackingType: string;
  records: IExerciseProgressRecord[];
}
