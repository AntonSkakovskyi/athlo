import { IUser } from './user.interface.js';

export interface IUserProfile extends IUser {
  calorieGoal: number | null;
  waterGoal: number | null;
  proteinGoal: number | null;
  fatGoal: number | null;
  carbGoal: number | null;
}
