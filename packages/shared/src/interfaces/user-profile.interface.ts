import { IUser } from './user.interface.js';

export interface IUserProfile extends IUser {
  waterGoal: number | null;
  proteinGoal: number | null;
  fatGoal: number | null;
  carbGoal: number | null;
}
