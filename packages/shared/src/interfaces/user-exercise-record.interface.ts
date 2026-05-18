export interface IUserExerciseRecord {
  id: number;
  userId: number;
  exerciseId: number;
  logSetId: number | null;
  metricType: string; // 'WEIGHT', 'REPS', 'DURATION', 'DISTANCE', '1RM'
  value: number;
  createdAt: Date;
}
