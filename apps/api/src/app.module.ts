import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/typeorm.config';
import { QueryFailedFilter } from './common/filters/query-failed.filter';
import { JwtAuthGuard } from './user-service/auth/guards/jwt-auth.guard';
import { WorkoutsServiceModule } from './workouts-service/workouts-service.module';
import { UserServiceModule } from './user-service/user-service.module';
import { ExerciseCatalogModule } from './exercise-catalog/exercise-catalog.module';
import { NutritionServiceModule } from './nutrition-service/nutrition-service.module';

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
    // Глобальний rate-limit; чутливі ендпоінти (login/register)
    // жорсткіше обмежені через @Throttle в AuthController
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    WorkoutsServiceModule,
    UserServiceModule,
    ExerciseCatalogModule,
    NutritionServiceModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: QueryFailedFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Глобальна автентифікація: усі маршрути захищені JWT, окрім @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
