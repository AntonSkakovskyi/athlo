import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateExerciseEntity } from '../entities/template-exercise.entity';
import { WorkoutTemplateEntity } from '../entities/workout-template.entity';
import { CreateTemplateExerciseDto } from '../dto/template-exercise/create-template-exercise.dto';
import { UpdateTemplateExerciseDto } from '../dto/template-exercise/update-template-exercise.dto';

@Injectable()
export class TemplateExerciseService {
  constructor(
    @InjectRepository(TemplateExerciseEntity)
    private readonly templateExerciseRepository: Repository<TemplateExerciseEntity>,
    @InjectRepository(WorkoutTemplateEntity)
    private readonly templateRepository: Repository<WorkoutTemplateEntity>,
  ) {}

  private async validateTemplateOwnership(templateId: number, userId: number) {
    const template = await this.templateRepository.findOne({ where: { id: templateId } });
    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }
    if (template.creatorId !== userId) {
      throw new ForbiddenException('You can only edit your own templates');
    }
    return template;
  }

  async create(templateId: number, userId: number, dto: CreateTemplateExerciseDto) {
    await this.validateTemplateOwnership(templateId, userId);

    const exercise = this.templateExerciseRepository.create({
      workoutTemplateId: templateId,
      exerciseId: dto.exerciseId,
      order: dto.order,
      restTime: dto.restTime ?? 60,
    });

    return this.templateExerciseRepository.save(exercise);
  }

  async update(id: number, templateId: number, userId: number, dto: UpdateTemplateExerciseDto) {
    await this.validateTemplateOwnership(templateId, userId);

    const exercise = await this.templateExerciseRepository.findOne({
      where: { id, workoutTemplateId: templateId },
    });

    if (!exercise) {
      throw new NotFoundException(`Template exercise with ID ${id} not found in template ${templateId}`);
    }

    Object.assign(exercise, dto);
    return this.templateExerciseRepository.save(exercise);
  }

  async remove(id: number, templateId: number, userId: number) {
    await this.validateTemplateOwnership(templateId, userId);

    const exercise = await this.templateExerciseRepository.findOne({
      where: { id, workoutTemplateId: templateId },
    });

    if (!exercise) {
      throw new NotFoundException(`Template exercise with ID ${id} not found in template ${templateId}`);
    }

    await this.templateExerciseRepository.remove(exercise);
  }
}
