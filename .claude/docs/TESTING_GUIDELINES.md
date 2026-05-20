# Unit Testing Guidelines — Athlo Monorepo

## 0. Philosophy
* **Test behavior, not implementation**: What does the code do, not how inside
* **AAA pattern**: Arrange → Act → Assert
* **One responsibility per test**: One `it()` = one scenario
* **F.I.R.S.T**: Fast, Isolated, Repeatable, Self-validating, Timely
* **Layer coverage**: Prioritize Services (backend), Hooks (frontend), Utilities. Controllers/Components secondary.

## 1. File Structure

| Layer | Location | Naming |
|---|---|---|
| Backend Service | Poruч iz file | `workout.service.spec.ts` |
| Backend Controller | Poruc iz file | `workout.controller.spec.ts` |
| Frontend Hook | Poruc iz file | `useWorkout.spec.ts` |
| Frontend Component | Poruc iz file | `Button.spec.tsx` |

Naming: `describe('Unit')` → `describe('method')` → `it('should [do] when [condition]')`

## 2. Backend (NestJS) — Jest + @nestjs/testing

### 2.1 Service Pattern
Mock all external dependencies (repositories, services). Never connect real DB.

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkoutService } from './workout.service';
import { WorkoutEntity } from '../entities/workout.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

describe('WorkoutService', () => {
  let service: WorkoutService;
  let repo: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WorkoutService,
        { provide: getRepositoryToken(WorkoutEntity), useValue: mockRepository() },
      ],
    }).compile();
    service = module.get(WorkoutService);
    repo = module.get(getRepositoryToken(WorkoutEntity));
  });

  afterEach(() => jest.clearAllMocks());

  it('should create a workout', async () => {
    const dto = { name: 'Push Day' };
    repo.create.mockReturnValue({ id: 1, ...dto });
    repo.save.mockResolvedValue({ id: 1, ...dto });
    const result = await service.create(1, dto);
    expect(result.id).toBe(1);
  });

  it('should throw NotFoundException when not found', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
  });
});
```

### 2.2 Controller Pattern
Test that controller calls the correct service method with correct arguments.

```ts
describe('WorkoutController', () => {
  let controller: WorkoutController;
  let service: jest.Mocked<WorkoutService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [WorkoutController],
      providers: [{ provide: WorkoutService, useValue: { create: jest.fn(), findOne: jest.fn() } }],
    }).compile();
    controller = module.get(WorkoutController);
    service = module.get(WorkoutService);
  });

  it('should call service.create', async () => {
    service.create.mockResolvedValue({ id: 1, name: 'Push' });
    const result = await controller.create({ id: 1 }, { name: 'Push' });
    expect(service.create).toHaveBeenCalledWith(1, { name: 'Push' });
  });
});
```

### 2.3 AuthService Special Rules
Mock bcrypt and JwtService via `jest.spyOn`.

```ts
it('should not return password_hash', async () => {
  mockUserService.findByEmail.mockResolvedValue({ id: 1, password_hash: 'secret' });
  jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
  mockJwtService.sign.mockReturnValue('token');
  const result = await authService.login({ email: 'a@b.com', password: '123' });
  expect(result.user).not.toHaveProperty('password_hash');
});
```

### 2.4 Backend Checklist
- [ ] TestingModule created/cleared in beforeEach/afterEach
- [ ] All external dependencies mocked via useValue
- [ ] Repositories mocked via getRepositoryToken()
- [ ] Each NotFoundException/ForbiddenException has its own test
- [ ] Happy path + edge cases covered
- [ ] bcrypt, JwtService mocked via jest.spyOn
- [ ] No real DB connections
- [ ] Swagger decorators not tested

## 3. Frontend (React Native + Expo) — Jest + @testing-library/react-native

### 3.1 Utility Function Pattern
Pure functions without dependencies — simplest & most valuable.

```ts
import { formatDuration, calculateVolume } from './workout';

describe('formatDuration', () => {
  it('should format seconds to mm:ss', () => {
    expect(formatDuration(90)).toBe('1:30');
  });
  it('should pad single digits', () => {
    expect(formatDuration(65)).toBe('1:05');
  });
});

describe('calculateVolume', () => {
  it('should return sum of weight*reps', () => {
    const sets = [{ weight: 100, reps: 5 }, { weight: 80, reps: 10 }];
    expect(calculateVolume(sets)).toBe(1300);
  });
});
```

### 3.2 API Hook Pattern
Mock apiClient, wrap in QueryClientProvider with `retry: false`.

```ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiClient from '../../api/api-client';
import { useGetWorkouts } from './useWorkoutAPI';

jest.mock('../../api/api-client');

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: any) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useGetWorkouts', () => {
  afterEach(() => jest.clearAllMocks());

  it('should return workouts on success', async () => {
    const mockWorkouts = [{ id: 1, name: 'Push' }];
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockWorkouts });

    const { result } = renderHook(() => useGetWorkouts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockWorkouts);
  });

  it('should set isError on failure', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network'));
    const { result } = renderHook(() => useGetWorkouts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

### 3.3 Mutation Hook Pattern
Test that mutation calls API and invalidates cache.

```ts
import { useCreateWorkout } from './useWorkoutAPI';
import { act } from '@testing-library/react-native';

describe('useCreateWorkout', () => {
  it('should post and invalidate cache', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: 2, name: 'Leg' } });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = jest.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCreateWorkout(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ name: 'Leg' });
    });

    expect(apiClient.post).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });
});
```

### 3.4 Component Pattern
Test rendering, variants, and callbacks.

```tsx
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('should render title', () => {
    render(<Button title="Save" />);
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button title="OK" onPress={onPress} />);
    fireEvent.press(screen.getByText('OK'));
    expect(onPress).toHaveBeenCalled();
  });

  it('should not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button title="OK" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText('OK'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

### 3.5 Frontend Mocks (Global)
```ts
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: { id: 1, email: 'test@test.com' }, isLoading: false })),
}));
```

### 3.6 Frontend Checklist
- [ ] apiClient mocked via jest.mock()
- [ ] Query hooks wrapped in QueryClientProvider with retry: false
- [ ] New QueryClient per test (factory pattern)
- [ ] jest.clearAllMocks() in afterEach
- [ ] Navigation (expo-router) globally mocked
- [ ] AuthContext mocked if component reads it
- [ ] Utilities tested in isolation
- [ ] Component tests check elements/behavior, not CSS

## 4. Anti-Patterns

| ❌ Don't | ✅ Do |
|---|---|
| Test private methods directly | Test public method that calls them |
| Check specific component styles | Check element presence/absence and events |
| Snapshot tests for complex screens | Snapshots only for simple atoms |
| Mock the code under test | Mock only external dependencies |
| Tests requiring live DB or network | Always mock I/O in unit tests |
| Test Swagger decorators | That's e2e/integration concern |
| One massive test for "everything" | One `it()` = one scenario |

## 5. Run Tests
```bash
# Backend — all
cd apps/api && npx jest

# Backend — one file
npx jest workout.service.spec.ts

# Backend — coverage
npx jest --coverage

# Frontend — all
cd apps/mobile && npx jest

# Frontend — watch
npx jest --watch
```

## 6. Jest Config (Backend)
```json
"jest": {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "testEnvironment": "node"
}
```

## 7. Jest Config (Frontend)
```json
"jest": {
  "preset": "jest-expo",
  "transformIgnorePatterns": [...]
}
```