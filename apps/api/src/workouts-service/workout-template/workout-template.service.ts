import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { findOwnedOrFail } from '../../common/helpers/find-owned-or-fail';
import { WorkoutTemplateEntity } from '../entities/workout-template.entity';
import { UserWorkoutTemplateEntity } from '../entities/saved-template.entity';
import { WorkoutEntity } from '../entities/workout.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { LogSetEntity } from '../entities/log-set.entity';
import { TemplateExerciseEntity } from '../entities/template-exercise.entity';
import { TemplateSetEntity } from '../entities/template-set.entity';
import { CreateWorkoutTemplateDto } from '../dto/workout-template/create-workout-template.dto';
import { UpdateWorkoutTemplateDto } from '../dto/workout-template/update-workout-template.dto';
import { VisibilityType, WorkoutStatus } from '@athlo/shared';
import { FriendService } from '../../user-service/friends/friend.service';

@Injectable()
export class WorkoutTemplateService {
  constructor(
    @InjectRepository(WorkoutTemplateEntity)
    private readonly templateRepository: Repository<WorkoutTemplateEntity>,
    @InjectRepository(UserWorkoutTemplateEntity)
    private readonly userTemplateRepository: Repository<UserWorkoutTemplateEntity>,
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepository: Repository<WorkoutEntity>,
    @InjectRepository(LogExerciseEntity)
    private readonly logExerciseRepository: Repository<LogExerciseEntity>,
    @InjectRepository(LogSetEntity)
    private readonly logSetRepository: Repository<LogSetEntity>,
    @InjectRepository(TemplateExerciseEntity)
    private readonly templateExerciseRepository: Repository<TemplateExerciseEntity>,
    @InjectRepository(TemplateSetEntity)
    private readonly templateSetRepository: Repository<TemplateSetEntity>,
    private readonly friendService: FriendService,
  ) {}

  async create(creatorId: number, dto: CreateWorkoutTemplateDto) {
    const template = this.templateRepository.create({
      creatorId,
      name: dto.name,
      description: dto.description,
      visibilityTypeId: dto.visibilityTypeId ?? 1,
    });

    const saved = await this.templateRepository.save(template);
    return this.findOne(saved.id, creatorId);
  }

  async findMyTemplates(creatorId: number) {
    return this.templateRepository.find({
      where: { creatorId },
      relations: { templateExercises: { exercise: true, templateSets: true } },
      order: {
        templateExercises: { order: 'ASC', templateSets: { order: 'ASC' } },
      },
    });
  }

  async findTemplatesForUser(currentUserId: number, targetUserId: number) {
    const isFriend = await this.friendService.isFriend(
      currentUserId,
      targetUserId,
    );
    const publicVisibilityId = this.getVisibilityId(VisibilityType.PUBLIC);
    const friendsOnlyVisibilityId = this.getVisibilityId(
      VisibilityType.FRIENDS_ONLY,
    );

    const visibilityIds = [publicVisibilityId];
    if (isFriend) {
      visibilityIds.push(friendsOnlyVisibilityId);
    }

    return this.templateRepository.find({
      where: {
        creatorId: targetUserId,
        visibilityTypeId: In(visibilityIds),
      },
      relations: { templateExercises: { exercise: true, templateSets: true } },
      order: {
        id: 'DESC',
        templateExercises: { order: 'ASC', templateSets: { order: 'ASC' } },
      },
    });
  }

