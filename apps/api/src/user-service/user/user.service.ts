import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  create(createUserDto: CreateUserDto) {
    const { password, ...rest } = createUserDto;
    const user = this.userRepository.create({
      ...rest,
      password_hash: password,
    });
    return this.userRepository.save(user);
  }

  findAll() {
    return `This action returns all user`;
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id }
    });

    if (!user) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }

    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async delete(id: number) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);

    return true
  }

  
}
