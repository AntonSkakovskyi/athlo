import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAchievementsSystem1743775200000 implements MigrationInterface {
  name = 'AddAchievementsSystem1743775200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─────────────────────────────────────────────────────────────
    // 1. Таблиця achievements — глобальні визначення досягнень
    // ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "achievements" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT NOT NULL,
        "type" VARCHAR(50) NOT NULL,
        "threshold" DECIMAL(14, 2) NOT NULL,
        "exercise_id" INTEGER,
        "tracking_metric" VARCHAR(50),
        "icon_url" VARCHAR(512),
        "order" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "FK_achievements_exercise"
          FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id")
          ON DELETE CASCADE
      )
    `);

    // ─────────────────────────────────────────────────────────────
    // 2. Таблиця user_achievements — розблоковані досягнення
    // ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "user_achievements" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "achievement_id" INTEGER NOT NULL,
        "unlocked_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "value" DECIMAL(14, 2) NOT NULL DEFAULT 0,
        CONSTRAINT "FK_user_achievements_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_user_achievements_achievement"
          FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id")
          ON DELETE CASCADE,
        CONSTRAINT "UQ_user_achievement"
          UNIQUE ("user_id", "achievement_id")
      )
    `);

    // ─────────────────────────────────────────────────────────────
    // 3. Таблиця user_exercise_records — персональні рекорди
    // ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "user_exercise_records" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "exercise_id" INTEGER NOT NULL,
        "best_weight" DECIMAL(10, 2),
        "best_reps" INTEGER,
        "best_duration" INTEGER,
        "best_distance" DECIMAL(10, 2),
        "estimated_1rm" DECIMAL(10, 2),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_user_exercise_records_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_user_exercise_records_exercise"
          FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id")
          ON DELETE CASCADE,
        CONSTRAINT "UQ_user_exercise_record"
          UNIQUE ("user_id", "exercise_id")
      )
    `);

    // ─────────────────────────────────────────────────────────────
    // 4. Індекси
    // ─────────────────────────────────────────────────────────────
    // Індекси на user_id НЕ потрібні — UNIQUE(user_id, achievement_id)
    // та UNIQUE(user_id, exercise_id) вже покривають пошук по user_id
    // (PostgreSQL створює B-tree індекс для UNIQUE, ліва колонка шукається ефективно).

    await queryRunner.query(`
      CREATE INDEX "idx_achievements_type" ON "achievements" ("type")
    `);

    // ─────────────────────────────────────────────────────────────
    // 5. Seed глобальних досягнень
    // ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "achievements" ("name", "description", "type", "threshold", "order") VALUES
        ('First Workout',       'Complete your first workout',             'GLOBAL_WORKOUTS', 1,      1),
        ('10 Workouts',         'Complete 10 workouts',                    'GLOBAL_WORKOUTS', 10,     2),
        ('25 Workouts',         'Complete 25 workouts',                    'GLOBAL_WORKOUTS', 25,     3),
        ('50 Workouts',         'Complete 50 workouts',                    'GLOBAL_WORKOUTS', 50,     4),
        ('100 Workouts',        'Complete 100 workouts',                   'GLOBAL_WORKOUTS', 100,    5),
        ('250 Workouts',        'Complete 250 workouts',                   'GLOBAL_WORKOUTS', 250,    6),
        ('500 Workouts',        'Complete 500 workouts',                   'GLOBAL_WORKOUTS', 500,    7),
        ('100 Sets',            'Complete 100 sets across all workouts',   'GLOBAL_SETS',     100,    8),
        ('500 Sets',            'Complete 500 sets across all workouts',   'GLOBAL_SETS',     500,    9),
        ('1000 Sets',           'Complete 1,000 sets across all workouts', 'GLOBAL_SETS',     1000,   10),
        ('5000 Sets',           'Complete 5,000 sets across all workouts', 'GLOBAL_SETS',     5000,   11),
        ('1,000 kg Lifted',     'Lift a total of 1,000 kg',               'GLOBAL_WEIGHT',   1000,   12),
        ('10,000 kg Lifted',    'Lift a total of 10,000 kg',              'GLOBAL_WEIGHT',   10000,  13),
        ('50,000 kg Lifted',    'Lift a total of 50,000 kg',              'GLOBAL_WEIGHT',   50000,  14),
        ('100,000 kg Lifted',   'Lift a total of 100,000 kg',             'GLOBAL_WEIGHT',   100000, 15),
        ('500,000 kg Lifted',   'Lift a total of 500,000 kg',             'GLOBAL_WEIGHT',   500000, 16),
        ('1,000,000 kg Lifted', 'Lift a total of 1,000,000 kg',           'GLOBAL_WEIGHT',   1000000,17)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_achievements_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_exercise_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_achievements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "achievements"`);
  }
}
