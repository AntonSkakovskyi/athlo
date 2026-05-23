import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MealTypeService } from './meal-type.service';
import { MealTypeEntity } from '../entities/meal-type.entity';

describe('MealTypeService', () => {
  let service: MealTypeService;
  let mealTypeRepo: { find: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealTypeService,
        { provide: getRepositoryToken(MealTypeEntity), useValue: { find: jest.fn() } },
      ],
    }).compile();

    service = module.get<MealTypeService>(MealTypeService);
    mealTypeRepo = module.get(getRepositoryToken(MealTypeEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return meal types ordered by id', async () => {
      const types = [{ id: 1, name: 'Breakfast' }, { id: 2, name: 'Lunch' }];
      mealTypeRepo.find.mockResolvedValue(types);

      const result = await service.findAll();

      expect(mealTypeRepo.find).toHaveBeenCalledWith({ order: { id: 'ASC' } });
      expect(result).toEqual(types);
    });

    it('should return empty array when no meal types exist', async () => {
      mealTypeRepo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });
});
