import { Module } from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { WorkoutController } from './workout.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutEntity } from '../entities/workout.entity';
import { LogSetEntity } from '../entities/log-set.entity';
import { AchievementModule } from '../achievement/achievement.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkoutEntity, LogSetEntity]),
    AchievementModule,
  ],
  controllers: [WorkoutController],
  providers: [WorkoutService],
  exports: [WorkoutService],
})
export class WorkoutModule {}
