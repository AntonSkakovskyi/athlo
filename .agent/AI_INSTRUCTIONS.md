# AI Agent Instructions — Athlo Monorepo

Цей документ є **точкою входу** для ШІ-агента. Він описує унікальні правила, яких немає в жодному іншому файлі. Для детальних правил конкретного шару — посилання нижче.

> **Backend (NestJS)** → `BACKEND_GUIDELINES.md`
> **Frontend (React Native / Expo)** → `RN_STANDARDS.md`
> **Тести** → `TESTING_GUIDELINES.md`
> **Дизайн** → `DESIGN_STANDARDS.md`
> **Git** → `GIT_GUIDELINES.md`
> **Дебаґінг / Root Cause** → `ENGINEERING_PHILOSOPHY.md`

---

## 1. Архітектура монорепозиторію — Shared Types (НАЙВИЩИЙ ПРІОРИТЕТ)

* **`packages/shared` (@athlo/shared)**: Всі базові інтерфейси (`IUser`, `IWorkout`), контракти запитів (`LoginRequest`) та відповідей (`AuthResponse`) **мають** створюватися тут.
* **Backend DTOs**: Бекенд DTO імплементують або розширюють спільні інтерфейси:
  ```ts
  export class RegisterDto implements RegisterRequest { ... }
  ```
* **Frontend**: Фронтенд використовує спільні інтерфейси безпосередньо для типізації відповідей React Query та стейту.
* **Заборона дублювання**: Якщо тип потрібен і там, і там — виносити в `@athlo/shared`. Ніколи не декларувати одне й те саме в двох місцях.

---

## 2. БД та Сутності (Supabase / PostgreSQL)

* **Foundation First**: База вже розгорнута в Supabase. Пріоритетне джерело істини — `apps/api/athlo-db-without-nutrition.sql`.
* **Заборона нових міграцій**: Не генеруй TypeORM/Prisma-міграції, якщо це не попрошено явно. Використовуй існуючу схему для створення `*.entity.ts`.
* **Аналіз контексту**: Перед створенням нового модуля — проаналізуй відповідні таблиці в SQL-файлі та їхні зв'язки з `users`, `visibility_type` та іншими ресурсами.
* **Entity Mapping**: При написанні `*.entity.ts` суворо дотримуйся назв колонок, типів (`TIMESTAMPTZ`, `DECIMAL`) та констрейнтів (`CHECK (value > 0)`) з SQL-файлу.

---

## 3. Проектування API — Real-World Usage

* **Реальні потреби атлета**: Ендпоінти мають відображати реальний UX, а не лише CRUD.
  * *Приклади*: `PATCH /workouts/:id/complete`, `POST /workouts/:id/copy-from-template`, `GET /exercises/:id/personal-records`.
* **Комплексність**: Передбачай фільтрацію, пагінацію для довгих списків та вкладені дані (наприклад, тренування разом із сетами та назвами вправ) — щоб мінімізувати кількість запитів з мобільного додатка.
* **Без "сміттєвих" ендпоінтів**: Кожен метод контролера має відповідати конкретній фічі з `DEVELOPMENT_PLAN.md`. Не створюй ендпоінти, які не будуть викликані з інтерфейсу.