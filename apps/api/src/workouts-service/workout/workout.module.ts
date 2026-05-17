import { Module } from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { WorkoutController } from './workout.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutEntity } from '../entities/workout.entity';
import { LogSetEntity } from '../entities/log-set.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { AchievementModule } from '../achievement/achievement.module';
import { FriendModule } from '../../user-service/friends/friend.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkoutEntity, LogSetEntity, LogExerciseEntity]),
    AchievementModule,
    FriendModule,
  ],
  controllers: [WorkoutController],
  providers: [WorkoutService],
  exports: [WorkoutService],
})
export class WorkoutModule {}
