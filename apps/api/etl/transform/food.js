/**
 * Idempotent food upserts.
 *
 * Idempotency strategy:
 *   Conflict target is `idx_foods_system_name`
 *   (LOWER(name), COALESCE(LOWER(brand), '')) WHERE creator_id IS NULL.
 *   Only system rows (creator_id IS NULL) participate in the unique index, so a
 *   re-run refreshes the same row instead of duplicating it.
 *
 * The `foods` table only stores identity columns (name, brand, image_url);
 * macros live in `nutrition_facts` (see `ensureNutritionFact`).
 */
const { queryOne, ensureByName } = require('../lib/db');

const FOOD_UPSERT_COLS = ['name', 'brand', 'image_url'];

function numericOrNull(v) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Guard against implausible rows: every macro must be a finite number, calories
 * must be sane for a per-100g basis, and at least one macro must be > 0 (drops
 * empty/placeholder foods). Operates on the mapped shape ({calories, proteins,
 * fats, carbs}).
 */
function validateMacros(m) {
  for (const k of ['calories', 'proteins', 'fats', 'carbs']) {
    if (!Number.isFinite(Number(m[k]))) return false;
  }
  const cal = Number(m.calories);
  if (cal < 0 || cal > 1000) return false;
  return Number(m.proteins) > 0 || Number(m.fats) > 0 || Number(m.carbs) > 0;
}

function buildPayload(payload) {
  return {
    name: payload.name,
    brand: payload.brand ?? null,
    image_url: payload.imageUrl ?? null,
    calories: numericOrNull(payload.calories) ?? 0,
    proteins: numericOrNull(payload.proteins) ?? 0,
    fats: numericOrNull(payload.fats) ?? 0,
    carbs: numericOrNull(payload.carbs) ?? 0,
  };
}

function buildUpdateClause() {
  return FOOD_UPSERT_COLS.filter((c) => c !== 'name')
    .map((c) => `"${c}" = EXCLUDED."${c}"`)
    .join(', ');
}

async function upsertFood(client, input) {
  const data = buildPayload(input);
  const cols = FOOD_UPSERT_COLS.map((c) => `"${c}"`).join(', ');
  const vals = FOOD_UPSERT_COLS.map((c) => data[c]);
  const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');

  // Conflict on idx_foods_system_name — system rows only (creator_id IS NULL).
  const sql = `
    INSERT INTO "foods" (${cols})
    VALUES (${placeholders})
    ON CONFLICT (LOWER("name"), COALESCE(LOWER("brand"), ''))
      WHERE "creator_id" IS NULL
    DO UPDATE SET ${buildUpdateClause()}
    RETURNING id
  `;
  const row = await queryOne(client, sql, vals);
  return row.id;
}

/**
 * Ensure a `(food_id, unit_id)` row exists with the given macros.
 */
async function ensureNutritionFact(client, foodId, unitName, macros) {
  const unitId = await ensureByName(client, 'units', unitName);
  const existing = await queryOne(
    client,
    `SELECT id FROM "nutrition_facts"
     WHERE food_id = $1 AND unit_id = $2 LIMIT 1`,
    [foodId, unitId],
  );

  const amount = macros.amount ?? 1;
  const cal = macros.calories ?? 0;
  const prot = macros.proteins ?? 0;
  const fat = macros.fats ?? 0;
  const carb = macros.carbs ?? 0;

  if (existing) {
    await client.query(
      `UPDATE "nutrition_facts" SET amount = $2, calories = $3, proteins = $4, fats = $5, carbs = $6 WHERE id = $1`,
      [existing.id, amount, cal, prot, fat, carb],
    );
    return existing.id;
  }

  const inserted = await queryOne(
    client,
    `INSERT INTO "nutrition_facts" (food_id, unit_id, amount, calories, proteins, fats, carbs)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [foodId, unitId, amount, cal, prot, fat, carb],
  );
  return inserted.id;
}

module.exports = { upsertFood, ensureNutritionFact, buildPayload, validateMacros };
