import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
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
    const user = await this.userRepository.findOne({ where: { id } });
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
    return profile;
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

  async updateProfile(id: number, dto: UpdateProfileDto) {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    const saved = await this.userRepository.save(user);
    const { password_hash, ...profile } = saved;
    return profile;
  }

  async delete(id: number) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return true;
  }
}
