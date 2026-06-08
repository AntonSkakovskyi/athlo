import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingTypeEntity } from '../entities/tracking-type.entity';
import { TrackingTypeService } from './tracking-type.service';
import { TrackingTypeController } from './tracking-type.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TrackingTypeEntity])],
  controllers: [TrackingTypeController],
  providers: [TrackingTypeService],
})
export class TrackingTypeModule {}
