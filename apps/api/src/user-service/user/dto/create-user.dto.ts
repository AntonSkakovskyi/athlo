import type { IUser } from '@athlo/shared';

export type CreateUserDto = Omit<IUser, 'id' | 'password_hash'> & {
  password: string;
};
