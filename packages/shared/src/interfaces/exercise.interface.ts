export interface IExercise {
  id: number;
  name: string;
  description?: string | null;
  equipmentId?: number | null;
  trackingTypeId?: number | null;
  userId?: number | null;
  visibilityTypeId?: number;
}