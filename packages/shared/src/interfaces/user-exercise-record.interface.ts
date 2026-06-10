export interface IUserExerciseRecord {
  id: number;
  userId: number;
  exerciseId: number;
  logSetId: number | null;
  metricTypeId: number;
  value: number;
  createdAt: Date;
  trackingMetric?: { id: number; name: string } | null;
}
