import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { BodyMetricModule } from './body-metrics/body-metric.module';

@Module({
  imports: [UserModule, AuthModule, BodyMetricModule]
})
export class UserServiceModule {}
