export interface IBodyMetricHistoryRecord {
  date: string;
  value: number;
}

export interface IBodyMetricProgress {
  metricTypeId: number;
  current: number | null;
  min: number | null;
  max: number | null;
  change: number | null;
  history: IBodyMetricHistoryRecord[];
}
