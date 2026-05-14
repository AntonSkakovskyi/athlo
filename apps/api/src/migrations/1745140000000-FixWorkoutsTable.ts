import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixWorkoutsTable1745140000000 implements MigrationInterface {
  name = 'FixWorkoutsTable1745140000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Fix status: USER-DEFINED enum -> VARCHAR(50)
    await queryRunner.query(`
      ALTER TABLE "workouts"
        ALTER COLUMN "status" TYPE VARCHAR(50)
        USING "status"::text
    `);
    await queryRunner.query(`
      ALTER TABLE "workouts"
        ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS'
    `);

    // 2. Fix started_at: character varying -> TIMESTAMPTZ
    await queryRunner.query(`
      ALTER TABLE "workouts"
        ALTER COLUMN "started_at" TYPE TIMESTAMPTZ
        USING COALESCE("started_at"::TIMESTAMPTZ, now())
    `);
    await queryRunner.query(`
      ALTER TABLE "workouts"
        ALTER COLUMN "started_at" SET DEFAULT now()
    `);
    await queryRunner.query(`
      ALTER TABLE "workouts"
        ALTER COLUMN "started_at" SET NOT NULL
    `);

    // 3. Fix ended_at: character varying -> TIMESTAMPTZ
    await queryRunner.query(`
      ALTER TABLE "workouts"
        ALTER COLUMN "ended_at" TYPE TIMESTAMPTZ
        USING "ended_at"::TIMESTAMPTZ
    `);

    // 4. Fix description: character varying -> TEXT
    await queryRunner.query(`
      ALTER TABLE "workouts"
        ALTER COLUMN "description" TYPE TEXT
    `);

    // 5. Add missing columns
    await queryRunner.query(`
      ALTER TABLE "workouts"
        ADD COLUMN IF NOT EXISTS "calories" DECIMAL(10,2) DEFAULT 0.00
    `);
    await queryRunner.query(`
      ALTER TABLE "workouts"
        ADD COLUMN IF NOT EXISTS "avg_heart_rate" INTEGER
    `);
    await queryRunner.query(`
      ALTER TABLE "workouts"
        ADD COLUMN IF NOT EXISTS "max_heart_rate" INTEGER
    `);
    await queryRunner.query(`
      ALTER TABLE "workouts"
        ADD COLUMN IF NOT EXISTS "rpe" INTEGER
    `);

    // 6. Drop the old enum type if it exists (created by synchronize: true)
    await queryRunner.query(`
      DROP TYPE IF EXISTS "workouts_status_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN IF EXISTS "rpe"`);
    await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN IF EXISTS "max_heart_rate"`);
    await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN IF EXISTS "avg_heart_rate"`);
    await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN IF EXISTS "calories"`);
  }
}
