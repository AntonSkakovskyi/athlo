# Unit Testing Guidelines — Athlo Monorepo

Цей документ визначає стандарти та патерни написання юніт-тестів для бекенду (NestJS) та фронтенду (React Native + Expo) у межах монорепозиторію Athlo.

---

## 0. Загальна Філософія

* **Тестуй поведінку, а не реалізацію**: Тест перевіряє *що* робить одиниця коду, а не *як* вона це робить всередині.
* **AAA-патерн**: Кожен тест будується за структурою **Arrange → Act → Assert**.
* **Один тест — одна відповідальність**: Кожен `it()`/`test()` перевіряє рівно один сценарій.
* **F.I.R.S.T**: Тести мають бути **F**ast, **I**solated, **R**epeatable, **S**elf-validating, **T**imely.
* **Покриття по шарах**: Пишемо тести передусім для шарів із бізнес-логікою (Services на бекенді, хуки та утиліти на фронтенді). Контролери та компоненти — вторинні цілі.

---

## 1. Загальні Правила Найменування та Структури

### 1.1 Розташування файлів

| Шар | Розташування тестового файлу |
|---|---|
| Backend Service | Поруч із файлом: `workout.service.spec.ts` |
| Backend Controller | Поруч із файлом: `workout.controller.spec.ts` |
| Frontend Hook | Поруч із файлом: `useWorkoutHooks.spec.ts` |
| Frontend Component | Поруч із файлом: `Button.spec.tsx` |
| Shared Utility | Поруч із файлом: `date.spec.ts` |

### 1.2 Іменування тестів

```ts
// describe — назва тестованого юніту (клас або функція)
describe('WorkoutService', () => {
  // Вкладений describe — метод або сценарій
  describe('create', () => {
    // it — конкретний кейс у форматі "should [дія] when [умова]"
    it('should create and save a new workout', async () => { ... });
    it('should throw NotFoundException when workout does not exist', async () => { ... });
  });
});
```

### 1.3 Структура AAA всередині тесту

```ts
it('should return user without password hash', async () => {
  // Arrange
  const loginDto = { email: 'user@test.com', password: '123456' };
  mockUserService.findByEmail.mockResolvedValue(mockUser);
  jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

  // Act
  const result = await authService.login(loginDto);

  // Assert
  expect(result.user).not.toHaveProperty('password_hash');
  expect(result.token).toBeDefined();
});
```

---

## 2. Backend (NestJS) — Юніт Тести

### 2.1 Інструменти

* **Runner**: Jest (вбудований у NestJS CLI)
* **Testing Module**: `@nestjs/testing` → `Test.createTestingModule()`
* **Моки**: `jest.fn()` / `jest.spyOn()`
* **Файли**: `*.spec.ts` поруч із вихідним файлом

### 2.2 Що Тестувати в Першу Чергу

| Пріоритет | Шар | Причина |
|---|---|---|
| 🔴 Обов'язково | **Services** | Вся бізнес-логіка, happy path + edge cases |
| 🟡 Бажано | **Controllers** | Перевірка маршрутизації та делегування до сервісу |
| 🟢 За потреби | **Guards / Strategies** | Тільки якщо є нетривіальна логіка |

### 2.3 Патерн: Тест Сервісу

Сервіси залежать від репозиторіїв або інших сервісів. Їх треба **повністю мокати** — ніколи не підключати реальну БД у юніт-тестах.

