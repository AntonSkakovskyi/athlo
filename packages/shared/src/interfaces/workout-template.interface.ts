export interface IWorkoutTemplate {
  id: number;
  creatorId: number;
  visibilityTypeId: number;
  name: string;
  description?: string | null;
}
