import { Module } from '@nestjs/common';
import { ExerciseModule } from './exercise/exercise.module';
import { MuscleModule } from './muscle/muscle.module';
import { EquipmentModule } from './equipment/equipment.module';

@Module({
  imports: [ExerciseModule, MuscleModule, EquipmentModule],
})
export class ExerciseCatalogModule {}
