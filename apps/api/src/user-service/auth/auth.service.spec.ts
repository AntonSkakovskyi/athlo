import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
import * as bcrypt from 'bcrypt';
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserService: jest.Mocked<Partial<UserService>>;
  let mockJwtService: jest.Mocked<Partial<JwtService>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    mockUserService = module.get(UserService);
    mockJwtService = module.get(JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should register a new user and return user with token', async () => {
      // Arrange
      const registerDto = { email: 'test@test.com', password: '123456', fullName: 'Test', nickname: 'tester' };
      const createdUser = { id: 1, email: 'test@test.com', fullName: 'Test', nickname: 'tester' };
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(createdUser as any);
      mockJwtService.sign.mockReturnValue('jwt-token');

      // Act
      const result = await authService.register(registerDto);

      // Assert
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(mockUserService.create).toHaveBeenCalledWith(registerDto);
      expect(result.user).toEqual(createdUser);
      expect(result.token).toBe('jwt-token');
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      const registerDto = { email: 'existing@test.com', password: '123456', fullName: 'Test', nickname: 'tester' };
      mockUserService.findByEmail.mockResolvedValue({ id: 1, email: 'existing@test.com' } as any);

      // Act & Assert
      await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return user without password_hash and token on valid credentials', async () => {
      // Arrange
      const loginDto = { email: 'user@test.com', password: '123456' };
      const user = { id: 1, email: 'user@test.com', fullName: 'Test', nickname: 'tester', password_hash: 'hashed' };
      mockUserService.findByEmail.mockResolvedValue(user as any);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('jwt-token');

      // Act
      const result = await authService.login(loginDto);

      // Assert
      expect(result.user).not.toHaveProperty('password_hash');
      expect(result.token).toBe('jwt-token');
      expect(result.user.email).toBe('user@test.com');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      // Arrange
      const loginDto = { email: 'noone@test.com', password: '123456' };
      mockUserService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      const loginDto = { email: 'user@test.com', password: 'wrong' };
      const user = { id: 1, email: 'user@test.com', password_hash: 'hashed' };
      mockUserService.findByEmail.mockResolvedValue(user as any);
      mockBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
