import { Module } from '@nestjs/common';
import { ExerciseModule } from './exercise/exercise.module';
import { MuscleModule } from './muscle/muscle.module';
import { EquipmentModule } from './equipment/equipment.module';
import { TrackingTypeModule } from './tracking-type/tracking-type.module';

@Module({
  imports: [ExerciseModule, MuscleModule, EquipmentModule, TrackingTypeModule],
})
export class ExerciseCatalogModule {}
