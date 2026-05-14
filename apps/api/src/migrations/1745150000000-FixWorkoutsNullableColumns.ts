import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixWorkoutsNullableColumns1745150000000 implements MigrationInterface {
  name = 'FixWorkoutsNullableColumns1745150000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. visibility_type_id — add server-side DEFAULT 1 so TypeORM's DEFAULT works
    await queryRunner.query(`
      ALTER TABLE "workouts"
        ALTER COLUMN "visibility_type_id" SET DEFAULT 1
    `);

    // 2. ended_at — entity is nullable: true, but DB had NOT NULL (from old synchronize)
    await queryRunner.query(`
      ALTER TABLE "workouts"
        ALTER COLUMN "ended_at" DROP NOT NULL
    `);

    // 3. description — entity is nullable: true, but DB had NOT NULL
    await queryRunner.query(`
      ALTER TABLE "workouts"
        ALTER COLUMN "description" DROP NOT NULL
    `);

    // 4. feeling_score — entity is nullable: true, but DB had NOT NULL
    await queryRunner.query(`
      ALTER TABLE "workouts"
        ALTER COLUMN "feeling_score" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "workouts" ALTER COLUMN "feeling_score" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "workouts" ALTER COLUMN "description" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "workouts" ALTER COLUMN "ended_at" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "workouts" ALTER COLUMN "visibility_type_id" DROP DEFAULT`);
  }
}