  async findPublicTemplates(
    userId: number,
    page = 1,
    limit = 10,
    search?: string,
  ) {
    const publicVisibilityId = this.getVisibilityId(VisibilityType.PUBLIC);
    const friendsOnlyVisibilityId = this.getVisibilityId(
      VisibilityType.FRIENDS_ONLY,
    );
    const friendIds = await this.friendService.getFriendIds(userId);

    const qb = this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.templateExercises', 'te')
      .leftJoinAndSelect('te.exercise', 'exercise')
      .leftJoinAndSelect('te.templateSets', 'ts')
      .leftJoinAndSelect('template.creator', 'creator')
      .where(
        '(template.creator_id != :userId OR template.creator_id IS NULL)',
        { userId },
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where('template.visibility_type_id = :publicId', {
            publicId: publicVisibilityId,
          });
          if (friendIds.length > 0) {
            qb.orWhere(
              '(template.visibility_type_id = :friendsId AND template.creator_id IN (:...friendIds))',
              { friendsId: friendsOnlyVisibilityId, friendIds },
            );
          }
        }),
      );

    if (search) {
      qb.andWhere('template.name ILIKE :search', { search: `%${search}%` });
    }

    qb.orderBy('template.id', 'DESC')
      .addOrderBy('te.order', 'ASC')
      .addOrderBy('ts.order', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [templates, total] = await qb.getManyAndCount();

    return {
      data: templates.map((t) => {
        const { creator, ...rest } = t;
        return { ...rest, creatorNickname: creator?.nickname };
      }),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findFriendsTemplates(userId: number) {
    const friendIds = await this.friendService.getFriendIds(userId);
    if (friendIds.length === 0) return [];

    const publicVisibilityId = this.getVisibilityId(VisibilityType.PUBLIC);
    const friendsOnlyVisibilityId = this.getVisibilityId(
      VisibilityType.FRIENDS_ONLY,
    );

    const templates = await this.templateRepository.find({
      where: [
        {
          creatorId: In(friendIds),
          visibilityTypeId: publicVisibilityId,
        },
        {
          creatorId: In(friendIds),
          visibilityTypeId: friendsOnlyVisibilityId,
        },
      ],
      relations: {
        creator: true,
        templateExercises: { exercise: true, templateSets: true },
      },
      order: {
        id: 'DESC',
        templateExercises: { order: 'ASC', templateSets: { order: 'ASC' } },
      },
    });

    return templates.map((t) => {
      const { creator, ...rest } = t;
      return { ...rest, creatorNickname: creator?.nickname };
    });
  }

  async findOne(id: number, userId: number) {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: {
        templateExercises: { exercise: true, templateSets: true },
        creator: true,
      },
      order: {
        templateExercises: { order: 'ASC', templateSets: { order: 'ASC' } },
      },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    const isOwner = template.creatorId === userId;
    if (!isOwner) {
      const publicVisibilityId = this.getVisibilityId(VisibilityType.PUBLIC);
      const friendsOnlyVisibilityId = this.getVisibilityId(
        VisibilityType.FRIENDS_ONLY,
      );

      if (template.visibilityTypeId === friendsOnlyVisibilityId) {
        const isFriend = await this.friendService.isFriend(
          userId,
          template.creatorId,
        );
        if (!isFriend) {
          throw new ForbiddenException(
            'You do not have access to this template',
          );
        }
      } else if (template.visibilityTypeId !== publicVisibilityId) {
        throw new ForbiddenException('You do not have access to this template');
      }
    }

    return template;
  }

  async update(id: number, userId: number, dto: UpdateWorkoutTemplateDto) {
    const template = await this.findOneOwned(id, userId);
    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  async remove(id: number, userId: number) {
    const template = await this.findOneOwned(id, userId);
    await this.templateRepository.remove(template);
  }

  async saveTemplate(templateId: number, userId: number) {
    const template = await this.findOne(templateId, userId);

    if (template.creatorId === userId) {
      throw new BadRequestException('Cannot save your own template');
    }

    const existing = await this.userTemplateRepository.findOne({
      where: { userId, workoutTemplateId: templateId },
    });

    if (existing) {
      throw new BadRequestException('Template is already saved');
    }

    const saved = this.userTemplateRepository.create({
      userId,
      workoutTemplateId: templateId,
    });
    return this.userTemplateRepository.save(saved);
  }

  async unsaveTemplate(templateId: number, userId: number) {
    const saved = await this.userTemplateRepository.findOne({
      where: { userId, workoutTemplateId: templateId },
    });

    if (!saved) {
      throw new NotFoundException('Saved template not found');
    }

    await this.userTemplateRepository.remove(saved);
  }

  async getSavedTemplates(userId: number) {
    const saved = await this.userTemplateRepository.find({
      where: { userId },
      relations: {
        workoutTemplate: {
          templateExercises: { exercise: true, templateSets: true },
          creator: true,
        },
      },
    });

    return saved.map((s) => ({
      ...s,
      workoutTemplate: {
        ...s.workoutTemplate,
        creatorNickname: s.workoutTemplate.creator?.nickname,
        creator: undefined,
      },
    }));
  }

  async startFromTemplate(templateId: number, userId: number) {
    const template = await this.findOne(templateId, userId);

    const workout = this.workoutRepository.create({
      userId,
      name: template.name,
      description: template.description,
      status: WorkoutStatus.IN_PROGRESS,
    });
    const savedWorkout = await this.workoutRepository.save(workout);

    if (template.templateExercises?.length) {
      for (const te of template.templateExercises) {
        const logExercise = this.logExerciseRepository.create({
          workoutId: savedWorkout.id,
          exerciseId: te.exerciseId,
          order: te.order,
          restTime: te.restTime,
        });
        const savedLogExercise =
          await this.logExerciseRepository.save(logExercise);

        if (te.templateSets?.length) {
          const sets = te.templateSets.map((ts) =>
            this.logSetRepository.create({
              logExerciseId: savedLogExercise.id,
              order: ts.order,
              weight: ts.weight,
              reps: ts.reps,
              duration: ts.duration,
              distance: ts.distance,
              isCompleted: false,
            }),
          );
          await this.logSetRepository.save(sets);
        }
      }
    }

    return this.workoutRepository.findOne({
      where: { id: savedWorkout.id },
      relations: { logExercises: { exercise: true, sets: true } },
      order: { logExercises: { order: 'ASC', sets: { order: 'ASC' } } },
    });
  }

  async createFromWorkout(workoutId: number, userId: number, name: string) {
    const workout = await this.workoutRepository.findOne({
      where: { id: workoutId, userId },
      relations: { logExercises: { sets: true } },
    });

    if (!workout) {
      throw new NotFoundException(`Workout with ID ${workoutId} not found`);
    }

    const template = this.templateRepository.create({
      creatorId: userId,
      name: name || workout.name,
      description: workout.description,
      visibilityTypeId: 1, // Default to private
    });
    const savedTemplate = await this.templateRepository.save(template);

    if (workout.logExercises?.length) {
      for (const ex of workout.logExercises) {
        const templateExercise = this.templateExerciseRepository.create({
          workoutTemplateId: savedTemplate.id,
          exerciseId: ex.exerciseId,
          order: ex.order,
          restTime: ex.restTime,
        });
        const savedTemplateExercise =
          await this.templateExerciseRepository.save(templateExercise);

        if (ex.sets?.length) {
          const templateSets = ex.sets.map((s) =>
            this.templateSetRepository.create({
              templateExerciseId: savedTemplateExercise.id,
              order: s.order,
              weight: s.weight,
              reps: s.reps,
              duration: s.duration,
              distance: s.distance,
            }),
          );
          await this.templateSetRepository.save(templateSets);
        }
      }
    }

    return this.findOne(savedTemplate.id, userId);
  }

  private async findOneOwned(id: number, userId: number) {
    return findOwnedOrFail(this.templateRepository, {
      where: { id },
      userId,
      ownerField: 'creatorId',
      notFoundMessage: `Template with ID ${id} not found`,
      forbiddenMessage: 'You can only edit your own templates',
    });
  }

  private getVisibilityId(type: VisibilityType): number {
    const map: Record<string, number> = {
      [VisibilityType.PRIVATE]: 1,
      [VisibilityType.PUBLIC]: 2,
      [VisibilityType.FRIENDS_ONLY]: 3,
    };
    return map[type] ?? 1;
  }
}
