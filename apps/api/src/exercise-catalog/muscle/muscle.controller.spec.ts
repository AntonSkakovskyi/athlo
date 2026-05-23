import { Test, TestingModule } from '@nestjs/testing';
import { MuscleController } from './muscle.controller';
import { MuscleService } from './muscle.service';

describe('MuscleController', () => {
  let controller: MuscleController;
  let service: jest.Mocked<MuscleService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MuscleController],
      providers: [
        {
          provide: MuscleService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MuscleController>(MuscleController);
    service = module.get(MuscleService) as jest.Mocked<MuscleService>;
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should call muscleService.findAll and return muscles', async () => {
      // Arrange
      const expected = [{ id: 1, name: 'Biceps', imageUrl: null }];
      service.findAll.mockResolvedValue(expected as any);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });
});
