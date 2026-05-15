# NestJS Backend Development Standards

Цей документ визначає стандарти написання коду для бекенду (NestJS) в межах монорепозиторію. Дотримуйся цих правил для забезпечення безпеки, масштабованості та чистоти коду.

## 1. Архітектура та Розділення Відповідальності

* **Модульність**: Кожен домен (Auth, Workouts, Users) — окремий модуль.
* **Controllers**: HTTP-маршрутизація тільки, ніякої бізнес-логіки.
* **Services**: Вся бізнес-логіка та взаємодія з БД.
* **Dependency Injection**: Вбудований DI-контейнер NestJS.

## 2. Спільні Інтерфейси (Monorepo Rule)

* Всі контракти імпортуються з `@athlo/shared`
* DTO-класи імплементують спільні інтерфейси: `export class RegisterDto implements RegisterRequest { ... }`

## 3. Валідація та DTO

* Суворо `class-validator` + `class-transformer`
* Всі поля в DTO — декоратори (`@IsString()`, `@IsEmail()`, `@IsOptional()`)
* `ValidationPipe` + `whitelist: true` + `transform: true`

## 4. Безпека та Авторизація

* `JwtAuthGuard` для приватних ендпоінтів
* Глобальна Guard за замовчуванням, публічні маршрути — `@Public()`
* `@CurrentUser()` декоратор замість `req.user`
* Ніколи не повертай хеші паролів

## 5. Обробка Помилок

* HTTP-винятки кидаються **в сервісах**, не в контролерах
* Інформативні повідомлення: `new NotFoundException('Workout with ID 123 not found')`

## 6. Документація (Swagger)

* `@ApiTags('Name')` у контролерах
* `@ApiOperation()`, `@ApiResponse()` для ендпоінтів
* `@ApiProperty()` для DTO-полів

## 7. Найменування

* **Файли**: `[name].[type].ts` — `workout.controller.ts`, `workout.service.ts`
* **Класи**: PascalCase — `WorkoutService`
* **Методи**: camelCase — `getWorkoutById`
* **Ендпоінти**: множина для ресурсів — `GET /exercises`, `POST /workouts/:id/sets`

## 8. API Design — Real-World Usage

* Ендпоінти мають відображати реальний UX: `PATCH /workouts/:id/complete`, `POST /workouts/:id/copy-from-template`
* Передбачай фільтрацію, пагінацію, вкладені дані (тренування + сети + вправи)
* Кожен метод контролера — конкретна фіча з документації, без "сміттєвих" ендпоінтів