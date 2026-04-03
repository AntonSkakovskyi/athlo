import type { ILogSet } from './log-set.interface.js';

export interface ILastPerformance {
  workoutId: number;
  workoutName: string;
  date: string;
  sets: ILogSet[];
}
