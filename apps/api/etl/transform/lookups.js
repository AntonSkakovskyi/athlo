/**
 * Reference-data upserts (visibility_type, tracking_types, units, muscles,
 * equipments). All idempotent by name.
 */
const { ensureByName, queryOne } = require('../lib/db');
const { normalize } = require('../lib/normalize');

const VISIBILITY = ['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'];
const TRACKING_TYPES = ['WEIGHT_AND_REPS', 'REPS_ONLY', 'TIME_BASED', 'DISTANCE_AND_TIME'];
const UNITS = ['g', 'ml', 'pcs', 'cup', 'tbsp', 'tsp', 'oz'];

async function ensureCoreLookups(client) {
  for (const name of VISIBILITY) await ensureByName(client, 'visibility_type', name);
  for (const name of TRACKING_TYPES) await ensureByName(client, 'tracking_types', name);
  for (const name of UNITS) await ensureByName(client, 'units', name);
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
 * Upsert a muscle keyed by name (case-insensitive).
 */
async function upsertMuscle(client, { name }) {
  const existing = await queryOne(
    client,
    `SELECT id FROM "muscles" WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [name],
  );
  if (existing) return existing.id;
  const inserted = await queryOne(
    client,
    `INSERT INTO "muscles" ("name") VALUES ($1) RETURNING id`,
    [name],
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
