import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendRequestStatus } from '@athlo/shared';
import { UserFriendEntity } from './entities/user-friend.entity';
import { FriendStatusEntity } from './entities/friend-status.entity';
import { UserEntity } from '../user/entities/user.entity';

@Injectable()
export class FriendService {
  private statusIdCache: Map<FriendRequestStatus, number> | null = null;

  constructor(
    @InjectRepository(UserFriendEntity)
    private readonly friendRepository: Repository<UserFriendEntity>,
    @InjectRepository(FriendStatusEntity)
    private readonly friendStatusRepository: Repository<FriendStatusEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  private async ensureStatusCache(): Promise<Map<FriendRequestStatus, number>> {
    if (!this.statusIdCache) {
      const statuses = await this.friendStatusRepository.find();
      this.statusIdCache = new Map(
        statuses.map((s) => [s.name as FriendRequestStatus, s.id]),
      );
    }
    return this.statusIdCache;
  }

  private async getStatusId(status: FriendRequestStatus): Promise<number> {
    const cache = await this.ensureStatusCache();
    return cache.get(status)!;
  }

  async sendRequest(userId: number, friendId: number) {
    if (userId === friendId) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }

    const friendUser = await this.userRepository.findOne({
      where: { id: friendId },
    });
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
      const acceptedId = await this.getStatusId(FriendRequestStatus.ACCEPTED);
      if (existing.statusId === acceptedId) {
        throw new ConflictException('You are already friends with this user');
      }
      throw new ConflictException(
        'A friend request already exists between you and this user',
      );
    }

    const pendingId = await this.getStatusId(FriendRequestStatus.PENDING);
    const request = this.friendRepository.create({
      userId,
      friendId,
      statusId: pendingId,
    });
    await this.friendRepository.save(request);

    return { message: 'Friend request sent successfully' };
  }

  async acceptRequest(userId: number, requestId: number) {
    const request = await this.friendRepository.findOne({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException(
        `Friend request with ID ${requestId} not found`,
      );
    }

    if (request.friendId !== userId) {
      throw new ForbiddenException('You can only accept requests sent to you');
    }

    const pendingId = await this.getStatusId(FriendRequestStatus.PENDING);
    if (request.statusId !== pendingId) {
      throw new BadRequestException('This request is not pending');
    }

    const acceptedId = await this.getStatusId(FriendRequestStatus.ACCEPTED);
    request.statusId = acceptedId;
    await this.friendRepository.save(request);

    return { message: 'Friend request accepted' };
  }

  async rejectRequest(userId: number, requestId: number) {
    const request = await this.friendRepository.findOne({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException(
        `Friend request with ID ${requestId} not found`,
      );
    }

    if (request.friendId !== userId) {
      throw new ForbiddenException('You can only reject requests sent to you');
    }

    const pendingId = await this.getStatusId(FriendRequestStatus.PENDING);
    if (request.statusId !== pendingId) {
      throw new BadRequestException('This request is not pending');
    }

    await this.friendRepository.remove(request);

    return { message: 'Friend request rejected' };
  }

  async cancelRequest(userId: number, requestId: number) {
    const request = await this.friendRepository.findOne({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException(
        `Friend request with ID ${requestId} not found`,
      );
    }

    if (request.userId !== userId) {
      throw new ForbiddenException('You can only cancel requests you sent');
    }

    const pendingId = await this.getStatusId(FriendRequestStatus.PENDING);
    if (request.statusId !== pendingId) {
      throw new BadRequestException('This request is not pending');
    }

    await this.friendRepository.remove(request);

    return { message: 'Friend request cancelled' };
  }

  async removeFriend(userId: number, friendId: number) {
    if (userId === friendId) {
      throw new BadRequestException('Cannot remove yourself');
    }

    const acceptedId = await this.getStatusId(FriendRequestStatus.ACCEPTED);
    const friendship = await this.friendRepository.findOne({
      where: [
        { userId, friendId, statusId: acceptedId },
        { userId: friendId, friendId: userId, statusId: acceptedId },
      ],
    });
    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    await this.friendRepository.remove(friendship);

    return { message: 'Friend removed successfully' };
  }

  async getFriends(userId: number) {
    const acceptedId = await this.getStatusId(FriendRequestStatus.ACCEPTED);
    const friendships = await this.friendRepository.find({
      where: [
        { userId, statusId: acceptedId },
        { friendId: userId, statusId: acceptedId },
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
          avatar: other.avatar,
        });
      }
    });

    return Array.from(uniqueFriends.values());
  }

  async getIncomingRequests(userId: number) {
    const pendingId = await this.getStatusId(FriendRequestStatus.PENDING);
    const requests = await this.friendRepository.find({
      where: { friendId: userId, statusId: pendingId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    return requests.map((r) => ({
      id: r.id,
      userId: r.userId,
      fullName: r.user.fullName,
      nickname: r.user.nickname,
      email: r.user.email,
      avatar: r.user.avatar,
      createdAt: r.createdAt,
    }));
  }

  async getOutgoingRequests(userId: number) {
    const pendingId = await this.getStatusId(FriendRequestStatus.PENDING);
    const requests = await this.friendRepository.find({
      where: { userId, statusId: pendingId },
      relations: { friend: true },
      order: { createdAt: 'DESC' },
    });

    return requests.map((r) => ({
      id: r.id,
      friendId: r.friendId,
      fullName: r.friend.fullName,
      nickname: r.friend.nickname,
      email: r.friend.email,
      avatar: r.friend.avatar,
      createdAt: r.createdAt,
    }));
  }

  async isFriend(userId: number, otherUserId: number): Promise<boolean> {
    const acceptedId = await this.getStatusId(FriendRequestStatus.ACCEPTED);
    const friendship = await this.friendRepository.findOne({
      where: [
        { userId, friendId: otherUserId, statusId: acceptedId },
        { userId: otherUserId, friendId: userId, statusId: acceptedId },
      ],
    });
    return !!friendship;
  }

  async getFriendIds(userId: number): Promise<number[]> {
    const acceptedId = await this.getStatusId(FriendRequestStatus.ACCEPTED);
    const friendships = await this.friendRepository.find({
      where: [
        { userId, statusId: acceptedId },
        { friendId: userId, statusId: acceptedId },
      ],
    });
    return Array.from(
      new Set(
        friendships.map((f) => (f.userId === userId ? f.friendId : f.userId)),
      ),
    );
  }
}
