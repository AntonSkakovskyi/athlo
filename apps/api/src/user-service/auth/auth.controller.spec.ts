import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<Partial<AuthService>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should call authService.register with registerDto', async () => {
      // Arrange
      const registerDto = { email: 'test@test.com', password: '123456', fullName: 'Test', nickname: 'tester' };
      const expected = { user: { id: 1, email: 'test@test.com' }, token: 'jwt-token' };
      service.register.mockResolvedValue(expected as any);

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('should call authService.login with loginDto', async () => {
      // Arrange
      const loginDto = { email: 'test@test.com', password: '123456' };
      const expected = { user: { id: 1, email: 'test@test.com' }, token: 'jwt-token' };
      service.login.mockResolvedValue(expected as any);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expected);
    });
  });
});
