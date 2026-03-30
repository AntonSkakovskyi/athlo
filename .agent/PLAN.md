# Athlo - Development Roadmap

Цей документ описує фази розробки проєкту. Розробка має вестися строго ітеративно, згідно з цим планом.

### [ ] Phase 1: Аутентифікація (Блокує всі наступні фази)
**Backend:**
- [ ] Налаштування `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`.
- [ ] `AuthService`: методи `register()`, `login()`, `validateUser()`.
- [ ] Ендпоінти: `POST /auth/register`, `POST /auth/login`.
- [ ] `JwtStrategy`, `JwtAuthGuard` та кастомний декоратор `@CurrentUser()`.
- [ ] Захист усіх ендпоінтів (глобальний Guard).
**Frontend:**
- [ ] Налаштування навігації `expo-router` (AuthStack vs AppStack).
- [ ] Auth context та кастомний хук `useAuth`.
- [ ] Екрани: `Login`, `Register`.
- [ ] Реалізація Auto-login при наявності валідного JWT у SecureStore/AsyncStorage.

### [ ] Phase 2: Довідники та каталог вправ (Паралельно з Phase 1 Front)
- [ ] **Сутності**: `Exercise`, `Muscle`, `Equipment`, `TrackingType`, `ExerciseMuscle`, `VisibilityType`.
- [ ] Ендпоінт `GET /exercises` (пагінація, фільтрація по м'язах та обладнанню).
- [ ] Ендпоінти `GET /muscles`, `GET /equipments`.

### [ ] Phase 3: Тренування — повний CRUD (Залежить від Phase 1+2)
**Backend:**
- [ ] **Сутності**: `LogExercise`, `LogSet`, `Workout`.
- [ ] Логіка lifecycle: initiate → add exercises → log sets → complete.
- [ ] Nested ендпоінти: `/workouts/:id/exercises`, `/workouts/:id/sets`.
- [ ] Авторизація ресурсів: юзер має доступ тільки до своїх тренувань.
**Frontend:**
- [ ] Екрани: `WorkoutList`, `ActiveWorkout` (з таймером), `ExercisePicker`, `WorkoutSummary`.
- [ ] Компоненти: `SetRow`, `ExerciseCard`, `Timer`, RPE/feeling selector.
- [ ] Впровадження Optimistic updates через React Query.

### [ ] Phase 4: Шаблони тренувань (Залежить від Phase 3)
- [ ] CRUD для templates (edit доступний лише творцю).
- [ ] Логіка "Start from template" (створення workout на основі шаблону).
- [ ] Збереження чужих публічних шаблонів.
- [ ] Visibility filtering (Public, Private, Friends Only).

### [ ] Phase 5: Профіль та метрики тіла (Паралельно з Phase 4)
- [ ] CRUD для Body metrics (вага, обхвати).
- [ ] Побудова графіків прогресу.
- [ ] Редагування профілю користувача.

### [ ] Phase 6: Харчування (Паралельно з Phase 4-5)
- [ ] CRUD продуктів (Foods) та пошук.
- [ ] Meal plans: створення та активація.
- [ ] Nutrition logging: додавання прийомів їжі, контроль води.
- [ ] Daily summary: розрахунок калорій, білків, жирів, вуглеводів.

### [ ] Phase 7: Соціальні фічі (Залежить від Phase 1)
- [ ] Управління друзями (add, accept, remove).
- [ ] Застосування Visibility filtering на workouts/templates/plans для друзів.

### [ ] Phase 8: Організаційні задачі та DevOps
- [ ] **CI/CD**: GitHub Actions (lint + typecheck + test on PR). Auto-deploy API на Render. EAS Build preview на PR.
- [ ] **Swagger**: Автогенерована API документація на `/api/docs`.
- [ ] **Тестування**: Unit tests (services), E2E (supertest), Mobile (jest-expo + testing-library).
- [ ] **Документація**: ER-діаграма, архітектурна діаграма, README.
- [ ] **Дипломна робота**: Аналіз аналогів, UML діаграми (use-case, sequence, activity), скріншоти, висновки.
- [ ] **DevOps**: `.env` management, DB backup strategy, production checklist.