import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserProfile, calculateGoals, AnthropometryData } from '@athlo/shared';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DataSource, Repository, MoreThanOrEqual } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UserSettingEntity } from './entities/user-setting.entity';
import { DailyGoalEntity } from '../../nutrition-service/entities/daily-goal.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

// Вік у повних роках із дати народження; null/невалідна дата → undefined,
// щоб calculateGoals коректно пропустив перерахунок.
function ageFromBirthDate(
  birthDate?: string | Date | null,
): number | undefined {
  if (!birthDate) return undefined;
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserSettingEntity)
    private readonly settingRepository: Repository<UserSettingEntity>,
    private readonly dataSource: DataSource,
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

  async existsById(id: number): Promise<boolean> {
    return this.userRepository.exists({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  async getProfile(id: number): Promise<IUserProfile> {
    const user = await this.findOne(id);
    const { password_hash, settings, workouts, ...profile } = user;
    return {
      ...profile,
      calorieGoal: settings?.calorieGoal ?? null,
      waterGoal: settings?.waterGoal ?? null,
      proteinGoal: settings?.proteinGoal ?? null,
      fatGoal: settings?.fatGoal ?? null,
      carbGoal: settings?.carbGoal ?? null,
    };
  }

  // Публічний профіль чужого користувача: тільки білий список полів,
  // без email, антропометрії та цілей
  async getPublicProfile(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: { id: true, fullName: true, nickname: true, avatar: true },
    });
    if (!user) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }
    return user;
  }

  async searchUsers(
    query: string,
    currentUserId: number,
    limit = 10,
    offset = 0,
  ) {
    return this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.fullName', 'user.nickname', 'user.avatar'])
      .leftJoin(
        'user_friends',
        'uf',
        '(uf.user_id = :me AND uf.friend_id = user.id) OR (uf.friend_id = :me AND uf.user_id = user.id)',
        { me: currentUserId },
      )
      .where('(user.nickname ILIKE :query OR user.fullName ILIKE :query)', {
        query: `%${query}%`,
      })
      .andWhere('user.id != :me', { me: currentUserId })
      .andWhere('uf.id IS NULL')
      .limit(limit)
      .offset(offset)
      .getMany();
  }

  async updateProfile(
    id: number,
    dto: UpdateProfileDto,
  ): Promise<IUserProfile> {
    const user = await this.findOne(id);
    const {
      calorieGoal,
      waterGoal,
      proteinGoal,
      fatGoal,
      carbGoal,
      gender,
      birthDate,
      height,
      weight,
      activityLevel,
      fitnessGoal,
      ...userDto
    } = dto;

    // Update basic user info and anthropometry
    Object.assign(user, userDto);
    if (gender !== undefined) user.gender = gender;
    if (birthDate !== undefined) user.birthDate = birthDate;
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
      calorieGoal !== undefined ||
      waterGoal !== undefined ||
      proteinGoal !== undefined ||
      fatGoal !== undefined ||
      carbGoal !== undefined;
    const hasAnthropometryChanges =
      gender !== undefined ||
      birthDate !== undefined ||
      height !== undefined ||
      weight !== undefined ||
      activityLevel !== undefined ||
      fitnessGoal !== undefined;

    // Recalculate goals if anthropometry changed and no explicit goals were provided
    if (hasAnthropometryChanges && !hasExplicitGoals) {
      const age = ageFromBirthDate(user.birthDate);
      const calcData: AnthropometryData = {
        gender: user.gender || (dto.gender as any),
        age,
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
        settings.calorieGoal = calculated.calorieGoal;
        settings.waterGoal = calculated.waterGoal;
        settings.proteinGoal = calculated.proteinGoal;
        settings.fatGoal = calculated.fatGoal;
        settings.carbGoal = calculated.carbGoal;
      }
    } else {
      // Apply explicit goals if provided
      if (calorieGoal !== undefined) settings.calorieGoal = calorieGoal;
      if (waterGoal !== undefined) settings.waterGoal = waterGoal;
      if (proteinGoal !== undefined) settings.proteinGoal = proteinGoal;
      if (fatGoal !== undefined) settings.fatGoal = fatGoal;
      if (carbGoal !== undefined) settings.carbGoal = carbGoal;
    }

    const saved = await this.dataSource.transaction(async (em) => {
      await em.save(settings);
      user.settings = settings;

      const savedUser = await em.save(user);

      // If goals were updated, delete future daily goals so they are recreated with new values
      if (hasExplicitGoals || hasAnthropometryChanges) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await em.delete(DailyGoalEntity, {
          userId: id,
          date: MoreThanOrEqual(today),
        });
      }

      return savedUser;
    });

    const {
      password_hash,
      settings: savedSettings,
      workouts,
      ...profile
    } = saved;
    return {
      ...profile,
      calorieGoal: savedSettings?.calorieGoal ?? null,
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
