export interface ILogSet {
  id: number;
  logExerciseId: number;
  order: number;
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  isCompleted: boolean;
}