export interface IUserExerciseRecord {
  id: number;
  userId: number;
  exerciseId: number;
  bestWeight: number | null;
  bestReps: number | null;
  bestDuration: number | null;
  bestDistance: number | null;
  estimated1rm: number | null;
  updatedAt: Date;
}
