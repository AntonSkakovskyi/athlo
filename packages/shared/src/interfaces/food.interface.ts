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
  imageUrl?: string | null;
  barcode?: string | null;
  servingSizeG?: number | null;
  fiber?: number | null;
  sugar?: number | null;
  sodiumMg?: number | null;
  units?: IFoodUnit[];
}
