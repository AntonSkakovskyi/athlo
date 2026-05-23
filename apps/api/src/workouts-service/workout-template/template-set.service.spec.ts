import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TemplateSetService } from './template-set.service';
import { TemplateSetEntity } from '../entities/template-set.entity';
import { TemplateExerciseEntity } from '../entities/template-exercise.entity';
import { WorkoutTemplateEntity } from '../entities/workout-template.entity';

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('TemplateSetService', () => {
  let service: TemplateSetService;
  let templateSetRepo: ReturnType<typeof createMockRepository>;
  let templateExerciseRepo: ReturnType<typeof createMockRepository>;
  let templateRepo: ReturnType<typeof createMockRepository>;

  const setupValidOwnership = (userId = 1) => {
    templateRepo.findOne.mockResolvedValue({ id: 1, creatorId: userId });
    templateExerciseRepo.findOne.mockResolvedValue({ id: 10, workoutTemplateId: 1 });
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateSetService,
        { provide: getRepositoryToken(TemplateSetEntity), useValue: createMockRepository() },
        { provide: getRepositoryToken(TemplateExerciseEntity), useValue: createMockRepository() },
        { provide: getRepositoryToken(WorkoutTemplateEntity), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<TemplateSetService>(TemplateSetService);
    templateSetRepo = module.get(getRepositoryToken(TemplateSetEntity));
    templateExerciseRepo = module.get(getRepositoryToken(TemplateExerciseEntity));
    templateRepo = module.get(getRepositoryToken(WorkoutTemplateEntity));
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ───────────────────────────────────────

  describe('create', () => {
    it('should create set when ownership chain is valid', async () => {
      setupValidOwnership();
      const dto = { order: 1, weight: 100, reps: 5 };
      const saved = { id: 50, templateExerciseId: 10, ...dto };
      templateSetRepo.create.mockReturnValue(saved);
      templateSetRepo.save.mockResolvedValue(saved);

      const result = await service.create(1, 10, 1, dto as any);

      expect(templateSetRepo.save).toHaveBeenCalled();
      expect(result).toEqual(saved);
    });

    it('should throw NotFoundException when template not found', async () => {
      templateRepo.findOne.mockResolvedValue(null);

      await expect(service.create(999, 10, 1, {} as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the template', async () => {
      templateRepo.findOne.mockResolvedValue({ id: 1, creatorId: 2 });

      await expect(service.create(1, 10, 1, {} as any)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when template exercise not found in template', async () => {
      templateRepo.findOne.mockResolvedValue({ id: 1, creatorId: 1 });
      templateExerciseRepo.findOne.mockResolvedValue(null);

      await expect(service.create(1, 99, 1, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ───────────────────────────────────────

  describe('update', () => {
    it('should update set when ownership chain is valid', async () => {
      setupValidOwnership();
      const set = { id: 50, templateExerciseId: 10, reps: 5 };
      templateSetRepo.findOne.mockResolvedValue(set);
      templateSetRepo.save.mockResolvedValue({ ...set, reps: 10 });

      const result = await service.update(50, 1, 10, 1, { reps: 10 } as any);

      expect(result.reps).toBe(10);
    });

    it('should throw NotFoundException when set not found', async () => {
      setupValidOwnership();
      templateSetRepo.findOne.mockResolvedValue(null);

      await expect(service.update(99, 1, 10, 1, {} as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the template', async () => {
      templateRepo.findOne.mockResolvedValue({ id: 1, creatorId: 2 });

      await expect(service.update(50, 1, 10, 1, {} as any)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── remove ───────────────────────────────────────

  describe('remove', () => {
    it('should remove set when ownership chain is valid', async () => {
      setupValidOwnership();
      const set = { id: 50, templateExerciseId: 10 };
      templateSetRepo.findOne.mockResolvedValue(set);
      templateSetRepo.remove.mockResolvedValue(set);

      await service.remove(50, 1, 10, 1);

      expect(templateSetRepo.remove).toHaveBeenCalledWith(set);
    });

    it('should throw NotFoundException when set not found', async () => {
      setupValidOwnership();
      templateSetRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(99, 1, 10, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the template', async () => {
      templateRepo.findOne.mockResolvedValue({ id: 1, creatorId: 2 });

      await expect(service.remove(50, 1, 10, 1)).rejects.toThrow(ForbiddenException);
    });
  });
});
