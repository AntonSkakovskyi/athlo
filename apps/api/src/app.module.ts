import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/typeorm.config';
import { WorkoutsServiceModule } from './workouts-service/workouts-service.module';
import { UserServiceModule } from './user-service/user-service.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService],
    }),
    WorkoutsServiceModule,
    UserServiceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
