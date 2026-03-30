export interface IMealPlan {
  id: number;
  creatorId: number;
  visibilityTypeId: number;
  name: string;
  description: string | null;
  totalDays: number;
}
