import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UserSettingEntity } from './entities/user-setting.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserSettingEntity)
    private readonly settingRepository: Repository<UserSettingEntity>,
  ) {}

  async create(createUserDto: CreateUserDto){
    const { password, ...rest } = createUserDto;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      ...rest,
      password_hash: passwordHash,
    });
    return await this.userRepository.save(user);
  }

  async findAll(){
    return await this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id }, relations: ['settings'] });
    if (!user) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async getProfile(id: number) {
    const user = await this.findOne(id);
    const { password_hash, ...profile } = user;
    return {
      ...profile,
      waterGoal: profile.settings?.waterGoal ?? null,
    };
  }

  async searchUsers(query: string, currentUserId: number) {
    return this.userRepository
      .createQueryBuilder('user')
      .where('(user.nickname ILIKE :query OR user.fullName ILIKE :query)', { query: `%${query}%` })
      .andWhere('user.id != :currentUserId', { currentUserId })
      .limit(20)
      .getMany()
      .then((users) => users.map(({ password_hash, ...u }) => u));
  }

  async updateProfile(id: number, dto: UpdateProfileDto & { waterGoal?: number | null }) {
    const user = await this.findOne(id);
    const { waterGoal, ...userDto } = dto;
    Object.assign(user, userDto);
    
    if (waterGoal !== undefined) {
      let settings = await this.settingRepository.findOne({ where: { userId: id } });
      if (!settings) {
        settings = this.settingRepository.create({ userId: id });
      }
      settings.waterGoal = waterGoal;
      await this.settingRepository.save(settings);
      user.settings = settings;
    }

    const saved = await this.userRepository.save(user);
    const { password_hash, ...profile } = saved;
    return {
      ...profile,
      waterGoal: profile.settings?.waterGoal ?? null,
    };
  }

  async delete(id: number) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return true;
  }
}