```ts
// workout.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkoutService } from './workout.service';
import { WorkoutEntity } from '../entities/workout.entity';
import { LogSetEntity } from '../entities/log-set.entity';
import { AchievementService } from '../achievement/achievement.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { WorkoutStatus } from '@athlo/shared';

// ── Фабрика мок-репозиторію ────────────────────────────────────────────
const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('WorkoutService', () => {
  let service: WorkoutService;
  let workoutsRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutService,
        {
          provide: getRepositoryToken(WorkoutEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(LogSetEntity),
          useValue: createMockRepository(),
        },
        {
          provide: AchievementService,
          useValue: { checkAndAwardAchievements: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<WorkoutService>(WorkoutService);
    workoutsRepo = module.get(getRepositoryToken(WorkoutEntity));
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create and save a new workout with IN_PROGRESS status', async () => {
      // Arrange
      const dto = { name: 'Push Day', description: 'Chest & Shoulders' };
      const userId = 1;
      const mockWorkout = { id: 1, userId, ...dto, status: WorkoutStatus.IN_PROGRESS };

      workoutsRepo.create.mockReturnValue(mockWorkout);
      workoutsRepo.save.mockResolvedValue(mockWorkout);

      // Act
      const result = await service.create(userId, dto);

      // Assert
      expect(workoutsRepo.create).toHaveBeenCalledWith({
        userId,
        name: dto.name,
        description: dto.description,
        status: WorkoutStatus.IN_PROGRESS,
      });
      expect(workoutsRepo.save).toHaveBeenCalledWith(mockWorkout);
      expect(result.status).toBe(WorkoutStatus.IN_PROGRESS);
    });
  });

  // ── findOne ──────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should throw NotFoundException when workout does not exist', async () => {
      // Arrange
      workoutsRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when workout belongs to another user', async () => {
      // Arrange
      workoutsRepo.findOne.mockResolvedValue({ id: 1, userId: 2 });

      // Act & Assert
      await expect(service.findOne(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('should return workout when it belongs to the current user', async () => {
      // Arrange
      const mockWorkout = { id: 1, userId: 1, name: 'Leg Day' };
      workoutsRepo.findOne.mockResolvedValue(mockWorkout);

      // Act
      const result = await service.findOne(1, 1);

      // Assert
      expect(result).toEqual(mockWorkout);
    });
  });
});
```

### 2.4 Патерн: Тест Контролера

Контролер делегує роботу сервісу. Тест Контролера перевіряє лише те, що він **викликає правильний метод сервісу з правильними аргументами**.

```ts
// workout.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutController } from './workout.controller';
import { WorkoutService } from './workout.service';

describe('WorkoutController', () => {
  let controller: WorkoutController;
  let service: jest.Mocked<WorkoutService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkoutController],
      providers: [
        {
          provide: WorkoutService,
          // useValue з усіма методами-заглушками
          useValue: {
            create: jest.fn(),
            findAllByUser: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WorkoutController>(WorkoutController);
    service = module.get(WorkoutService);
  });

  describe('create', () => {
    it('should call workoutService.create with userId and dto', async () => {
      // Arrange
      const dto = { name: 'Pull Day' };
      const currentUser = { id: 1, email: 'a@b.com' };
      const expected = { id: 10, ...dto };
      service.create.mockResolvedValue(expected as any);

      // Act
      const result = await controller.create(currentUser, dto as any);

      // Assert
      expect(service.create).toHaveBeenCalledWith(currentUser.id, dto);
      expect(result).toEqual(expected);
    });
  });
});
```

### 2.5 Тестування AuthService — Спеціальні Правила

`AuthService` використовує `bcrypt` — зовнішній модуль, який треба мокати через `jest.spyOn`, щоб тест не залежав від реального хешування.

```ts
// auth.service.spec.ts

import * as bcrypt from 'bcrypt';

it('should throw UnauthorizedException when password is invalid', async () => {
  // Arrange
  mockUserService.findByEmail.mockResolvedValue({ password_hash: 'hash' });
  jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

  // Act & Assert
  await expect(authService.login({ email: 'a@b.com', password: 'wrong' }))
    .rejects.toThrow(UnauthorizedException);
});

it('should not return password_hash in the response', async () => {
  // Arrange
  const user = { id: 1, email: 'a@b.com', password_hash: 'secret' };
  mockUserService.findByEmail.mockResolvedValue(user);
  jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
  mockJwtService.sign.mockReturnValue('jwt-token');

  // Act
  const result = await authService.login({ email: 'a@b.com', password: '123456' });

  // Assert — безпека: хеш паролю не має витікати назовні
  expect(result.user).not.toHaveProperty('password_hash');
});
```

### 2.6 Checklist: Бекенд

