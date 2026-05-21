/**
 * Shared Postgres pool + small query helpers used by every ETL module.
 *
 * Kept deliberately tiny: the ETL is plain Node (CommonJS), no Nest bootstrap.
 * Same connection-string contract as `apps/api/seed.js`.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');

const sslDisabled = process.env.DATABASE_SSL === 'false';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslDisabled ? false : { rejectUnauthorized: false },
  max: 5,
});

/**
 * Return the first row of a query result, or null if no rows.
 */
async function queryOne(executor, sql, params = []) {
  const r = await executor.query(sql, params);
  return r.rows[0] || null;
}

/**
 * Lookup-by-name → insert-if-missing, returns id. Mirrors `nameId` from seed.js.
 */
async function ensureByName(executor, table, name) {
  const found = await queryOne(executor, `SELECT id FROM "${table}" WHERE name = $1 LIMIT 1`, [name]);
  if (found) return found.id;
  const inserted = await queryOne(
    executor,
    `INSERT INTO "${table}" (name) VALUES ($1) RETURNING id`,
    [name],
  );
  return inserted.id;
}

/**
 * Generic upsert by an arbitrary unique target. Used for entities with
 * (external_source, external_id) composite keys.
 *
 * @param {{query: Function}} executor pg client or pool
 * @param {string} table
 * @param {object} data column → value map
 * @param {string[]} conflictCols columns covered by the unique index
 * @param {string[]} updateCols columns to refresh on conflict (others stay untouched)
 */
async function upsert(executor, table, data, conflictCols, updateCols) {
  const cols = Object.keys(data);
  const vals = Object.values(data);
  const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
  const colList = cols.map((c) => `"${c}"`).join(', ');
  const conflictList = conflictCols.map((c) => `"${c}"`).join(', ');
  const updateClause = updateCols.length
    ? updateCols.map((c) => `"${c}" = EXCLUDED."${c}"`).join(', ')
    : null;

  const sql = updateClause
    ? `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})
       ON CONFLICT (${conflictList}) DO UPDATE SET ${updateClause}
       RETURNING id`
    : `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})
       ON CONFLICT (${conflictList}) DO NOTHING
       RETURNING id`;

  const r = await executor.query(sql, vals);
  if (r.rows[0]) return r.rows[0].id;

  // DO NOTHING path → fetch the existing id via the conflict target.
  const whereClause = conflictCols.map((c, i) => `"${c}" = $${i + 1}`).join(' AND ');
  const params = conflictCols.map((c) => data[c]);
  const existing = await queryOne(
    executor,
    `SELECT id FROM "${table}" WHERE ${whereClause} LIMIT 1`,
    params,
  );
  return existing ? existing.id : null;
}

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function close() {
  await pool.end();
}

module.exports = {
  pool,
  queryOne,
  ensureByName,
  upsert,
  withTransaction,
  close,
};
