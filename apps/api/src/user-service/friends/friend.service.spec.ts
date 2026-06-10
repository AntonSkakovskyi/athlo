import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { UserFriendEntity } from './entities/user-friend.entity';
import { FriendStatusEntity } from './entities/friend-status.entity';
import { UserEntity } from '../user/entities/user.entity';
import { FriendRequestStatus } from '@athlo/shared';

const PENDING_ID = 1;
const ACCEPTED_ID = 2;

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('FriendService', () => {
  let service: FriendService;
  let friendRepo: ReturnType<typeof createMockRepository>;
  let friendStatusRepo: ReturnType<typeof createMockRepository>;
  let userRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendService,
        {
          provide: getRepositoryToken(UserFriendEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(FriendStatusEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<FriendService>(FriendService);
    friendRepo = module.get(getRepositoryToken(UserFriendEntity));
    friendStatusRepo = module.get(getRepositoryToken(FriendStatusEntity));
    userRepo = module.get(getRepositoryToken(UserEntity));

    friendStatusRepo.find.mockResolvedValue([
      { id: PENDING_ID, name: FriendRequestStatus.PENDING },
      { id: ACCEPTED_ID, name: FriendRequestStatus.ACCEPTED },
    ]);
  });

  afterEach(() => jest.clearAllMocks());

  describe('sendRequest', () => {
    it('should send a friend request successfully', async () => {
      userRepo.findOne.mockResolvedValue({ id: 2, email: 'friend@test.com' });
      friendRepo.findOne.mockResolvedValue(null);
      friendRepo.create.mockReturnValue({ userId: 1, friendId: 2, statusId: PENDING_ID });
      friendRepo.save.mockResolvedValue({});

      const result = await service.sendRequest(1, 2);

      expect(result).toEqual({ message: 'Friend request sent successfully' });
      expect(friendRepo.create).toHaveBeenCalledWith({
        userId: 1,
        friendId: 2,
        statusId: PENDING_ID,
      });
    });

    it('should throw BadRequestException when sending request to yourself', async () => {
      await expect(service.sendRequest(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when friend user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.sendRequest(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when already friends', async () => {
      userRepo.findOne.mockResolvedValue({ id: 2 });
      friendRepo.findOne.mockResolvedValue({ statusId: ACCEPTED_ID });

      await expect(service.sendRequest(1, 2)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when request already exists', async () => {
      userRepo.findOne.mockResolvedValue({ id: 2 });
      friendRepo.findOne.mockResolvedValue({ statusId: PENDING_ID });

      await expect(service.sendRequest(1, 2)).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptRequest', () => {
    it('should accept a pending friend request', async () => {
      const request = { id: 1, userId: 2, friendId: 1, statusId: PENDING_ID };
      friendRepo.findOne.mockResolvedValue(request);
      friendRepo.save.mockResolvedValue({ ...request, statusId: ACCEPTED_ID });

      const result = await service.acceptRequest(1, 1);

      expect(result).toEqual({ message: 'Friend request accepted' });
      expect(friendRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statusId: ACCEPTED_ID }),
      );
    });

    it('should throw NotFoundException when request does not exist', async () => {
      friendRepo.findOne.mockResolvedValue(null);

      await expect(service.acceptRequest(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when request is not sent to the user', async () => {
      friendRepo.findOne.mockResolvedValue({ id: 1, userId: 3, friendId: 2, statusId: PENDING_ID });

      await expect(service.acceptRequest(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when request is not pending', async () => {
      friendRepo.findOne.mockResolvedValue({ id: 1, userId: 2, friendId: 1, statusId: ACCEPTED_ID });

      await expect(service.acceptRequest(1, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectRequest', () => {
    it('should reject a pending friend request', async () => {
      const request = { id: 1, userId: 2, friendId: 1, statusId: PENDING_ID };
      friendRepo.findOne.mockResolvedValue(request);
      friendRepo.remove.mockResolvedValue(request);

      const result = await service.rejectRequest(1, 1);

      expect(result).toEqual({ message: 'Friend request rejected' });
      expect(friendRepo.remove).toHaveBeenCalledWith(request);
    });

    it('should throw NotFoundException when request does not exist', async () => {
      friendRepo.findOne.mockResolvedValue(null);

      await expect(service.rejectRequest(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when request is not sent to the user', async () => {
      friendRepo.findOne.mockResolvedValue({ id: 1, userId: 3, friendId: 2, statusId: PENDING_ID });

      await expect(service.rejectRequest(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when request is not pending', async () => {
      friendRepo.findOne.mockResolvedValue({ id: 1, userId: 2, friendId: 1, statusId: ACCEPTED_ID });

      await expect(service.rejectRequest(1, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelRequest', () => {
    it('should cancel a pending sent request', async () => {
      const request = { id: 1, userId: 1, friendId: 2, statusId: PENDING_ID };
      friendRepo.findOne.mockResolvedValue(request);
      friendRepo.remove.mockResolvedValue(request);

      const result = await service.cancelRequest(1, 1);

      expect(result).toEqual({ message: 'Friend request cancelled' });
      expect(friendRepo.remove).toHaveBeenCalledWith(request);
    });

    it('should throw NotFoundException when request does not exist', async () => {
      friendRepo.findOne.mockResolvedValue(null);

      await expect(service.cancelRequest(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when request was not sent by the user', async () => {
      friendRepo.findOne.mockResolvedValue({ id: 1, userId: 2, friendId: 1, statusId: PENDING_ID });

      await expect(service.cancelRequest(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when request is not pending', async () => {
      friendRepo.findOne.mockResolvedValue({ id: 1, userId: 1, friendId: 2, statusId: ACCEPTED_ID });

      await expect(service.cancelRequest(1, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeFriend', () => {
    it('should remove a friendship and return success message', async () => {
      const friendship = { id: 1, userId: 1, friendId: 2, statusId: ACCEPTED_ID };
      friendRepo.findOne.mockResolvedValue(friendship);
      friendRepo.remove.mockResolvedValue(friendship);

      const result = await service.removeFriend(1, 2);

      expect(result).toEqual({ message: 'Friend removed successfully' });
      expect(friendRepo.remove).toHaveBeenCalledWith(friendship);
    });

    it('should throw BadRequestException when trying to remove yourself', async () => {
      await expect(service.removeFriend(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when friendship does not exist', async () => {
      friendRepo.findOne.mockResolvedValue(null);

      await expect(service.removeFriend(1, 2)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFriends', () => {
    it('should return list of friends with basic info', async () => {
      const friendships = [
        {
          id: 1,
          userId: 1,
          friendId: 2,
          statusId: ACCEPTED_ID,
          user: { id: 1, fullName: 'Me', nickname: 'me', email: 'me@test.com' },
          friend: { id: 2, fullName: 'Friend', nickname: 'friend', email: 'friend@test.com' },
        },
      ];
      friendRepo.find.mockResolvedValue(friendships);

      const result = await service.getFriends(1);

      expect(result).toEqual([
        { id: 2, fullName: 'Friend', nickname: 'friend', email: 'friend@test.com' },
      ]);
    });

    it('should return empty array when user has no friends', async () => {
      friendRepo.find.mockResolvedValue([]);

      const result = await service.getFriends(1);

      expect(result).toEqual([]);
    });
  });

  describe('getIncomingRequests', () => {
    it('should return incoming pending requests', async () => {
      const requests = [
        {
          id: 1,
          userId: 2,
          friendId: 1,
          statusId: PENDING_ID,
          createdAt: new Date('2025-01-01'),
          user: { id: 2, fullName: 'Sender', nickname: 'sender', email: 'sender@test.com' },
        },
      ];
      friendRepo.find.mockResolvedValue(requests);

      const result = await service.getIncomingRequests(1);

      expect(result).toEqual([
        {
          id: 1,
          userId: 2,
          fullName: 'Sender',
          nickname: 'sender',
          email: 'sender@test.com',
          createdAt: new Date('2025-01-01'),
        },
      ]);
    });
  });

  describe('getOutgoingRequests', () => {
    it('should return outgoing pending requests', async () => {
      const requests = [
        {
          id: 1,
          userId: 1,
          friendId: 3,
          statusId: PENDING_ID,
          createdAt: new Date('2025-01-01'),
          friend: { id: 3, fullName: 'Target', nickname: 'target', email: 'target@test.com' },
        },
      ];
      friendRepo.find.mockResolvedValue(requests);

      const result = await service.getOutgoingRequests(1);

      expect(result).toEqual([
        {
          id: 1,
          friendId: 3,
          fullName: 'Target',
          nickname: 'target',
          email: 'target@test.com',
          createdAt: new Date('2025-01-01'),
        },
      ]);
    });
  });

  describe('isFriend', () => {
    it('should return true when friendship exists', async () => {
      friendRepo.findOne.mockResolvedValue({ id: 1 });

      const result = await service.isFriend(1, 2);

      expect(result).toBe(true);
    });

    it('should return false when friendship does not exist', async () => {
      friendRepo.findOne.mockResolvedValue(null);

      const result = await service.isFriend(1, 2);

      expect(result).toBe(false);
    });
  });

  describe('getFriendIds', () => {
    it('should return array of friend user IDs', async () => {
      const friendships = [
        { userId: 1, friendId: 2, statusId: ACCEPTED_ID },
        { userId: 3, friendId: 1, statusId: ACCEPTED_ID },
      ];
      friendRepo.find.mockResolvedValue(friendships);

      const result = await service.getFriendIds(1);

      expect(result).toEqual([2, 3]);
    });
  });
});
