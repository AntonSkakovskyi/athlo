export interface ILogMeal {
  id: number;
  userId: number;
  mealTypeId: number | null;
  name: string | null;
  originalPlanMealId: number | null;
  consumedAt: Date;
  dayLogDate: Date;
}
