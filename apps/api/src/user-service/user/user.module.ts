import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserSettingEntity } from './entities/user-setting.entity';
import { DailyGoalEntity } from '../../nutrition-service/entities/daily-goal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, UserSettingEntity, DailyGoalEntity]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
