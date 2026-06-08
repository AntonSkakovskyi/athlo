import type { IMetricType } from './metric-type.interface.js';

export interface IBodyMetric {
  id: number;
  metricTypeId: number;
  userId: number;
  value: number;
  recordedAt: Date;
  metricType?: IMetricType;
}
