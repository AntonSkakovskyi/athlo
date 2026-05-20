/**
 * Idempotent food upserts.
 *
 * Idempotency strategy:
 *   - If `barcode` is present → conflict target is the `idx_foods_barcode`
 *     unique partial index. OFF products always have a barcode.
 *   - Otherwise → conflict target is `idx_foods_system_name`
 *     (LOWER(name), COALESCE(LOWER(brand), '')) WHERE creator_id IS NULL.
 *     Used for USDA FDC rows (no barcode).
 *
 * On insert also create a default `g` food_unit so the food shows up correctly
 * in the mobile food-picker.
 */
const { queryOne, ensureByName } = require('../lib/db');

const FOOD_UPSERT_COLS = [
  'name',
  'brand',
  'calories',
  'proteins',
  'fats',
  'carbs',
  'fiber',
  'sugar',
  'sodium_mg',
  'serving_size_g',
  'image_url',
  'barcode',
];

function numericOrNull(v) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function buildPayload(payload) {
  return {
    name: payload.name,
    brand: payload.brand ?? null,
    calories: numericOrNull(payload.calories) ?? 0,
    proteins: numericOrNull(payload.proteins) ?? 0,
    fats: numericOrNull(payload.fats) ?? 0,
    carbs: numericOrNull(payload.carbs) ?? 0,
    fiber: numericOrNull(payload.fiber) ?? 0,
    sugar: numericOrNull(payload.sugar) ?? 0,
    sodium_mg: numericOrNull(payload.sodiumMg) ?? 0,
    serving_size_g: numericOrNull(payload.servingSizeG),
    image_url: payload.imageUrl ?? null,
    barcode: payload.barcode ?? null,
  };
}

function buildUpdateClause(skipCols = []) {
  return FOOD_UPSERT_COLS.filter((c) => c !== 'name' && !skipCols.includes(c))
    .map((c) => `"${c}" = EXCLUDED."${c}"`)
    .join(', ');
}

async function upsertFood(client, input) {
  const data = buildPayload(input);
  const cols = FOOD_UPSERT_COLS.map((c) => `"${c}"`).join(', ');
  const vals = FOOD_UPSERT_COLS.map((c) => data[c]);
  const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');

  // Barcode-keyed (OFF) — conflict on idx_foods_barcode.
  if (data.barcode) {
    const sql = `
      INSERT INTO "foods" (${cols})
      VALUES (${placeholders})
      ON CONFLICT ("barcode") WHERE "barcode" IS NOT NULL
      DO UPDATE SET ${buildUpdateClause()}
      RETURNING id
    `;
    const row = await queryOne(client, sql, vals);
    return row.id;
  }

  // Name-keyed (FDC) — conflict on idx_foods_system_name. Only system rows
  // (creator_id IS NULL) participate in the unique index.
  const sql = `
    INSERT INTO "foods" (${cols})
    VALUES (${placeholders})
    ON CONFLICT (LOWER("name"), COALESCE(LOWER("brand"), ''))
      WHERE "creator_id" IS NULL
    DO UPDATE SET ${buildUpdateClause(['barcode'])}
    RETURNING id
  `;
  const row = await queryOne(client, sql, vals);
  return row.id;
}

/**
 * Ensure a `(food_id, unit_id)` row exists with the given conversion factor.
 * Macros stored on `foods` are per 100g, so the default `g` unit has factor 1.
 */
async function ensureFoodUnit(client, foodId, unitName, conversionFactor) {
  const unitId = await ensureByName(client, 'units', unitName);
  const existing = await queryOne(
    client,
    `SELECT id, conversion_factor FROM "food_units"
     WHERE food_id = $1 AND unit_id = $2 LIMIT 1`,
    [foodId, unitId],
  );

  if (existing) {
    if (Number(existing.conversion_factor) !== Number(conversionFactor)) {
      await client.query(
        `UPDATE "food_units" SET conversion_factor = $2 WHERE id = $1`,
        [existing.id, conversionFactor],
      );
    }
    return existing.id;
  }

  const inserted = await queryOne(
    client,
    `INSERT INTO "food_units" (food_id, unit_id, conversion_factor)
     VALUES ($1, $2, $3) RETURNING id`,
    [foodId, unitId, conversionFactor],
  );
  return inserted.id;
}

module.exports = { upsertFood, ensureFoodUnit };
