/**
 * Idempotent exercise upserts.
 *
 * Idempotency anchor: partial unique index `idx_exercises_system_name` on
 * `LOWER(name) WHERE user_id IS NULL`. We never touch user-created rows
 * (`user_id IS NOT NULL`) — those keep their own private copy even if the
 * name collides.
 *
 * Each call:
 *   1. INSERT … ON CONFLICT DO UPDATE the system-owned exercise row.
 *   2. Replace its exercise_muscles rows (primary + secondary).
 */
const { queryOne } = require('../lib/db');

const EXERCISE_UPSERT_COLS = [
  'name',
  'description',
  'instructions',
  'equipment_id',
  'tracking_type_id',
  'visibility_type_id',
  'image_url',
  'gif_url',
];

async function upsertExercise(client, payload) {
  const data = {
    name: payload.name,
    description: payload.description ?? null,
    instructions: payload.instructions ?? null,
    equipment_id: payload.equipmentId ?? null,
    tracking_type_id: payload.trackingTypeId ?? null,
    visibility_type_id: payload.visibilityTypeId ?? 1,
    image_url: payload.imageUrl ?? null,
    gif_url: payload.gifUrl ?? null,
  };

  const cols = EXERCISE_UPSERT_COLS.map((c) => `"${c}"`).join(', ');
  const vals = EXERCISE_UPSERT_COLS.map((c) => data[c]);
  const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
  // Conflict target is the partial unique index → refresh ETL-owned columns,
  // never overwrite description if it was hand-edited (COALESCE keeps existing).
  const updateClause = EXERCISE_UPSERT_COLS.filter((c) => c !== 'name')
    .map((c) =>
      c === 'description' || c === 'instructions'
        ? `"${c}" = COALESCE("exercises"."${c}", EXCLUDED."${c}")`
        : `"${c}" = EXCLUDED."${c}"`,
    )
    .join(', ');

  const sql = `
    INSERT INTO "exercises" (${cols})
    VALUES (${placeholders})
    ON CONFLICT (LOWER("name"))
      WHERE "user_id" IS NULL
      DO UPDATE SET ${updateClause}
    RETURNING id
  `;
  const row = await queryOne(client, sql, vals);
  return row.id;
}

/**
 * Replace exercise_muscles for a given exercise. Removes pivot rows pointing at
 * muscles no longer present, then upserts the new ones.
 */
async function syncExerciseMuscles(client, exerciseId, muscles) {
  const muscleIds = muscles.map((m) => m.muscleId).filter((id) => id != null);

  if (muscleIds.length === 0) {
    await client.query(`DELETE FROM "exercise_muscles" WHERE exercise_id = $1`, [exerciseId]);
    return;
  }

  await client.query(
    `DELETE FROM "exercise_muscles"
     WHERE exercise_id = $1 AND muscle_id <> ALL($2::int[])`,
    [exerciseId, muscleIds],
  );

  for (const m of muscles) {
    if (m.muscleId == null) continue;
    await client.query(
      `INSERT INTO "exercise_muscles"
         (exercise_id, muscle_id, impact_percentage, is_primary)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (exercise_id, muscle_id) DO UPDATE
         SET impact_percentage = EXCLUDED.impact_percentage,
             is_primary = EXCLUDED.is_primary`,
      [exerciseId, m.muscleId, m.impact ?? 100, Boolean(m.isPrimary)],
    );
  }
}

/**
 * Update only the gif_url field — used by the ExerciseDB GIF-enrichment step.
 * Also fills `instructions` if currently null.
 */
async function setGifAndInstructions(client, exerciseId, gifUrl, instructions) {
  await client.query(
    `UPDATE "exercises"
     SET "gif_url" = COALESCE($2, "gif_url"),
         "instructions" = COALESCE("instructions", $3)
     WHERE id = $1`,
    [exerciseId, gifUrl, instructions],
  );
}

module.exports = { upsertExercise, syncExerciseMuscles, setGifAndInstructions };
