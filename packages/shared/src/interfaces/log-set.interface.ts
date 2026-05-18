import type { IAchievement } from './achievement.interface.js';

export interface ILogSet {
  id: number;
  logExerciseId: number;
  order: number;
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  isCompleted: boolean;
  isPR?: boolean;
  achievementId?: number | null;
  achievement?: IAchievement | null;
}