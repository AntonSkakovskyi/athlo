export interface IUser {
  id: number;
  fullName: string;
  nickname: string;
  email: string;
  waterGoal?: number | null;
}