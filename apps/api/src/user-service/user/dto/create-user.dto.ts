import { IsEmail, IsString, MinLength } from 'class-validator';
import type { IUser } from '@athlo/shared';

export class CreateUserDto implements Omit<IUser, 'id'> {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  fullName: string;

  @IsString()
  @MinLength(2)
  nickname: string;

  @IsString()
  @MinLength(6)
  password: string;
}
