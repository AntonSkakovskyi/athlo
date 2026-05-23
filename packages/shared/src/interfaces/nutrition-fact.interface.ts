import type { IUnit } from './unit.interface.js';

export interface INutritionFact {
  id: number;
  foodId: number;
  unitId: number;
  amount: number;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  unit?: IUnit;
}
