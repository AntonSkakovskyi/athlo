import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MuscleEntity } from '../entities/muscle.entity';
import { MuscleService } from './muscle.service';
import { MuscleController } from './muscle.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MuscleEntity])],
  controllers: [MuscleController],
  providers: [MuscleService],
  exports: [MuscleService],
})
export class MuscleModule {}
