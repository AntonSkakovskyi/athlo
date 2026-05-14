export interface IExerciseProgressRecord {
  date: string;
  workoutId: number;
  heaviestWeight: number | null;
  bestSetVolume: number | null;
  totalVolume: number | null;
  totalReps: number | null;
  bestDuration: number | null;
  bestDistance: number | null;
}

export interface IExerciseProgress {
  exerciseId: number;
  trackingType: string;
  records: IExerciseProgressRecord[];
}