- [ ] `TestingModule` створений у `beforeEach`, очищений у `afterEach` через `jest.clearAllMocks()`
- [ ] Всі зовнішні залежності (репозиторії, сервіси) — замінені моками через `useValue`
- [ ] Репозиторії мокаються через `getRepositoryToken(EntityClass)`
- [ ] Кожен `NotFoundException` / `ForbiddenException` перевіряється окремим тестом
- [ ] Happy path і edge cases покриті
- [ ] `bcrypt`, `JwtService` та інші зовнішні утиліти мокаються через `jest.spyOn`
- [ ] Тест не підключається до реальної БД (жодних TypeORM connections)
- [ ] Тест не перевіряє Swagger-декоратори

---

## 3. Frontend (React Native + Expo) — Юніт Тести

### 3.1 Інструменти

* **Runner**: Jest + `jest-expo` (пресет з `package.json`)
* **Component Testing**: `@testing-library/react-native` (`render`, `fireEvent`, `screen`)
* **Hook Testing**: `renderHook` з `@testing-library/react-native`
* **React Query**: обгортка `QueryClientProvider` у тестах, мокування `apiClient`
* **Файли**: `*.spec.tsx` (компоненти) / `*.spec.ts` (хуки, утиліти)

### 3.2 Що Тестувати в Першу Чергу

| Пріоритет | Шар | Причина |
|---|---|---|
| 🔴 Обов'язково | **Utility functions** (`utils/`) | Чиста логіка без залежностей |
| 🔴 Обов'язково | **API Hooks** (`hooks/api/`) | Взаємодія з сервером, кешування, мутації |
| 🟡 Бажано | **UI компоненти** (`components/ui/`) | Перевірка рендерингу атомів |
| 🟢 За потреби | **Screen компоненти** | Тільки інтеграційна логіка оркестратора |

### 3.3 Патерн: Тест Утилітної Функції

Найпростіший і найціннішіший тип — чисті функції без залежностей.

```ts
// utils/workout.spec.ts

import { formatDuration, calculateTotalVolume } from './workout';

describe('formatDuration', () => {
  it('should format seconds to mm:ss string', () => {
    expect(formatDuration(90)).toBe('1:30');
  });

  it('should pad single-digit seconds with zero', () => {
    expect(formatDuration(65)).toBe('1:05');
  });

  it('should return "0:00" for zero duration', () => {
    expect(formatDuration(0)).toBe('0:00');
  });
});

describe('calculateTotalVolume', () => {
  it('should return sum of (weight * reps) for all sets', () => {
    const sets = [
      { weight: 100, reps: 5 },
      { weight: 80, reps: 10 },
    ];
    expect(calculateTotalVolume(sets)).toBe(1300);
  });

  it('should return 0 for empty sets array', () => {
    expect(calculateTotalVolume([])).toBe(0);
  });
});
```

### 3.4 Патерн: Тест API-Хука

Хуки використовують `apiClient` та React Query. Мокаємо `apiClient` повністю, обгортаємо у `QueryClientProvider`.

```ts
// hooks/api/useWorkoutHooks.spec.ts

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import apiClient from '../../api/api-client';
import { useGetWorkouts } from './useWorkoutHooks';
import type { IWorkout } from '@athlo/shared';

// ── Мок apiClient ────────────────────────────────────────────────────────
jest.mock('../../api/api-client');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

// ── Хелпер: обгортка з QueryClientProvider ───────────────────────────────
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useGetWorkouts', () => {
  afterEach(() => jest.clearAllMocks());

  it('should return workouts on successful fetch', async () => {
    // Arrange
    const mockWorkouts: IWorkout[] = [{ id: 1, name: 'Push Day' } as IWorkout];
    mockedApiClient.get.mockResolvedValue({ data: mockWorkouts });

    // Act
    const { result } = renderHook(() => useGetWorkouts(), {
      wrapper: createWrapper(),
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockWorkouts);
  });

  it('should set isError when the request fails', async () => {
    // Arrange
    mockedApiClient.get.mockRejectedValue(new Error('Network error'));

    // Act
    const { result } = renderHook(() => useGetWorkouts(), {
      wrapper: createWrapper(),
    });

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

### 3.5 Патерн: Тест Мутаційного Хука

```ts
// hooks/api/useWorkoutHooks.spec.ts (продовження)

