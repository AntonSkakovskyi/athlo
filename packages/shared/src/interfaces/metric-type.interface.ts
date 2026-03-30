export interface IMetricType {
  id: number;
  // TODO why did I have here number | null?
  unitId: number;
  name: string;
}
