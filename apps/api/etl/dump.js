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
const OFF_BASE = 'https://world.openfoodfacts.org';
const FDC_BASE = 'https://api.nal.usda.gov/fdc/v1';

const OFF_CATEGORIES = [
  'dairies',
  'cereals',
  'meats',
  'fruits',
  'vegetables',
  'snacks',
  'beverages',
];

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

async function dumpOff(limit, categories) {
  const http = createClient({ baseURL: OFF_BASE, minDelayMs: 4000, maxRetries: 4 });
  const targets = categories && categories.length ? categories : OFF_CATEGORIES;
  const target = limit || 50;
  const perCategory = Math.ceil(target / targets.length);
  const products = [];

  for (const category of targets) {
    let page = 1;
    while (products.length < target) {
      // No `fields` filter → full raw product objects (incl. complete nutriments).
      const data = await http.get('/api/v2/search', {
        page,
        page_size: 100,
        sort_by: 'unique_scans_n',
        countries_tags_en: 'united-states,united-kingdom,germany,france',
        categories_tags_en: category,
      });
      const batch = data?.products || [];
      if (batch.length === 0) break;
      products.push(...batch);
      process.stdout.write(`\r[off] fetched ${products.length}…`);
      if (products.length >= target) break;
      if (page * 100 >= perCategory) break;
      page += 1;
    }
    if (products.length >= target) break;
  }

  process.stdout.write('\n');
  return products.slice(0, target);
}

async function dumpFdc(limit, dataType) {
  const apiKey = process.env.USDA_FDC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'USDA_FDC_API_KEY missing in env — get one free at https://api.data.gov/signup',
    );
  }
  const http = createClient({ baseURL: FDC_BASE, minDelayMs: 4000, maxRetries: 4 });
  const types = dataType ? [dataType] : ['Foundation', 'SR Legacy'];
  const target = limit || 100;
  const foods = [];

  for (const dt of types) {
    let page = 1;
    while (foods.length < target) {
      const data = await http.get('/foods/search', {
        api_key: apiKey,
        dataType: dt,
        pageSize: 200,
        pageNumber: page,
      });
      const batch = data?.foods || [];
      if (batch.length === 0) break;
      foods.push(...batch);
      process.stdout.write(`\r[fdc] fetched ${foods.length}…`);
      if (foods.length >= target) break;
      if (batch.length < 200) break;
      page += 1;
    }
    if (foods.length >= target) break;
  }

  process.stdout.write('\n');
  return foods.slice(0, target);
}

// --- runner ----------------------------------------------------------------

const SOURCES = {
  wger: { file: 'wger.raw.json', run: (o) => dumpWger(o.limit ?? 300) },
  exercisedb: { file: 'exercisedb.raw.json', run: (o) => dumpExerciseDb(o.limit) },
  off: { file: 'off.raw.json', run: (o) => dumpOff(o.limit ?? 50, o.categories) },
  fdc: { file: 'fdc.raw.json', run: (o) => dumpFdc(o.limit ?? 100, o.dataType) },
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

  --source=<wger|exercisedb|off|fdc>   dump a single source (default: all)
  --limit=N                             cap items per source
  --categories=a,b,c                    OFF: comma-separated category tags
  --datatype=Foundation|SR%20Legacy     FDC dataType filter
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
  const categories =
    typeof args.categories === 'string'
      ? args.categories.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;
  const dataType = typeof args.datatype === 'string' ? args.datatype : undefined;
  const outDir =
    typeof args['out-dir'] === 'string'
      ? path.resolve(args['out-dir'])
      : path.join(__dirname, 'dumps');

  const options = { limit, categories, dataType };
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
