/**
 * ExerciseDB loader — fetches its full exercise catalog (~5000 entries with
 * gifUrl + instructions) and matches each onto the existing system-owned rows
 * in `exercises` by normalized name. Updates `gif_url` (and `instructions`
 * where still null) on match.
 *
 *   GET https://exercisedb-api.vercel.app/api/v1/exercises   (public mirror)
 *
 * Endpoint can be overridden via EXERCISEDB_BASE_URL (e.g. for self-hosting).
 */
const { createClient } = require('../lib/http');
const { pool } = require('../lib/db');
const { normalize, levenshtein } = require('../lib/normalize');
const { setGifAndInstructions } = require('../transform/exercise');

const DEFAULT_BASE = process.env.EXERCISEDB_BASE_URL || 'https://exercisedb-api.vercel.app';

const http = createClient({
  baseURL: DEFAULT_BASE,
  minDelayMs: 100,
  maxRetries: 4,
});

async function fetchAllRaw() {
  const tries = [
    { path: '/api/v1/exercises', extract: (d) => (d?.data?.exercises ?? d?.data ?? d) },
    { path: '/exercises', extract: (d) => d },
  ];

  let lastErr;
  for (const t of tries) {
    try {
      console.log(`[exercisedb] GET ${DEFAULT_BASE}${t.path}`);
      const body = await http.get(t.path);
      const arr = t.extract(body);
      if (Array.isArray(arr) && arr.length) return arr;
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(
    `Could not fetch ExerciseDB catalog: ${lastErr?.message || 'no array payload found'}`,
  );
}

function flattenInstructions(instructions) {
  if (!instructions) return null;
  if (Array.isArray(instructions)) {
    return instructions
      .map((s) => String(s).trim())
      .filter(Boolean)
      .map((s, i) => `${i + 1}. ${s}`)
      .join('\n');
  }
  return String(instructions).trim() || null;
}

function pickName(item) {
  return item.name || item.exerciseName || null;
}

function pickGif(item) {
  return item.gifUrl || item.gif_url || item.gif || null;
}

/**
 * Build a lookup of system-owned exercises currently in the DB.
 */
async function loadSystemExercises() {
  const r = await pool.query(
    `SELECT id, name, gif_url, instructions
     FROM exercises
     WHERE user_id IS NULL`,
  );
  const exact = new Map();
  const list = [];
  for (const row of r.rows) {
    const key = normalize(row.name);
    list.push({ id: row.id, name: row.name, norm: key });
    if (!exact.has(key)) exact.set(key, row.id);
  }
  return { exact, list };
}

function findBestMatch(norm, exact, list) {
  if (exact.has(norm)) return exact.get(norm);
  let bestId = null;
  let bestDist = 4;
  for (const cand of list) {
    if (Math.abs(cand.norm.length - norm.length) > bestDist) continue;
    const d = levenshtein(cand.norm, norm, bestDist);
    if (d < bestDist) {
      bestDist = d;
      bestId = cand.id;
    }
  }
  return bestId;
}

async function run({ dryRun, limit }) {
  const raw = await fetchAllRaw();
  console.log(`[exercisedb] received ${raw.length} items`);

  const items = limit ? raw.slice(0, limit) : raw;

  const { exact, list } = await loadSystemExercises();
  console.log(`[exercisedb] system exercises in DB: ${list.length}`);

  let matched = 0;
  let updated = 0;

  for (const item of items) {
    const name = pickName(item);
    const gif = pickGif(item);
    if (!name || !gif) continue;
    const norm = normalize(name);
    const exerciseId = findBestMatch(norm, exact, list);
    if (!exerciseId) continue;

    matched += 1;
    if (dryRun) continue;

    const instructions = flattenInstructions(item.instructions);
    await setGifAndInstructions(pool, exerciseId, gif, instructions);
    updated += 1;
  }

  console.log(
    `[exercisedb] done. matched=${matched}/${items.length}  updated=${updated}${dryRun ? ' (dry-run)' : ''}`,
  );
}

module.exports = { run };
