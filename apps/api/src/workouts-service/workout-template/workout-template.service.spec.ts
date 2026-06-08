import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { WorkoutTemplateService } from './workout-template.service';
import { WorkoutTemplateEntity } from '../entities/workout-template.entity';
import { UserWorkoutTemplateEntity } from '../entities/saved-template.entity';
import { WorkoutEntity } from '../entities/workout.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { LogSetEntity } from '../entities/log-set.entity';
import { TemplateExerciseEntity } from '../entities/template-exercise.entity';
import { TemplateSetEntity } from '../entities/template-set.entity';
import { FriendService } from '../../user-service/friends/friend.service';
import { WorkoutStatus } from '@athlo/shared';

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockFriendService = {
  isFriend: jest.fn(),
  getFriendIds: jest.fn(),
};

describe('WorkoutTemplateService', () => {
  let service: WorkoutTemplateService;
  let templateRepo: ReturnType<typeof createMockRepository>;
  let userTemplateRepo: ReturnType<typeof createMockRepository>;
  let workoutRepo: ReturnType<typeof createMockRepository>;
  let logExerciseRepo: ReturnType<typeof createMockRepository>;
  let logSetRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutTemplateService,
        {
          provide: getRepositoryToken(WorkoutTemplateEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(UserWorkoutTemplateEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(WorkoutEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(LogExerciseEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(LogSetEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(TemplateExerciseEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(TemplateSetEntity),
          useValue: createMockRepository(),
        },
        { provide: FriendService, useValue: mockFriendService },
      ],
    }).compile();

    service = module.get<WorkoutTemplateService>(WorkoutTemplateService);
    templateRepo = module.get(getRepositoryToken(WorkoutTemplateEntity));
    userTemplateRepo = module.get(
      getRepositoryToken(UserWorkoutTemplateEntity),
    );
    workoutRepo = module.get(getRepositoryToken(WorkoutEntity));
    logExerciseRepo = module.get(getRepositoryToken(LogExerciseEntity));
    logSetRepo = module.get(getRepositoryToken(LogSetEntity));
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findOne (visibility rules) ───────────────────

  describe('findOne', () => {
    it('should return template to the owner regardless of visibility', async () => {
      const template = {
        id: 1,
        creatorId: 1,
        visibilityTypeId: 1,
        templateExercises: [],
      };
      templateRepo.findOne.mockResolvedValue(template);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(template);
    });

    it('should return PUBLIC template to any user', async () => {
      const template = {
        id: 1,
        creatorId: 2,
        visibilityTypeId: 2,
        templateExercises: [],
      };
      templateRepo.findOne.mockResolvedValue(template);

      const result = await service.findOne(1, 5);

      expect(result).toEqual(template);
    });

    it('should throw ForbiddenException for PRIVATE template when not owner', async () => {
      templateRepo.findOne.mockResolvedValue({
        id: 1,
        creatorId: 2,
        visibilityTypeId: 1,
      });

      await expect(service.findOne(1, 5)).rejects.toThrow(ForbiddenException);
    });

    it('should return FRIENDS_ONLY template to a friend', async () => {
      const template = {
        id: 1,
        creatorId: 2,
        visibilityTypeId: 3,
        templateExercises: [],
      };
      templateRepo.findOne.mockResolvedValue(template);
      mockFriendService.isFriend.mockResolvedValue(true);

      const result = await service.findOne(1, 5);

      expect(mockFriendService.isFriend).toHaveBeenCalledWith(5, 2);
      expect(result).toEqual(template);
    });

    it('should throw ForbiddenException for FRIENDS_ONLY template when not a friend', async () => {
      templateRepo.findOne.mockResolvedValue({
        id: 1,
        creatorId: 2,
        visibilityTypeId: 3,
      });
      mockFriendService.isFriend.mockResolvedValue(false);

      await expect(service.findOne(1, 5)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when template does not exist', async () => {
      templateRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── startFromTemplate ────────────────────────────

  describe('startFromTemplate', () => {
    it('should create IN_PROGRESS workout with exercises and sets with isCompleted=false', async () => {
      const template = {
        id: 1,
        creatorId: 1,
        visibilityTypeId: 2,
        name: 'Push Day',
        description: 'Chest',
        templateExercises: [
          {
            exerciseId: 10,
            order: 1,
            restTime: 60,
            templateSets: [
              {
                order: 1,
                weight: 100,
                reps: 5,
                duration: null,
                distance: null,
              },
            ],
          },
        ],
      };
      const savedWorkout = { id: 5, userId: 1, name: 'Push Day' };
      const savedLogExercise = { id: 50, workoutId: 5 };

      templateRepo.findOne.mockResolvedValue(template);
      workoutRepo.create.mockReturnValue(savedWorkout);
      workoutRepo.save.mockResolvedValue(savedWorkout);
      workoutRepo.findOne.mockResolvedValue({
        ...savedWorkout,
        logExercises: [],
      });
      logExerciseRepo.create.mockReturnValue({ workoutId: 5, exerciseId: 10 });
      logExerciseRepo.save.mockResolvedValue(savedLogExercise);
      logSetRepo.create.mockImplementation((d) => d);
      logSetRepo.save.mockResolvedValue([]);

      await service.startFromTemplate(1, 1);

      expect(workoutRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: WorkoutStatus.IN_PROGRESS }),
      );
      const setCreated = logSetRepo.create.mock.calls[0][0];
      expect(setCreated.isCompleted).toBe(false);
    });

    it('should create workout without exercises when template has none', async () => {
      const template = {
        id: 1,
        creatorId: 1,
        visibilityTypeId: 2,
        name: 'Empty',
        description: '',
        templateExercises: [],
      };
      const savedWorkout = { id: 5, userId: 1, name: 'Empty' };

      templateRepo.findOne.mockResolvedValue(template);
      workoutRepo.create.mockReturnValue(savedWorkout);
      workoutRepo.save.mockResolvedValue(savedWorkout);
      workoutRepo.findOne.mockResolvedValue({
        ...savedWorkout,
        logExercises: [],
      });

      await service.startFromTemplate(1, 1);

      expect(logExerciseRepo.save).not.toHaveBeenCalled();
      expect(logSetRepo.save).not.toHaveBeenCalled();
    });
  });

  // ─── saveTemplate ─────────────────────────────────

  describe('saveTemplate', () => {
    it('should throw BadRequestException when user tries to save own template', async () => {
      templateRepo.findOne.mockResolvedValue({
        id: 1,
        creatorId: 1,
        visibilityTypeId: 2,
        templateExercises: [],
      });

      await expect(service.saveTemplate(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when template is already saved', async () => {
      templateRepo.findOne.mockResolvedValue({
        id: 1,
        creatorId: 2,
        visibilityTypeId: 2,
        templateExercises: [],
      });
      userTemplateRepo.findOne.mockResolvedValue({
        userId: 1,
        workoutTemplateId: 1,
      });

      await expect(service.saveTemplate(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should save template when all checks pass', async () => {
      const template = {
        id: 1,
        creatorId: 2,
        visibilityTypeId: 2,
        templateExercises: [],
      };
      const saved = { userId: 1, workoutTemplateId: 1 };
      templateRepo.findOne.mockResolvedValue(template);
      userTemplateRepo.findOne.mockResolvedValue(null);
      userTemplateRepo.create.mockReturnValue(saved);
      userTemplateRepo.save.mockResolvedValue(saved);

      const result = await service.saveTemplate(1, 1);

      expect(userTemplateRepo.save).toHaveBeenCalled();
      expect(result).toEqual(saved);
    });
  });
});
