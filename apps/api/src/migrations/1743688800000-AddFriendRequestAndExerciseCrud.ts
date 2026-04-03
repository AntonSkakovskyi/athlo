import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFriendRequestAndExerciseCrud1743688800000 implements MigrationInterface {
  name = 'AddFriendRequestAndExerciseCrud1743688800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─────────────────────────────────────────────────────────────
    // Phase 1: Friend Request Flow
    // ─────────────────────────────────────────────────────────────

    // 1. Додаємо колонку status (за замовчуванням PENDING)
    await queryRunner.query(`
      ALTER TABLE "user_friends"
      ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    `);

    // 2. Додаємо колонку created_at
    await queryRunner.query(`
      ALTER TABLE "user_friends"
      ADD COLUMN "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
    `);

    // 3. Позначаємо всі існуючі записи як ACCEPTED
    //    (вони були додані через стару логіку миттєвої дружби)
    await queryRunner.query(`
      UPDATE "user_friends" SET "status" = 'ACCEPTED'
    `);

    // 4. Видаляємо дублікати зворотних записів.
    //    Стара логіка: A→B і B→A. Нова: лише один запис (менший id залишається).
    await queryRunner.query(`
      DELETE FROM "user_friends" a
      USING "user_friends" b
      WHERE a."user_id" = b."friend_id"
        AND a."friend_id" = b."user_id"
        AND a."id" > b."id"
    `);

    // 5. Індекс для швидкого пошуку вхідних запитів за статусом
    await queryRunner.query(`
      CREATE INDEX "idx_friend_status"
      ON "user_friends" ("friend_id", "status")
    `);

    // ─────────────────────────────────────────────────────────────
    // Phase 2: User Exercises & Equipment CRUD
    // ─────────────────────────────────────────────────────────────

    // 6. Додаємо user_id до equipments (NULL = системне обладнання)
    await queryRunner.query(`
      ALTER TABLE "equipments"
      ADD COLUMN "user_id" INTEGER
    `);

    await queryRunner.query(`
      ALTER TABLE "equipments"
      ADD CONSTRAINT "FK_equipments_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    // 7. Додаємо user_id до exercises (NULL = системна вправа)
    await queryRunner.query(`
      ALTER TABLE "exercises"
      ADD COLUMN "user_id" INTEGER
    `);

    await queryRunner.query(`
      ALTER TABLE "exercises"
      ADD CONSTRAINT "FK_exercises_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    // 8. Додаємо visibility_type_id до exercises (DEFAULT 1 = PRIVATE)
    await queryRunner.query(`
      ALTER TABLE "exercises"
      ADD COLUMN "visibility_type_id" INTEGER NOT NULL DEFAULT 1
    `);

    await queryRunner.query(`
      ALTER TABLE "exercises"
      ADD CONSTRAINT "FK_exercises_visibility_type"
      FOREIGN KEY ("visibility_type_id") REFERENCES "visibility_type"("id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ─── Відкат Phase 2 ───
    await queryRunner.query(`ALTER TABLE "exercises" DROP CONSTRAINT "FK_exercises_visibility_type"`);
    await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN "visibility_type_id"`);

    await queryRunner.query(`ALTER TABLE "exercises" DROP CONSTRAINT "FK_exercises_user"`);
    await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN "user_id"`);

    await queryRunner.query(`ALTER TABLE "equipments" DROP CONSTRAINT "FK_equipments_user"`);
    await queryRunner.query(`ALTER TABLE "equipments" DROP COLUMN "user_id"`);

    // ─── Відкат Phase 1 ───
    await queryRunner.query(`DROP INDEX "idx_friend_status"`);
    await queryRunner.query(`ALTER TABLE "user_friends" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "user_friends" DROP COLUMN "status"`);
  }
}
