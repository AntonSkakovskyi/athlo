import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
import { DataSource } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UserSettingEntity } from './entities/user-setting.entity';

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const makeQb = (result: any = null) => ({
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getOne: jest.fn().mockResolvedValue(result),
});

const mockEntityManager = {
  save: jest.fn((arg: any) => Promise.resolve(arg)),
  delete: jest.fn(),
};

const mockDataSource = {
  transaction: jest.fn((cb: any) => cb(mockEntityManager)),
};

describe('UserService', () => {
  let service: UserService;
  let userRepo: ReturnType<typeof createMockRepository>;
  let settingRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(UserSettingEntity),
          useValue: createMockRepository(),
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepo = module.get(getRepositoryToken(UserEntity));
    settingRepo = module.get(getRepositoryToken(UserSettingEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should hash password and create a new user', async () => {
      // Arrange
      const dto = {
        email: 'test@test.com',
        password: '123456',
        fullName: 'Test',
        nickname: 'tester',
      };
      const hashedPassword = 'hashed_password';
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      const createdUser = {
        id: 1,
        email: dto.email,
        fullName: dto.fullName,
        nickname: dto.nickname,
        password_hash: hashedPassword,
      };
      userRepo.create.mockReturnValue(createdUser);
      userRepo.save.mockResolvedValue(createdUser);

      // Act
      const result = await service.create(dto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
      expect(userRepo.create).toHaveBeenCalledWith({
        email: dto.email,
        fullName: dto.fullName,
        nickname: dto.nickname,
        password_hash: hashedPassword,
      });
      expect(userRepo.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(createdUser);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      // Arrange
      const users = [{ id: 1, email: 'a@b.com' }];
      userRepo.find.mockResolvedValue(users);

      // Act
      const result = await service.findAll();

      // Assert
      expect(userRepo.find).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      // Arrange
      const user = { id: 1, email: 'a@b.com' };
      userRepo.findOne.mockResolvedValue(user);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['settings'],
      });
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      userRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email (case-insensitive)', async () => {
      // Arrange
      const user = { id: 1, email: 'test@test.com' };
      userRepo.createQueryBuilder.mockReturnValue(makeQb(user));

      // Act
      const result = await service.findByEmail('test@test.com');

      // Assert
      expect(userRepo.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(result).toEqual(user);
    });

    it('should return null when user is not found by email', async () => {
      // Arrange
      userRepo.createQueryBuilder.mockReturnValue(makeQb(null));

      // Act
      const result = await service.findByEmail('noone@test.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password_hash', async () => {
      // Arrange
      const user = {
        id: 1,
        email: 'a@b.com',
        fullName: 'Test',
        nickname: 'tester',
        password_hash: 'secret',
      };
      userRepo.findOne.mockResolvedValue(user);

      // Act
      const result = await service.getProfile(1);

      // Assert
      expect(result).not.toHaveProperty('password_hash');
      expect(result).toHaveProperty('email', 'a@b.com');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      userRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPublicProfile', () => {
    it('should request only whitelisted public fields', async () => {
      // Arrange
      const publicUser = {
        id: 2,
        fullName: 'Other User',
        nickname: 'other',
        avatar: null,
      };
      userRepo.findOne.mockResolvedValue(publicUser);

      // Act
      const result = await service.getPublicProfile(2);

      // Assert
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 2 },
        select: { id: true, fullName: true, nickname: true, avatar: true },
      });
      expect(result).toEqual(publicUser);
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('weight');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      userRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getPublicProfile(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields and return without password_hash', async () => {
      // Arrange
      const user = {
        id: 1,
        email: 'a@b.com',
        fullName: 'Old',
        nickname: 'old',
        password_hash: 'secret',
      };
      const existingSettings = {
        id: 1,
        userId: 1,
        waterGoal: 2000,
        proteinGoal: null,
        fatGoal: null,
        carbGoal: null,
      };
      userRepo.findOne.mockResolvedValue(user);
      settingRepo.findOne.mockResolvedValue(existingSettings);

      // Act
      const result = await service.updateProfile(1, { fullName: 'New Name' });

      // Assert
      expect(mockEntityManager.save).toHaveBeenCalledWith(existingSettings);
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ fullName: 'New Name' }),
      );
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should create settings when none exist and apply explicit goals', async () => {
      // Arrange
      const user = {
        id: 1,
        email: 'a@b.com',
        fullName: 'Test',
        nickname: 'tester',
        password_hash: 'secret',
      };
      const newSettings = { userId: 1 };
      userRepo.findOne.mockResolvedValue(user);
      settingRepo.findOne.mockResolvedValue(null);
      settingRepo.create.mockReturnValue(newSettings);

      // Act
      const result = await service.updateProfile(1, { waterGoal: 2500 });

      // Assert
      expect(settingRepo.create).toHaveBeenCalledWith({ userId: 1 });
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1, waterGoal: 2500 }),
      );
      // Явні цілі скидають майбутні daily_goals у тій самій транзакції
      expect(mockEntityManager.delete).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password_hash');
    });
  });

  describe('delete', () => {
    it('should remove user and return true', async () => {
      // Arrange
      const user = { id: 1, email: 'a@b.com' };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.remove.mockResolvedValue(user);

      // Act
      const result = await service.delete(1);

      // Assert
      expect(userRepo.remove).toHaveBeenCalledWith(user);
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      userRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });
});
