export interface IUser {
  id: number;
  fullName: string;
  nickname: string;
  email: string;
  waterGoal?: number | null;
  proteinGoal?: number | null;
  fatGoal?: number | null;
  carbGoal?: number | null;
}