import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkoutEntity } from '../entities/workout.entity';
import { Repository } from 'typeorm';
import { UserService } from 'src/user-service/user/user.service';

@Injectable()
export class WorkoutService {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(WorkoutEntity)
    private readonly workoutsRepository: Repository<WorkoutEntity>,
  ) {}

  async initiateWorkout(userId: number) {
    const user = await this.userService.findOne(userId);
    const workout = this.workoutsRepository.create({
      user
    });
    return this.workoutsRepository.save(workout);
  }
}
