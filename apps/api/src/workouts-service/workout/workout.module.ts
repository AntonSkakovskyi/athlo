import { Module } from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { WorkoutController } from './workout.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutEntity } from '../entities/workout.entity';
import { UserModule } from 'src/user-service/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkoutEntity]),
    UserModule
  ],
  controllers: [WorkoutController],
  providers: [WorkoutService],
})
export class WorkoutModule {}
