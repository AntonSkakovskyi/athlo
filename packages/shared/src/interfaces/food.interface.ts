import type { INutritionFact } from './nutrition-fact.interface';

export interface IFood {
  id: number;
  name: string;
  brand: string | null;
  creatorId: number | null;
  imageUrl?: string | null;
  units?: INutritionFact[];
}
