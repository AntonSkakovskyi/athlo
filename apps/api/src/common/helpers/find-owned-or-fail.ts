import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  FindOptionsRelations,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';

interface FindOwnedOptions<T> {
  where: FindOptionsWhere<T>;
  userId: number;
  // Поле-власник у сутності; за замовчуванням 'userId'.
  ownerField?: keyof T;
  relations?: FindOptionsRelations<T>;
  notFoundMessage?: string;
  forbiddenMessage?: string;
}

// Уніфікує повторюваний патерн «знайти → 404 якщо нема → 403 якщо чужий → повернути».
// Кидає NotFoundException/ForbiddenException, інакше повертає сутність.
export async function findOwnedOrFail<T extends ObjectLiteral>(
  repo: Repository<T>,
  options: FindOwnedOptions<T>,
): Promise<T> {
  const {
    where,
    userId,
    ownerField = 'userId' as keyof T,
    relations,
    notFoundMessage = 'Resource not found',
    forbiddenMessage = 'You do not have access to this resource',
  } = options;

  const entity = await repo.findOne({ where, relations });
  if (!entity) {
    throw new NotFoundException(notFoundMessage);
  }
  if (entity[ownerField] !== userId) {
    throw new ForbiddenException(forbiddenMessage);
  }
  return entity;
}
