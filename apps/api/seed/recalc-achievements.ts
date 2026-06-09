/**
 * Achievement / personal-record recalc for seeded data.
 *
 * The seed inserts workouts + log_sets via raw SQL, which bypasses the
 * workout-completion side-effects. This script replays the *real* production
 * logic so user_achievements, user_exercise_records and log_sets.is_pr /
 * achievement_id end up exactly as they would after live workouts.
 *
 * It boots a headless Nest application context (no HTTP server), resolves the
 * actual AchievementService, and for every user with completed workouts replays
 * `checkAndUpdateRecords` over their log-exercises in chronological order
 * (PRs are order-sensitive — each session compares against accumulated records),
 * then `checkGlobalAchievements`.
 *
 * Run via ts-node (spawned by seed.js after the base seed commits):
 *   node node_modules/ts-node/dist/bin.js --transpile-only seed/recalc-achievements.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AchievementService } from '../src/workouts-service/achievement/achievement.service';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const achievements = app.get(AchievementService, { strict: false });
    const dataSource = app.get(DataSource);

    const users: Array<{ user_id: number }> = await dataSource.query(
      `SELECT DISTINCT user_id FROM workouts WHERE status = 'COMPLETED' ORDER BY user_id`,
    );

    if (users.length === 0) {
      console.log('[recalc] no completed workouts found — nothing to do');
      return;
    }

    for (const { user_id: userId } of users) {
      // Oldest → newest so personal-record progression matches real usage.
      const logExercises: Array<{ id: number }> = await dataSource.query(
        `SELECT le.id
           FROM log_exercises le
           JOIN workouts w ON w.id = le.workout_id
          WHERE w.user_id = $1 AND w.status = 'COMPLETED'
          ORDER BY w.started_at ASC, le."order" ASC, le.id ASC`,
        [userId],
      );

      for (const { id } of logExercises) {
        await achievements.checkAndUpdateRecords(userId, id);
      }
      await achievements.checkGlobalAchievements(userId);

      const [{ records }] = await dataSource.query(
        `SELECT COUNT(*)::int AS records FROM user_exercise_records WHERE user_id = $1`,
        [userId],
      );
      const [{ unlocked }] = await dataSource.query(
        `SELECT COUNT(*)::int AS unlocked FROM user_achievements WHERE user_id = $1`,
        [userId],
      );
      const [{ prs }] = await dataSource.query(
        `SELECT COUNT(*)::int AS prs
           FROM log_sets ls
           JOIN log_exercises le ON le.id = ls.log_exercise_id
           JOIN workouts w ON w.id = le.workout_id
          WHERE w.user_id = $1 AND ls.is_pr = true`,
        [userId],
      );

      console.log(
        `[recalc] user ${userId}: ${logExercises.length} log-exercises → ` +
          `${records} records, ${unlocked} achievements, ${prs} PR sets`,
      );
    }

    console.log('[recalc] done');
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('[recalc] fatal:', err);
  process.exit(1);
});
