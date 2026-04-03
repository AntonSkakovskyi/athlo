export interface IExerciseProgressRecord {
  date: string;
  bestValue: number;
  workoutId: number;
}

export interface IExerciseProgress {
  exerciseId: number;
  trackingType: string;
  records: IExerciseProgressRecord[];
}
