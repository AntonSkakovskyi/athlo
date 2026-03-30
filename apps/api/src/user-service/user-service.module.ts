import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { BodyMetricModule } from './body-metrics/body-metric.module';
import { FriendModule } from './friends/friend.module';

@Module({
  imports: [UserModule, AuthModule, BodyMetricModule, FriendModule],
  exports: [FriendModule],
})
export class UserServiceModule {}
