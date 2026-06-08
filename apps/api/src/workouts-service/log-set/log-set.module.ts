import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogSetEntity } from '../entities/log-set.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { WorkoutEntity } from '../entities/workout.entity';
import { LogSetService } from './log-set.service';
import { LogSetController } from './log-set.controller';
import { AchievementModule } from '../achievement/achievement.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LogSetEntity, LogExerciseEntity, WorkoutEntity]),
    AchievementModule,
  ],
  controllers: [LogSetController],
  providers: [LogSetService],
  exports: [LogSetService],
})
export class LogSetModule {}
