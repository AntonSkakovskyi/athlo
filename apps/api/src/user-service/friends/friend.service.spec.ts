import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FriendService } from './friend.service';
import { UserFriendEntity } from './entities/user-friend.entity';
import { UserEntity } from '../user/entities/user.entity';
import { FriendRequestStatus } from '@athlo/shared';

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
          provide: getRepositoryToken(UserEntity),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<FriendService>(FriendService);
    friendRepo = module.get(getRepositoryToken(UserFriendEntity));
    userRepo = module.get(getRepositoryToken(UserEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('sendRequest', () => {
    it('should send a friend request successfully', async () => {
      // Arrange
      userRepo.findOne.mockResolvedValue({ id: 2, email: 'friend@test.com' });
      friendRepo.findOne.mockResolvedValue(null);
      friendRepo.create.mockReturnValue({ userId: 1, friendId: 2, status: FriendRequestStatus.PENDING });
      friendRepo.save.mockResolvedValue({});

      // Act
      const result = await service.sendRequest(1, 2);

      // Assert
      expect(result).toEqual({ message: 'Friend request sent successfully' });
      expect(friendRepo.create).toHaveBeenCalledWith({
        userId: 1,
        friendId: 2,
        status: FriendRequestStatus.PENDING,
      });
    });

    it('should throw BadRequestException when sending request to yourself', async () => {
      // Act & Assert
      await expect(service.sendRequest(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when friend user does not exist', async () => {
      // Arrange
      userRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.sendRequest(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when already friends', async () => {
      // Arrange
      userRepo.findOne.mockResolvedValue({ id: 2 });
      friendRepo.findOne.mockResolvedValue({ status: FriendRequestStatus.ACCEPTED });

      // Act & Assert
      await expect(service.sendRequest(1, 2)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when request already exists', async () => {
      // Arrange
      userRepo.findOne.mockResolvedValue({ id: 2 });
      friendRepo.findOne.mockResolvedValue({ status: FriendRequestStatus.PENDING });

      // Act & Assert
      await expect(service.sendRequest(1, 2)).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptRequest', () => {
    it('should accept a pending friend request', async () => {
      // Arrange
      const request = { id: 1, userId: 2, friendId: 1, status: FriendRequestStatus.PENDING };
      friendRepo.findOne.mockResolvedValue(request);
      friendRepo.save.mockResolvedValue({ ...request, status: FriendRequestStatus.ACCEPTED });

      // Act
      const result = await service.acceptRequest(1, 1);

      // Assert
      expect(result).toEqual({ message: 'Friend request accepted' });
      expect(friendRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: FriendRequestStatus.ACCEPTED }),
      );
    });

    it('should throw NotFoundException when request does not exist', async () => {
      // Arrange
      friendRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.acceptRequest(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when request is not sent to the user', async () => {
      // Arrange
      friendRepo.findOne.mockResolvedValue({ id: 1, userId: 3, friendId: 2, status: FriendRequestStatus.PENDING });

      // Act & Assert
      await expect(service.acceptRequest(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when request is not pending', async () => {
      // Arrange
      friendRepo.findOne.mockResolvedValue({ id: 1, userId: 2, friendId: 1, status: FriendRequestStatus.ACCEPTED });

      // Act & Assert
      await expect(service.acceptRequest(1, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectRequest', () => {
    it('should reject a pending friend request', async () => {
      // Arrange
      const request = { id: 1, userId: 2, friendId: 1, status: FriendRequestStatus.PENDING };
      friendRepo.findOne.mockResolvedValue(request);
      friendRepo.remove.mockResolvedValue(request);

      // Act
      const result = await service.rejectRequest(1, 1);

      // Assert
      expect(result).toEqual({ message: 'Friend request rejected' });
      expect(friendRepo.remove).toHaveBeenCalledWith(request);
    });

    it('should throw NotFoundException when request does not exist', async () => {
      // Arrange
      friendRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.rejectRequest(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when request is not sent to the user', async () => {
      // Arrange
      friendRepo.findOne.mockResolvedValue({ id: 1, userId: 3, friendId: 2, status: FriendRequestStatus.PENDING });

      // Act & Assert
      await expect(service.rejectRequest(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when request is not pending', async () => {
      // Arrange
      friendRepo.findOne.mockResolvedValue({ id: 1, userId: 2, friendId: 1, status: FriendRequestStatus.ACCEPTED });

      // Act & Assert
      await expect(service.rejectRequest(1, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelRequest', () => {
    it('should cancel a pending sent request', async () => {
      // Arrange
      const request = { id: 1, userId: 1, friendId: 2, status: FriendRequestStatus.PENDING };
      friendRepo.findOne.mockResolvedValue(request);
      friendRepo.remove.mockResolvedValue(request);

      // Act
      const result = await service.cancelRequest(1, 1);

      // Assert
      expect(result).toEqual({ message: 'Friend request cancelled' });
      expect(friendRepo.remove).toHaveBeenCalledWith(request);
    });

    it('should throw NotFoundException when request does not exist', async () => {
      // Arrange
      friendRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.cancelRequest(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when request was not sent by the user', async () => {
      // Arrange
      friendRepo.findOne.mockResolvedValue({ id: 1, userId: 2, friendId: 1, status: FriendRequestStatus.PENDING });

      // Act & Assert
      await expect(service.cancelRequest(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when request is not pending', async () => {
      // Arrange
      friendRepo.findOne.mockResolvedValue({ id: 1, userId: 1, friendId: 2, status: FriendRequestStatus.ACCEPTED });

      // Act & Assert
      await expect(service.cancelRequest(1, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeFriend', () => {
    it('should remove a friendship and return success message', async () => {
      // Arrange
      const friendship = { id: 1, userId: 1, friendId: 2, status: FriendRequestStatus.ACCEPTED };
      friendRepo.findOne.mockResolvedValue(friendship);
      friendRepo.remove.mockResolvedValue(friendship);

      // Act
      const result = await service.removeFriend(1, 2);

      // Assert
      expect(result).toEqual({ message: 'Friend removed successfully' });
      expect(friendRepo.remove).toHaveBeenCalledWith(friendship);
    });

    it('should throw BadRequestException when trying to remove yourself', async () => {
      // Act & Assert
      await expect(service.removeFriend(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when friendship does not exist', async () => {
      // Arrange
      friendRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.removeFriend(1, 2)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFriends', () => {
    it('should return list of friends with basic info', async () => {
      // Arrange
      const friendships = [
        {
          id: 1,
          userId: 1,
          friendId: 2,
          status: FriendRequestStatus.ACCEPTED,
          user: { id: 1, fullName: 'Me', nickname: 'me', email: 'me@test.com' },
          friend: { id: 2, fullName: 'Friend', nickname: 'friend', email: 'friend@test.com' },
        },
      ];
      friendRepo.find.mockResolvedValue(friendships);

      // Act
      const result = await service.getFriends(1);

      // Assert
      expect(result).toEqual([
        { id: 2, fullName: 'Friend', nickname: 'friend', email: 'friend@test.com' },
      ]);
    });

    it('should return empty array when user has no friends', async () => {
      // Arrange
      friendRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.getFriends(1);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getIncomingRequests', () => {
    it('should return incoming pending requests', async () => {
      // Arrange
      const requests = [
        {
          id: 1,
          userId: 2,
          friendId: 1,
          status: FriendRequestStatus.PENDING,
          createdAt: new Date('2025-01-01'),
          user: { id: 2, fullName: 'Sender', nickname: 'sender', email: 'sender@test.com' },
        },
      ];
      friendRepo.find.mockResolvedValue(requests);

      // Act
      const result = await service.getIncomingRequests(1);

      // Assert
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
      // Arrange
      const requests = [
        {
          id: 1,
          userId: 1,
          friendId: 3,
          status: FriendRequestStatus.PENDING,
          createdAt: new Date('2025-01-01'),
          friend: { id: 3, fullName: 'Target', nickname: 'target', email: 'target@test.com' },
        },
      ];
      friendRepo.find.mockResolvedValue(requests);

      // Act
      const result = await service.getOutgoingRequests(1);

      // Assert
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
      // Arrange
      friendRepo.findOne.mockResolvedValue({ id: 1 });

      // Act
      const result = await service.isFriend(1, 2);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when friendship does not exist', async () => {
      // Arrange
      friendRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.isFriend(1, 2);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getFriendIds', () => {
    it('should return array of friend user IDs', async () => {
      // Arrange
      const friendships = [
        { userId: 1, friendId: 2, status: FriendRequestStatus.ACCEPTED },
        { userId: 3, friendId: 1, status: FriendRequestStatus.ACCEPTED },
      ];
      friendRepo.find.mockResolvedValue(friendships);

      // Act
      const result = await service.getFriendIds(1);

      // Assert
      expect(result).toEqual([2, 3]);
    });
  });
});
