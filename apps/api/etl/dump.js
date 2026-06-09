#!/usr/bin/env node
/**
 * Athlo ETL — raw dump.
 *
 * Fetches the RAW payloads from each public API and writes them, untouched, to
 * JSON files (one per source). No transforms, no DB writes — handy for
 * inspecting the full response shape before deciding what the ETL should keep.
 *
 * Output: <out-dir>/<source>.raw.json  (default out-dir: apps/api/etl/dumps)
 *
 * Usage:
 *   node apps/api/etl/dump.js                          # all sources, default limits
 *   node apps/api/etl/dump.js --source=off --limit=50
 *   node apps/api/etl/dump.js --source=fdc --datatype=Foundation --limit=100
 *   node apps/api/etl/dump.js --out-dir=./tmp/dumps
 *
 * Notes:
 *   - OFF/FDC are rate-limited (4s between requests) — keep limits small.
 *   - FDC needs USDA_FDC_API_KEY in apps/api/.env (free at api.data.gov/signup).
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('./lib/http');

// --- endpoint config (kept in sync with sources/*.js) ----------------------

const WGER_BASE = 'https://wger.de/api/v2';
const EXERCISEDB_BASE = process.env.EXERCISEDB_BASE_URL || 'https://exercisedb-api.vercel.app';
const SPOON_BASE = 'https://api.spoonacular.com';

// --- per-source raw fetchers -----------------------------------------------

async function dumpWger(limit) {
  const http = createClient({ baseURL: WGER_BASE, minDelayMs: 500, maxRetries: 4 });
  const results = [];
  let url = `/exerciseinfo/?language=2&status=2&limit=100`;
  while (url) {
    const data = await http.get(url);
    if (!data || !Array.isArray(data.results)) break;
    results.push(...data.results);
    process.stdout.write(`\r[wger] fetched ${results.length}…`);
    if (limit && results.length >= limit) {
      results.length = limit;
      break;
    }
    if (!data.next) break;
    url = data.next.replace(WGER_BASE, '');
  }
  process.stdout.write('\n');
  return results;
}

async function dumpExerciseDb(limit) {
  const http = createClient({ baseURL: EXERCISEDB_BASE, minDelayMs: 100, maxRetries: 4 });
  const tries = [
    { path: '/api/v1/exercises', extract: (d) => d?.data?.exercises ?? d?.data ?? d },
    { path: '/exercises', extract: (d) => d },
  ];
  let lastErr;
  for (const t of tries) {
    try {
      console.log(`[exercisedb] GET ${EXERCISEDB_BASE}${t.path}`);
      const body = await http.get(t.path);
      const arr = t.extract(body);
      if (Array.isArray(arr) && arr.length) return limit ? arr.slice(0, limit) : arr;
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(
    `Could not fetch ExerciseDB catalog: ${lastErr?.message || 'no array payload found'}`,
  );
}

async function dumpSpoonacular(limit) {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    throw new Error(
      'SPOONACULAR_API_KEY missing in env — get one free at https://spoonacular.com/food-api',
    );
  }
  const http = createClient({ baseURL: SPOON_BASE, minDelayMs: 1100, maxRetries: 3 });
  const { INGREDIENTS, DISH_QUERIES } = require('./sources/spoonacular');
  const target = limit || 12;
  const out = [];

  // A few raw ingredient payloads.
  for (const name of INGREDIENTS) {
    if (out.length >= target) break;
    const search = await http.get('/food/ingredients/search', { apiKey, query: name, number: 1 });
    const hit = search?.results?.[0];
    if (!hit) continue;
    const info = await http.get(`/food/ingredients/${hit.id}/information`, {
      apiKey, amount: 100, unit: 'grams',
    });
    out.push({ kind: 'ingredient', query: name, search: hit, info });
    process.stdout.write(`\r[spoonacular] fetched ${out.length}…`);
  }

  // A couple of raw recipe payloads.
  for (const query of DISH_QUERIES) {
    if (out.length >= target * 1.5) break;
    const data = await http.get('/recipes/complexSearch', {
      apiKey, query, number: 1, addRecipeNutrition: true,
    });
    if (data?.results?.[0]) out.push({ kind: 'dish', query, recipe: data.results[0] });
    process.stdout.write(`\r[spoonacular] fetched ${out.length}…`);
  }

  process.stdout.write('\n');
  return out;
}

// --- runner ----------------------------------------------------------------

const SOURCES = {
  wger: { file: 'wger.raw.json', run: (o) => dumpWger(o.limit ?? 300) },
  exercisedb: { file: 'exercisedb.raw.json', run: (o) => dumpExerciseDb(o.limit) },
  spoonacular: { file: 'spoonacular.raw.json', run: (o) => dumpSpoonacular(o.limit) },
};

function parseArgs(argv) {
  const args = {};
  for (const raw of argv.slice(2)) {
    if (!raw.startsWith('--')) continue;
    const eq = raw.indexOf('=');
    const key = eq === -1 ? raw.slice(2) : raw.slice(2, eq);
    args[key] = eq === -1 ? true : raw.slice(eq + 1);
  }
  return args;
}

function toInt(value, fallback) {
  if (value == null || value === true) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function writeJson(outDir, name, data) {
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

function help() {
  console.log(`Athlo ETL — raw dump

  --source=<wger|exercisedb|spoonacular>   dump a single source (default: all)
  --limit=N                             cap items per source
  --out-dir=<path>                      output folder (default: etl/dumps)
  --help                                this message
`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    help();
    return;
  }

  const limit = toInt(args.limit, undefined);
  const outDir =
    typeof args['out-dir'] === 'string'
      ? path.resolve(args['out-dir'])
      : path.join(__dirname, 'dumps');

  const options = { limit };
  const selected = args.source ? [String(args.source)] : Object.keys(SOURCES);

  console.log(`[dump] sources: ${selected.join(', ')} → ${outDir}`);

  for (const source of selected) {
    const spec = SOURCES[source];
    if (!spec) {
      console.error(`[dump] unknown source: ${source}`);
      process.exitCode = 1;
      continue;
    }
    console.log(`\n[dump] === ${source} ===`);
    try {
      const data = await spec.run(options);
      const file = writeJson(outDir, spec.file, data);
      console.log(`[dump] ${source}: wrote ${data.length} items → ${file}`);
    } catch (err) {
      console.error(`[dump] ${source} failed:`, err.message);
      process.exitCode = 1;
    }
  }

  console.log('\n[dump] done');
}

main().catch((err) => {
  console.error('[dump] fatal:', err);
  process.exitCode = 1;
});
