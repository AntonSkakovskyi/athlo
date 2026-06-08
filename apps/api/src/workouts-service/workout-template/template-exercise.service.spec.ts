import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TemplateExerciseService } from './template-exercise.service';
import { TemplateExerciseEntity } from '../entities/template-exercise.entity';
import { WorkoutTemplateEntity } from '../entities/workout-template.entity';

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('TemplateExerciseService', () => {
  let service: TemplateExerciseService;
  let templateExerciseRepo: ReturnType<typeof createMockRepository>;
  let templateRepo: ReturnType<typeof createMockRepository>;

  const setupValidOwnership = (userId = 1) => {
    templateRepo.findOne.mockResolvedValue({ id: 1, creatorId: userId });
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateExerciseService,
        {
          provide: getRepositoryToken(TemplateExerciseEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(WorkoutTemplateEntity),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<TemplateExerciseService>(TemplateExerciseService);
    templateExerciseRepo = module.get(
      getRepositoryToken(TemplateExerciseEntity),
    );
    templateRepo = module.get(getRepositoryToken(WorkoutTemplateEntity));
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ───────────────────────────────────────

  describe('create', () => {
    it('should create exercise when user owns the template', async () => {
      setupValidOwnership();
      const dto = { exerciseId: 5, order: 1 };
      const saved = { id: 20, workoutTemplateId: 1, ...dto };
      templateExerciseRepo.create.mockReturnValue(saved);
      templateExerciseRepo.save.mockResolvedValue(saved);

      const result = await service.create(1, 1, dto as any);

      expect(templateExerciseRepo.save).toHaveBeenCalled();
      expect(result).toEqual(saved);
    });

    it('should throw NotFoundException when template not found', async () => {
      templateRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(999, 1, { exerciseId: 5, order: 1 } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the template', async () => {
      templateRepo.findOne.mockResolvedValue({ id: 1, creatorId: 2 });

      await expect(
        service.create(1, 1, { exerciseId: 5, order: 1 } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── update ───────────────────────────────────────

  describe('update', () => {
    it('should update exercise when user owns the template', async () => {
      setupValidOwnership();
      const exercise = { id: 20, workoutTemplateId: 1, order: 1 };
      templateExerciseRepo.findOne.mockResolvedValue(exercise);
      templateExerciseRepo.save.mockResolvedValue({ ...exercise, order: 2 });

      const result = await service.update(20, 1, 1, { order: 2 });

      expect(result.order).toBe(2);
    });

    it('should throw NotFoundException when exercise not found in template', async () => {
      setupValidOwnership();
      templateExerciseRepo.findOne.mockResolvedValue(null);

      await expect(service.update(99, 1, 1, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user does not own the template', async () => {
      templateRepo.findOne.mockResolvedValue({ id: 1, creatorId: 2 });

      await expect(service.update(20, 1, 1, {})).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── remove ───────────────────────────────────────

  describe('remove', () => {
    it('should remove exercise when user owns the template', async () => {
      setupValidOwnership();
      const exercise = { id: 20, workoutTemplateId: 1 };
      templateExerciseRepo.findOne.mockResolvedValue(exercise);
      templateExerciseRepo.remove.mockResolvedValue(exercise);

      await service.remove(20, 1, 1);

      expect(templateExerciseRepo.remove).toHaveBeenCalledWith(exercise);
    });

    it('should throw NotFoundException when exercise not found', async () => {
      setupValidOwnership();
      templateExerciseRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(99, 1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the template', async () => {
      templateRepo.findOne.mockResolvedValue({ id: 1, creatorId: 2 });

      await expect(service.remove(20, 1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
