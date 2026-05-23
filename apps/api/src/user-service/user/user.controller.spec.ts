import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let service: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            getProfile: jest.fn(),
            updateProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get(UserService) as jest.Mocked<UserService>;
  });

  afterEach(() => jest.clearAllMocks());

  describe('getProfile', () => {
    it('should call userService.getProfile with userId', async () => {
      // Arrange
      const userId = 1;
      const expected = { id: 1, email: 'a@b.com', fullName: 'Test', nickname: 'tester' };
      service.getProfile.mockResolvedValue(expected as any);

      // Act
      const result = await controller.getProfile(userId);

      // Assert
      expect(service.getProfile).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expected);
    });
  });

  describe('updateProfile', () => {
    it('should call userService.updateProfile with userId and dto', async () => {
      // Arrange
      const userId = 1;
      const dto = { fullName: 'New Name' };
      const expected = { id: 1, email: 'a@b.com', fullName: 'New Name', nickname: 'tester' };
      service.updateProfile.mockResolvedValue(expected as any);

      // Act
      const result = await controller.updateProfile(userId, dto as any);

      // Assert
      expect(service.updateProfile).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual(expected);
    });
  });
});
