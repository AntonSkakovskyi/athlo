/**
 * Reference-data upserts (visibility_type, tracking_types, exercise_categories,
 * units, muscles, equipments). All idempotent by name.
 */
const { ensureByName, queryOne } = require('../lib/db');
const { normalize } = require('../lib/normalize');

const VISIBILITY = ['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'];
const TRACKING_TYPES = ['WEIGHT_AND_REPS', 'REPS_ONLY', 'TIME_BASED', 'DISTANCE_AND_TIME'];
const UNITS = ['g', 'ml', 'pcs', 'cup', 'tbsp', 'tsp', 'oz'];
const CATEGORIES = ['Cardio', 'Legs', 'Chest', 'Arms', 'Abs', 'Back', 'Shoulders'];

async function ensureCoreLookups(client) {
  for (const name of VISIBILITY) await ensureByName(client, 'visibility_type', name);
  for (const name of TRACKING_TYPES) await ensureByName(client, 'tracking_types', name);
  for (const name of UNITS) await ensureByName(client, 'units', name);
  for (const name of CATEGORIES) await ensureByName(client, 'exercise_categories', name);
}

/**
 * Load a {normalized name → id} map from a single-name lookup table.
 */
async function loadNameIndex(client, table) {
  const r = await client.query(`SELECT id, name FROM "${table}"`);
  const map = new Map();
  for (const row of r.rows) map.set(normalize(row.name), row.id);
  return map;
}

/**
 * Look up by normalized name, otherwise INSERT and remember in the cache.
 */
async function ensureLookupByName(client, table, name, cache) {
  const key = normalize(name);
  if (cache.has(key)) return cache.get(key);
  const id = await ensureByName(client, table, name);
  cache.set(key, id);
  return id;
}

/**
 * Upsert a muscle keyed by name (case-insensitive). If a row already exists,
 * fill in any null metadata fields (name_en, image_url, image_url_secondary)
 * but never overwrite values a user/admin may have edited.
 */
async function upsertMuscle(client, { name, nameEn, imageUrl, imageUrlSecondary }) {
  const existing = await queryOne(
    client,
    `SELECT id FROM "muscles" WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [name],
  );
  if (existing) {
    await client.query(
      `UPDATE "muscles"
       SET "name_en" = COALESCE("name_en", $2),
           "image_url" = COALESCE("image_url", $3),
           "image_url_secondary" = COALESCE("image_url_secondary", $4)
       WHERE id = $1`,
      [existing.id, nameEn, imageUrl, imageUrlSecondary],
    );
    return existing.id;
  }
  const inserted = await queryOne(
    client,
    `INSERT INTO "muscles" ("name", "name_en", "image_url", "image_url_secondary")
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [name, nameEn, imageUrl, imageUrlSecondary],
  );
  return inserted.id;
}

/**
 * Upsert equipment by name (case-insensitive). Returns id.
 */
async function upsertEquipment(client, { name }) {
  const existing = await queryOne(
    client,
    `SELECT id FROM "equipments" WHERE LOWER(name) = LOWER($1) AND user_id IS NULL LIMIT 1`,
    [name],
  );
  if (existing) return existing.id;
  const inserted = await queryOne(
    client,
    `INSERT INTO "equipments" ("name") VALUES ($1) RETURNING id`,
    [name],
  );
  return inserted.id;
}

module.exports = {
  ensureCoreLookups,
  ensureLookupByName,
  loadNameIndex,
  upsertMuscle,
  upsertEquipment,
};
