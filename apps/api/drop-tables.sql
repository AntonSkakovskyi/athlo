-- =========================================================
-- СКРИПТ ДЛЯ ПОВНОГО ВИДАЛЕННЯ ВСІХ ТАБЛИЦЬ ТА ТИПІВ
-- =========================================================

-- 1. Видалення зв'язків та таблиць логування/планування (залежні таблиці)
DROP TABLE IF EXISTS "water_logs" CASCADE;
DROP TABLE IF EXISTS "log_meal_items" CASCADE;
DROP TABLE IF EXISTS "log_meals" CASCADE;
DROP TABLE IF EXISTS "user_meal_plans" CASCADE;
DROP TABLE IF EXISTS "plan_meal_items" CASCADE;
DROP TABLE IF EXISTS "plan_meals" CASCADE;
DROP TABLE IF EXISTS "plan_days" CASCADE;
DROP TABLE IF EXISTS "meal_plans" CASCADE;
DROP TABLE IF EXISTS "food_units" CASCADE;

-- 2. Видалення соціальних функцій, досягнень та рекордів
DROP TABLE IF EXISTS "user_friends" CASCADE;
DROP TABLE IF EXISTS "user_exercise_records" CASCADE;
DROP TABLE IF EXISTS "user_achievements" CASCADE;
DROP TABLE IF EXISTS "achievements" CASCADE;

-- 3. Видалення тренувань та шаблонів
DROP TABLE IF EXISTS "user_workout_templates" CASCADE;
DROP TABLE IF EXISTS "template_sets" CASCADE;
DROP TABLE IF EXISTS "template_exercises" CASCADE;
DROP TABLE IF EXISTS "workout_templates" CASCADE;
DROP TABLE IF EXISTS "log_sets" CASCADE;
DROP TABLE IF EXISTS "log_exercises" CASCADE;
DROP TABLE IF EXISTS "workouts" CASCADE;

-- 4. Видалення вправ, м'язів та обладнання
DROP TABLE IF EXISTS "exercise_muscles" CASCADE;
DROP TABLE IF EXISTS "exercises" CASCADE;
DROP TABLE IF EXISTS "muscles" CASCADE;
DROP TABLE IF EXISTS "equipments" CASCADE;
DROP TABLE IF EXISTS "visibility_type" CASCADE;
DROP TABLE IF EXISTS "tracking_types" CASCADE;

-- 5. Видалення метрик тіла та продуктів харчування
DROP TABLE IF EXISTS "body_metrics" CASCADE;
DROP TABLE IF EXISTS "metric_types" CASCADE;
DROP TABLE IF EXISTS "foods" CASCADE;
DROP TABLE IF EXISTS "meal_types" CASCADE;
DROP TABLE IF EXISTS "units" CASCADE;

-- 6. Видалення користувачів та їх налаштувань
DROP TABLE IF EXISTS "settings" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- 7. Видалення кастомних типів (якщо вони залишилися після міграцій)
DROP TYPE IF EXISTS "workouts_status_enum" CASCADE;

-- 8. Видалення системної таблиці TypeORM (якщо використовується)
DROP TABLE IF EXISTS "migrations" CASCADE;
