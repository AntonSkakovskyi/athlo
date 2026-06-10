import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementService } from './achievement.service';
import { AchievementController } from './achievement.controller';
import { AchievementEntity } from './entities/achievement.entity';
import { UserAchievementEntity } from './entities/user-achievement.entity';
import { UserExerciseRecordEntity } from './entities/user-exercise-record.entity';
import { TrackingMetricEntity } from '../../exercise-catalog/entities/tracking-metric.entity';
import { LogSetEntity } from '../entities/log-set.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { WorkoutEntity } from '../entities/workout.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AchievementEntity,
      UserAchievementEntity,
      UserExerciseRecordEntity,
      TrackingMetricEntity,
      LogSetEntity,
      LogExerciseEntity,
      WorkoutEntity,
    ]),
  ],
  controllers: [AchievementController],
  providers: [AchievementService],
  exports: [AchievementService],
})
export class AchievementModule {}
