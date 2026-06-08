import type { IAchievement } from './achievement.interface.js';

export interface ILogSet {
  id: number;
  logExerciseId: number;
  order: number;
  weight?: number | null;
  reps?: number | null;
  duration?: number | null;
  distance?: number | null;
  isCompleted: boolean;
  isPR?: boolean;
  achievementId?: number | null;
  achievement?: IAchievement | null;
}