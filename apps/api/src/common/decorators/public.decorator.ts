import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Позначає маршрут (або весь контролер) як відкритий — глобальний
// JwtAuthGuard пропускає його без перевірки токена.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
