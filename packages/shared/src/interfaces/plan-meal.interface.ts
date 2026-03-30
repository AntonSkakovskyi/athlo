export interface IPlanMeal {
  id: number;
  planDayId: number;
  mealTypeId: number;
  order: number;
  timeSuggestion: string | null;
}
