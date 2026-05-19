import type { IUnit } from './unit.interface.js';

export interface IFoodUnit {
  id: number;
  foodId: number;
  unitId: number;
  conversionFactor: number;
  unit?: IUnit;
}
