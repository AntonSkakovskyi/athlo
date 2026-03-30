import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFriendEntity } from './entities/user-friend.entity';
import { UserEntity } from '../user/entities/user.entity';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(UserFriendEntity)
    private readonly friendRepository: Repository<UserFriendEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async addFriend(userId: number, friendId: number) {
    if (userId === friendId) {
      throw new BadRequestException('Cannot add yourself as a friend');
    }

    const friendUser = await this.userRepository.findOne({ where: { id: friendId } });
    if (!friendUser) {
      throw new NotFoundException(`User with ID ${friendId} not found`);
    }

    const existing = await this.friendRepository.findOne({
      where: { userId, friendId },
    });
    if (existing) {
      throw new ConflictException('This user is already your friend');
    }

    const friendship = this.friendRepository.create({ userId, friendId });
    await this.friendRepository.save(friendship);

    // Create reverse friendship
    const reverse = await this.friendRepository.findOne({
      where: { userId: friendId, friendId: userId },
    });
    if (!reverse) {
      const reverseFriendship = this.friendRepository.create({ userId: friendId, friendId: userId });
      await this.friendRepository.save(reverseFriendship);
    }

    return { message: 'Friend added successfully' };
  }

  async removeFriend(userId: number, friendId: number) {
    if (userId === friendId) {
      throw new BadRequestException('Cannot remove yourself');
    }

    const friendship = await this.friendRepository.findOne({
      where: { userId, friendId },
    });
    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    await this.friendRepository.remove(friendship);

    // Remove reverse friendship
    const reverse = await this.friendRepository.findOne({
      where: { userId: friendId, friendId: userId },
    });
    if (reverse) {
      await this.friendRepository.remove(reverse);
    }

    return { message: 'Friend removed successfully' };
  }

  async getFriends(userId: number) {
    const friendships = await this.friendRepository.find({
      where: { userId },
      relations: { friend: true },
    });

    return friendships.map((f) => ({
      id: f.friend.id,
      fullName: f.friend.fullName,
      nickname: f.friend.nickname,
      email: f.friend.email,
    }));
  }

  async isFriend(userId: number, otherUserId: number): Promise<boolean> {
    const friendship = await this.friendRepository.findOne({
      where: { userId, friendId: otherUserId },
    });
    return !!friendship;
  }

  async getFriendIds(userId: number): Promise<number[]> {
    const friendships = await this.friendRepository.find({
      where: { userId },
      select: ['friendId'],
    });
    return friendships.map((f) => f.friendId);
  }
}
