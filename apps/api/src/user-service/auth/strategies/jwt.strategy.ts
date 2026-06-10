import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';

export interface JwtPayload {
  sub: number;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Токен видаленого користувача не має лишатися валідним до закінчення
  // терміну дії — звіряємо існування користувача в БД
  async validate(payload: JwtPayload) {
    const exists = await this.userService.existsById(payload.sub);
    if (!exists) {
      throw new UnauthorizedException('User no longer exists');
    }
    return { id: payload.sub, email: payload.email };
  }
}
