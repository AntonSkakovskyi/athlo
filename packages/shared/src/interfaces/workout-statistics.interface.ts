export interface IMonthlyWorkoutCount {
  month: string;
  count: number;
}

export interface IWorkoutStatistics {
  totalWorkouts: number;
  totalSets: number;
  totalWeightLifted: number;
  averageDurationMinutes: number | null;
  workoutsPerMonth: IMonthlyWorkoutCount[];
}
