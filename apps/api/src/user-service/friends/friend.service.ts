import { BadRequestException, ConflictException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendRequestStatus } from '@athlo/shared';
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

  async sendRequest(userId: number, friendId: number) {
    if (userId === friendId) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }

    const friendUser = await this.userRepository.findOne({ where: { id: friendId } });
    if (!friendUser) {
      throw new NotFoundException(`User with ID ${friendId} not found`);
    }

    const existing = await this.friendRepository.findOne({
      where: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    });

    if (existing) {
      if (existing.status === FriendRequestStatus.ACCEPTED) {
        throw new ConflictException('You are already friends with this user');
      }
      throw new ConflictException('A friend request already exists between you and this user');
    }

    const request = this.friendRepository.create({
      userId,
      friendId,
      status: FriendRequestStatus.PENDING,
    });
    await this.friendRepository.save(request);

    return { message: 'Friend request sent successfully' };
  }

  async acceptRequest(userId: number, requestId: number) {
    const request = await this.friendRepository.findOne({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException(`Friend request with ID ${requestId} not found`);
    }

    if (request.friendId !== userId) {
      throw new ForbiddenException('You can only accept requests sent to you');
    }

    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException('This request is not pending');
    }

    request.status = FriendRequestStatus.ACCEPTED;
    await this.friendRepository.save(request);

    return { message: 'Friend request accepted' };
  }

  async rejectRequest(userId: number, requestId: number) {
    const request = await this.friendRepository.findOne({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException(`Friend request with ID ${requestId} not found`);
    }

    if (request.friendId !== userId) {
      throw new ForbiddenException('You can only reject requests sent to you');
    }

    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException('This request is not pending');
    }

    await this.friendRepository.remove(request);

    return { message: 'Friend request rejected' };
  }

  async cancelRequest(userId: number, requestId: number) {
    const request = await this.friendRepository.findOne({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException(`Friend request with ID ${requestId} not found`);
    }

    if (request.userId !== userId) {
      throw new ForbiddenException('You can only cancel requests you sent');
    }

    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException('This request is not pending');
    }

    await this.friendRepository.remove(request);

    return { message: 'Friend request cancelled' };
  }

  async removeFriend(userId: number, friendId: number) {
    if (userId === friendId) {
      throw new BadRequestException('Cannot remove yourself');
    }

    const friendship = await this.friendRepository.findOne({
      where: [
        { userId, friendId, status: FriendRequestStatus.ACCEPTED },
        { userId: friendId, friendId: userId, status: FriendRequestStatus.ACCEPTED },
      ],
    });
    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    await this.friendRepository.remove(friendship);

    return { message: 'Friend removed successfully' };
  }

  async getFriends(userId: number) {
    const friendships = await this.friendRepository.find({
      where: [
        { userId, status: FriendRequestStatus.ACCEPTED },
        { friendId: userId, status: FriendRequestStatus.ACCEPTED },
      ],
      relations: { user: true, friend: true },
    });

    const uniqueFriends = new Map();
    friendships.forEach((f) => {
      const other = f.userId === userId ? f.friend : f.user;
      if (!uniqueFriends.has(other.id)) {
        uniqueFriends.set(other.id, {
          id: other.id,
          fullName: other.fullName,
          nickname: other.nickname,
          email: other.email,
        });
      }
    });

    return Array.from(uniqueFriends.values());
  }

  async getIncomingRequests(userId: number) {
    const requests = await this.friendRepository.find({
      where: { friendId: userId, status: FriendRequestStatus.PENDING },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    return requests.map((r) => ({
      id: r.id,
      userId: r.userId,
      fullName: r.user.fullName,
      nickname: r.user.nickname,
      email: r.user.email,
      createdAt: r.createdAt,
    }));
  }

  async getOutgoingRequests(userId: number) {
    const requests = await this.friendRepository.find({
      where: { userId, status: FriendRequestStatus.PENDING },
      relations: { friend: true },
      order: { createdAt: 'DESC' },
    });

    return requests.map((r) => ({
      id: r.id,
      friendId: r.friendId,
      fullName: r.friend.fullName,
      nickname: r.friend.nickname,
      email: r.friend.email,
      createdAt: r.createdAt,
    }));
  }

  async isFriend(userId: number, otherUserId: number): Promise<boolean> {
    const friendship = await this.friendRepository.findOne({
      where: [
        { userId, friendId: otherUserId, status: FriendRequestStatus.ACCEPTED },
        { userId: otherUserId, friendId: userId, status: FriendRequestStatus.ACCEPTED },
      ],
    });
    return !!friendship;
  }

  async getFriendIds(userId: number): Promise<number[]> {
    const friendships = await this.friendRepository.find({
      where: [
        { userId, status: FriendRequestStatus.ACCEPTED },
        { friendId: userId, status: FriendRequestStatus.ACCEPTED },
      ],
    });
    return Array.from(new Set(friendships.map((f) => (f.userId === userId ? f.friendId : f.userId))));
  }
}
