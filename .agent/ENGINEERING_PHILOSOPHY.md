# Problem Solving & Debugging Philosophy

## 1. Root Cause First (Причина, а не симптом)
* **Жодних виправлень симптомів**, поки не ідентифіковано першопричину (Root Cause).
* Якщо фронтенд падає через `undefined`, не додавай `if (!data) return null`. Знайди, чому API не повернуло дані або чому тип у `@athlo/shared` не відповідає реальності.

## 2. Source-of-Truth Fix (Виправлення в джерелі істини)
* Завжди фікси проблему на рівні "власника" (owner layer), а не там, де з'явився симптом.
* Якщо дані в таблиці БД некоректні — правимо SQL/Seed, а не додаємо мапінг на фронті.

## 3. End-to-End Deep Research
Перед будь-яким фіксом проведи повне дослідження системи:
* **Top-down**: Route -> Page -> Container -> Orchestration -> State.
* **Bottom-up**: DB -> API -> Service -> Hook -> Function.

## 4. Layered Diagnosis (Діагностика за шарами)
Перевіряй проблему в такому порядку:
1. **Contracts**: Чи збігаються типи в `@athlo/shared`?
2. **Business Logic**: Чи правильна логіка в сервісі NestJS?
3. **Async/Timing**: Чи немає Race Conditions у React Query?
4. **UI State**: Чи правильно компонент реагує на стан завантаження/помилки?
5. **Integration**: Як шари взаємодіють між собою?