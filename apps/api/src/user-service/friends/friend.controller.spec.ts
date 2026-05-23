import { Test, TestingModule } from '@nestjs/testing';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';

describe('FriendController', () => {
  let controller: FriendController;
  let service: jest.Mocked<FriendService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendController],
      providers: [
        {
          provide: FriendService,
          useValue: {
            sendRequest: jest.fn(),
            acceptRequest: jest.fn(),
            rejectRequest: jest.fn(),
            cancelRequest: jest.fn(),
            getFriends: jest.fn(),
            getIncomingRequests: jest.fn(),
            getOutgoingRequests: jest.fn(),
            removeFriend: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FriendController>(FriendController);
    service = module.get(FriendService) as jest.Mocked<FriendService>;
  });

  afterEach(() => jest.clearAllMocks());

  describe('sendRequest', () => {
    it('should call friendService.sendRequest with userId and friendId', async () => {
      // Arrange
      const userId = 1;
      const dto = { friendId: 2 };
      const expected = { message: 'Friend request sent successfully' };
      service.sendRequest.mockResolvedValue(expected);

      // Act
      const result = await controller.sendRequest(userId, dto);

      // Assert
      expect(service.sendRequest).toHaveBeenCalledWith(userId, dto.friendId);
      expect(result).toEqual(expected);
    });
  });

  describe('acceptRequest', () => {
    it('should call friendService.acceptRequest with userId and requestId', async () => {
      // Arrange
      const userId = 1;
      const requestId = 5;
      const expected = { message: 'Friend request accepted' };
      service.acceptRequest.mockResolvedValue(expected);

      // Act
      const result = await controller.acceptRequest(userId, requestId);

      // Assert
      expect(service.acceptRequest).toHaveBeenCalledWith(userId, requestId);
      expect(result).toEqual(expected);
    });
  });

  describe('rejectRequest', () => {
    it('should call friendService.rejectRequest with userId and requestId', async () => {
      // Arrange
      const userId = 1;
      const requestId = 5;
      const expected = { message: 'Friend request rejected' };
      service.rejectRequest.mockResolvedValue(expected);

      // Act
      const result = await controller.rejectRequest(userId, requestId);

      // Assert
      expect(service.rejectRequest).toHaveBeenCalledWith(userId, requestId);
      expect(result).toEqual(expected);
    });
  });

  describe('cancelRequest', () => {
    it('should call friendService.cancelRequest with userId and requestId', async () => {
      // Arrange
      const userId = 1;
      const requestId = 5;
      const expected = { message: 'Friend request cancelled' };
      service.cancelRequest.mockResolvedValue(expected);

      // Act
      const result = await controller.cancelRequest(userId, requestId);

      // Assert
      expect(service.cancelRequest).toHaveBeenCalledWith(userId, requestId);
      expect(result).toEqual(expected);
    });
  });

  describe('getFriends', () => {
    it('should call friendService.getFriends with userId', async () => {
      // Arrange
      const userId = 1;
      const expected = [{ id: 2, fullName: 'Friend' }];
      service.getFriends.mockResolvedValue(expected as any);

      // Act
      const result = await controller.getFriends(userId);

      // Assert
      expect(service.getFriends).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expected);
    });
  });

  describe('getIncomingRequests', () => {
    it('should call friendService.getIncomingRequests with userId', async () => {
      // Arrange
      const userId = 1;
      const expected = [{ id: 1, userId: 2, fullName: 'Sender' }];
      service.getIncomingRequests.mockResolvedValue(expected as any);

      // Act
      const result = await controller.getIncomingRequests(userId);

      // Assert
      expect(service.getIncomingRequests).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expected);
    });
  });

  describe('getOutgoingRequests', () => {
    it('should call friendService.getOutgoingRequests with userId', async () => {
      // Arrange
      const userId = 1;
      const expected = [{ id: 1, friendId: 3, fullName: 'Target' }];
      service.getOutgoingRequests.mockResolvedValue(expected as any);

      // Act
      const result = await controller.getOutgoingRequests(userId);

      // Assert
      expect(service.getOutgoingRequests).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expected);
    });
  });

  describe('removeFriend', () => {
    it('should call friendService.removeFriend with userId and friendId', async () => {
      // Arrange
      const userId = 1;
      const friendId = 2;
      const expected = { message: 'Friend removed successfully' };
      service.removeFriend.mockResolvedValue(expected);

      // Act
      const result = await controller.removeFriend(userId, friendId);

      // Assert
      expect(service.removeFriend).toHaveBeenCalledWith(userId, friendId);
      expect(result).toEqual(expected);
    });
  });
});
