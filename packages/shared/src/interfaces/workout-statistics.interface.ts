export interface IMonthlyWorkoutCount {
  month: string;
  count: number;
}

export interface IWorkoutChartPoint {
  date: string;
  workoutsCount: number;
  totalSets: number;
  totalDurationMinutes: number;
  totalVolume: number;
  totalReps: number;
}

export interface IWorkoutStatistics {
  totalWorkouts: number;
  totalSets: number;
  totalWeightLifted: number;
  averageDurationMinutes: number | null;
  workoutsPerMonth: IMonthlyWorkoutCount[];
  chartData: IWorkoutChartPoint[];
}
