import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserProfile, calculateGoals, AnthropometryData } from '@athlo/shared';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UserSettingEntity } from './entities/user-setting.entity';
import { DailyGoalEntity } from '../../nutrition-service/entities/daily-goal.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserSettingEntity)
    private readonly settingRepository: Repository<UserSettingEntity>,
    @InjectRepository(DailyGoalEntity)
    private readonly dailyGoalRepository: Repository<DailyGoalEntity>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...rest } = createUserDto;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      ...rest,
      password_hash: passwordHash,
    });
    return await this.userRepository.save(user);
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }
    return user;
  }

  private async findOneById(id: number) {
    return this.userRepository.findOne({
      where: { id },
      relations: ['settings'],
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async getProfile(id: number): Promise<IUserProfile> {
    const user = await this.findOne(id);
    const { password_hash, settings, workouts, ...profile } = user;
    return {
      ...profile,
      waterGoal: settings?.waterGoal ?? null,
      proteinGoal: settings?.proteinGoal ?? null,
      fatGoal: settings?.fatGoal ?? null,
      carbGoal: settings?.carbGoal ?? null,
    };
  }

  async searchUsers(query: string, currentUserId: number) {
    return this.userRepository
      .createQueryBuilder('user')
      .where('(user.nickname ILIKE :query OR user.fullName ILIKE :query)', {
        query: `%${query}%`,
      })
      .andWhere('user.id != :currentUserId', { currentUserId })
      .limit(20)
      .getMany()
      .then((users) => users.map(({ password_hash, ...u }) => u));
  }

  async updateProfile(
    id: number,
    dto: UpdateProfileDto,
  ): Promise<IUserProfile> {
    const user = await this.findOne(id);
    const {
      waterGoal,
      proteinGoal,
      fatGoal,
      carbGoal,
      gender,
      age,
      height,
      weight,
      activityLevel,
      fitnessGoal,
      ...userDto
    } = dto;

    // Update basic user info and anthropometry
    Object.assign(user, userDto);
    if (gender !== undefined) user.gender = gender;
    if (age !== undefined) user.age = age;
    if (height !== undefined) user.height = height;
    if (weight !== undefined) user.weight = weight;
    if (activityLevel !== undefined) user.activityLevel = activityLevel;
    if (fitnessGoal !== undefined) user.fitnessGoal = fitnessGoal;

    let settings = await this.settingRepository.findOne({
      where: { userId: id },
    });
    if (!settings) {
      settings = this.settingRepository.create({ userId: id });
    }

    const hasExplicitGoals =
      waterGoal !== undefined ||
      proteinGoal !== undefined ||
      fatGoal !== undefined ||
      carbGoal !== undefined;
    const hasAnthropometryChanges =
      gender !== undefined ||
      age !== undefined ||
      height !== undefined ||
      weight !== undefined ||
      activityLevel !== undefined ||
      fitnessGoal !== undefined;

    // Recalculate goals if anthropometry changed and no explicit goals were provided
    if (hasAnthropometryChanges && !hasExplicitGoals) {
      const calcData: AnthropometryData = {
        gender: user.gender || (dto.gender as any),
        age: user.age || dto.age,
        height: user.height || dto.height,
        weight: user.weight || dto.weight,
        activityLevel: user.activityLevel || dto.activityLevel,
        goal: user.fitnessGoal || dto.fitnessGoal,
      } as AnthropometryData;

      if (
        calcData.gender &&
        calcData.age &&
        calcData.height &&
        calcData.weight &&
        calcData.activityLevel &&
        calcData.goal
      ) {
        const calculated = calculateGoals(calcData);
        settings.waterGoal = calculated.waterGoal;
        settings.proteinGoal = calculated.proteinGoal;
        settings.fatGoal = calculated.fatGoal;
        settings.carbGoal = calculated.carbGoal;
      }
    } else {
      // Apply explicit goals if provided
      if (waterGoal !== undefined) settings.waterGoal = waterGoal;
      if (proteinGoal !== undefined) settings.proteinGoal = proteinGoal;
      if (fatGoal !== undefined) settings.fatGoal = fatGoal;
      if (carbGoal !== undefined) settings.carbGoal = carbGoal;
    }

    await this.settingRepository.save(settings);
    user.settings = settings;

    const saved = await this.userRepository.save(user);

    // If goals were updated, delete future daily goals so they are recreated with new values
    if (hasExplicitGoals || hasAnthropometryChanges) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await this.dailyGoalRepository.delete({
        userId: id,
        date: MoreThanOrEqual(today),
      });
    }

    const {
      password_hash,
      settings: savedSettings,
      workouts,
      ...profile
    } = saved;
    return {
      ...profile,
      waterGoal: savedSettings?.waterGoal ?? null,
      proteinGoal: savedSettings?.proteinGoal ?? null,
      fatGoal: savedSettings?.fatGoal ?? null,
      carbGoal: savedSettings?.carbGoal ?? null,
    };
  }

  async delete(id: number) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return true;
  }
}
