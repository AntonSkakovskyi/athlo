# React Native & Expo Development Standards

Цей документ визначає стандарти написання коду для забезпечення масштабованості та підтримки проєкту. Дотримуйся цих правил при генерації будь-якого фронтенд-коду.

## 1. Архітектура та Структура
* **Feature-based structure**: Розділяй логіку за функціоналом (auth, workouts, profile).
* **Separation of Concerns**: 
    * **UI (Components)**: Тільки відображення та базова обробка подій.
    * **Logic (Hooks)**: Вся бізнес-логіка, запити до API та робота зі стейтом виносяться у кастомні хуки.
    * **Services**: Прямі виклики до API (axios/fetch).

## 2. Компоненти та Стилізація
* **Atomic Design (спрощений)**: Створюй маленькі перевикористовувані UI-елементи в `/components/ui`.
* **Props**: Використовуй сувору типізацію для props через TypeScript (інтерфейси).
* **Styling**: Використовуй `StyleSheet.create` або Tailwind (NativeWind), якщо він підключений. Уникай інлайнових стилів.
* **Responsiveness**: Використовуй гнучку розмістку (flexbox) та уникай жорстко прописаних `width/height` у пікселях, де це можливо.

## 3. Робота з даними (React Query)
* **Query Keys**: Використовуй централізований об'єкт `queryKeys` для уникнення магічних рядків.
* **Hooks**: Кожен запит (GET) або мутація (POST/PUT/DELETE) має бути у власному хуку в папці `hooks/api`.
* **Error Handling**: Передбачай стан завантаження (`isLoading`) та помилки (`error`) у кожному UI-компоненті.

## 4. TypeScript та Типізація
* **No `any`**: Використання `any` суворо заборонено.
* **Shared Types**: Спільні моделі даних (наприклад, `User`, `Workout`) мають зберігатися в папці `types/` або `api/types.ts`.
* **Type Safety**: Завжди типізуй відповіді від API.

## 5. Навігація (Expo Router)
* Використовуй файлову систему `app/` для роутингу.
* Використовуй типізовані посилання та метод `router.push()`.
* Групуй маршрути: `(auth)` для авторизації, `(app)` для основного функціоналу.

## 6. Найменування (Naming Convention)
* **Компоненти**: PascalCase (`WorkoutCard.tsx`).
* **Хуки**: camelCase з префіксом use (`useWorkoutData.ts`).
* **Константи**: UPPER_SNAKE_CASE.
* **Файли стилів/утиліт**: camelCase.

## 7. Найкращі практики (Clean Code)
* Принцип **DRY** (Don't Repeat Yourself).
* Принцип **KISS** (Keep It Simple, Stupid).
* Використовуй `Optional Chaining` (`?.`) та `Nullish Coalescing` (`??`).
* Додавай JSDoc коментарі для складних функцій.