import { useCreateWorkout } from './useWorkoutHooks';
import { act } from '@testing-library/react-native';

describe('useCreateWorkout', () => {
  it('should call apiClient.post and invalidate workouts cache on success', async () => {
    // Arrange
    const newWorkout = { id: 2, name: 'Leg Day' } as IWorkout;
    mockedApiClient.post.mockResolvedValue({ data: newWorkout });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateWorkout(), { wrapper });

    // Act
    await act(async () => {
      await result.current.mutateAsync({ name: 'Leg Day' });
    });

    // Assert
    expect(mockedApiClient.post).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalled();
  });
});
```

### 3.6 Патерн: Тест UI-Компонента (Atomic)

Тестуємо атомарні компоненти з `components/ui/`. Перевіряємо рендеринг, призначення варіантів та callback'и.

```tsx
// components/ui/Button.spec.tsx

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('should render title text', () => {
    render(<Button title="Зберегти" />);
    expect(screen.getByText('Зберегти')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button title="OK" onPress={onPress} />);

    fireEvent.press(screen.getByText('OK'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button title="OK" onPress={onPress} disabled />);

    fireEvent.press(screen.getByText('OK'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('should render ActivityIndicator when isLoading is true', () => {
    render(<Button title="Завантаження" isLoading />);
    // При isLoading текст не рендериться — ActivityIndicator замість нього
    expect(screen.queryByText('Завантаження')).toBeNull();
  });
});
```

### 3.7 Моки для React Native та Expo

Деякі модулі Expo треба мокати глобально у `jest.setup.ts` або безпосередньо у файлах.

```ts
// Мок для expo-secure-store (auth токени)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Мок для expo-router (навігація)
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({})),
}));

// Мок AuthContext (якщо компонент читає поточного користувача)
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: { id: 1, email: 'test@test.com' }, isLoading: false })),
}));
```

### 3.8 Checklist: Фронтенд

- [ ] `apiClient` замокований через `jest.mock()`
- [ ] Хуки React Query обгорнуті у `QueryClientProvider` з `retry: false`
- [ ] `QueryClient` — новий екземпляр у кожному тесті (через фабрику)
- [ ] `jest.clearAllMocks()` у `afterEach`
- [ ] Навігація (`expo-router`) замокована глобально
- [ ] `AuthContext` замокований, якщо компонент його читає
- [ ] Утилітні функції протестовані ізольовано (без жодних моків)
- [ ] Тести компонентів не перевіряють CSS-стилі — тільки наявність елементів та поведінку

---

## 4. Що НЕ Тестувати (Anti-Patterns)

| ❌ Не роби | ✅ Роби натомість |
|---|---|
| Тестувати приватні методи напряму | Тестуй публічний метод, що їх викликає |
| Перевіряти конкретні стилі компонентів | Перевіряй наявність/відсутність елементів та events |
| Snapshot-тести для складних Screen-компонентів | Snapshot — лише для простих атомарних компонентів |
| Мокати сам тестований клас/функцію | Мокай лише зовнішні залежності |
| Тести, що потребують живої БД або мережі | Завжди мокай I/O у юніт-тестах |
| Тестувати Swagger-декоратори | Це відповідальність e2e або integration тестів |
| Писати один великий тест на "все разом" | Один `it()` — один сценарій |

---

## 5. Запуск Тестів

```bash
# Backend — всі юніт тести
cd apps/api
npx jest

# Backend — з покриттям
npx jest --coverage

# Backend — watch mode під час розробки
npx jest --watch

# Backend — один файл
npx jest workout.service.spec.ts

# Frontend — всі тести
cd apps/mobile
npx jest

# Frontend — один файл
npx jest useWorkoutHooks.spec.ts
```

---

## 6. Конфігурація Jest (Backend)

Jest для бекенду вже налаштований у `apps/api/package.json`. Стандартна конфігурація NestJS CLI:

```json
"jest": {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

## 7. Конфігурація Jest (Frontend)

Frontend використовує пресет `jest-expo` з `apps/mobile/package.json`:

```json
"jest": {
  "preset": "jest-expo",
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
  ]
}
```
