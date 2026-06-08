import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateSetEntity } from '../entities/template-set.entity';
import { TemplateExerciseEntity } from '../entities/template-exercise.entity';
import { WorkoutTemplateEntity } from '../entities/workout-template.entity';
import { CreateTemplateSetDto } from '../dto/template-set/create-template-set.dto';
import { UpdateTemplateSetDto } from '../dto/template-set/update-template-set.dto';

@Injectable()
export class TemplateSetService {
  constructor(
    @InjectRepository(TemplateSetEntity)
    private readonly templateSetRepository: Repository<TemplateSetEntity>,
    @InjectRepository(TemplateExerciseEntity)
    private readonly templateExerciseRepository: Repository<TemplateExerciseEntity>,
    @InjectRepository(WorkoutTemplateEntity)
    private readonly templateRepository: Repository<WorkoutTemplateEntity>,
  ) {}

  private async validateOwnership(
    templateId: number,
    templateExerciseId: number,
    userId: number,
  ) {
    const template = await this.templateRepository.findOne({
      where: { id: templateId },
    });
    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }
    if (template.creatorId !== userId) {
      throw new ForbiddenException('You can only edit your own templates');
    }

    const exercise = await this.templateExerciseRepository.findOne({
      where: { id: templateExerciseId, workoutTemplateId: templateId },
    });
    if (!exercise) {
      throw new NotFoundException(
        `Template exercise with ID ${templateExerciseId} not found in template ${templateId}`,
      );
    }

    return exercise;
  }

  async create(
    templateId: number,
    templateExerciseId: number,
    userId: number,
    dto: CreateTemplateSetDto,
  ) {
    await this.validateOwnership(templateId, templateExerciseId, userId);

    const set = this.templateSetRepository.create({
      templateExerciseId,
      ...dto,
    });

    return this.templateSetRepository.save(set);
  }

  async update(
    id: number,
    templateId: number,
    templateExerciseId: number,
    userId: number,
    dto: UpdateTemplateSetDto,
  ) {
    await this.validateOwnership(templateId, templateExerciseId, userId);

    const set = await this.templateSetRepository.findOne({
      where: { id, templateExerciseId },
    });

    if (!set) {
      throw new NotFoundException(`Template set with ID ${id} not found`);
    }

    Object.assign(set, dto);
    return this.templateSetRepository.save(set);
  }

  async remove(
    id: number,
    templateId: number,
    templateExerciseId: number,
    userId: number,
  ) {
    await this.validateOwnership(templateId, templateExerciseId, userId);

    const set = await this.templateSetRepository.findOne({
      where: { id, templateExerciseId },
    });

    if (!set) {
      throw new NotFoundException(`Template set with ID ${id} not found`);
    }

    await this.templateSetRepository.remove(set);
  }
}
