import { Gender, ActivityLevel, FitnessGoal } from '../enums/index.js';

export interface IUser {
  id: number;
  fullName: string;
  nickname: string;
  email: string;
  avatar?: string | null;
  
  // Anthropometry
  gender?: Gender;
  birthDate?: string | null; // ISO date (YYYY-MM-DD)
  height?: number;
  weight?: number;
  activityLevel?: ActivityLevel;
  fitnessGoal?: FitnessGoal;
}
