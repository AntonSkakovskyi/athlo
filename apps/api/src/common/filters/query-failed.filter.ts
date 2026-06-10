import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Response } from 'express';

// Коди помилок PostgreSQL: https://www.postgresql.org/docs/current/errcodes-appendix.html
const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';
const CHECK_VIOLATION = '23514';

/**
 * Мапить помилки констрейнтів БД на зрозумілі HTTP-відповіді,
 * щоб порушення UNIQUE/FK/CHECK не вилітали клієнту як 500.
 * Констрейнти БД — джерело правди; передперевірки в сервісах
 * потрібні лише для дружніх повідомлень.
 */
@Catch(QueryFailedError)
export class QueryFailedFilter implements ExceptionFilter {
  private readonly logger = new Logger(QueryFailedFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const code = (exception.driverError as { code?: string })?.code;

    switch (code) {
      case UNIQUE_VIOLATION:
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: 'Resource already exists',
          error: 'Conflict',
        });
      case FOREIGN_KEY_VIOLATION:
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Related resource does not exist or is still in use',
          error: 'Bad Request',
        });
      case CHECK_VIOLATION:
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Value violates a data constraint',
          error: 'Bad Request',
        });
      default:
        this.logger.error(
          `Unhandled database error (${code ?? 'no code'}): ${exception.message}`,
          exception.stack,
        );
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          error: 'Internal Server Error',
        });
    }
  }
}
