import type { IUnit } from './unit.interface.js';

export interface IMetricType {
  id: number;
  unitId: number;
  name: string;
  unit?: IUnit;
}
