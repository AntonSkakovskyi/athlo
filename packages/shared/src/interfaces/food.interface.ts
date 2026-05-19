import type { IFoodUnit } from './food-unit.interface';

export interface IFood {
  id: number;
  name: string;
  brand: string | null;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  creatorId: number | null;
  units?: IFoodUnit[];
}
