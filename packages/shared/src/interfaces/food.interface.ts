import type { INutritionFact } from './nutrition-fact.interface.js';

export interface IFood {
  id: number;
  name: string;
  brand: string | null;
  creatorId: number | null;
  imageUrl?: string | null;
  units?: INutritionFact[];
}
