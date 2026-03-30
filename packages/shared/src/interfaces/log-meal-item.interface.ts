export interface ILogMealItem {
  id: number;
  logMealId: number;
  foodId: number;
  unitId: number;
  amount: number;
  calculatedWeightG: number | null;
}
