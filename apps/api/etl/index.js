#!/usr/bin/env node
/**
 * Athlo ETL — pulls exercises + foods from free public APIs into the Athlo DB.
 *
 * Usage:
 *   node apps/api/etl/index.js --source=wger --limit=850
 *   node apps/api/etl/index.js --source=spoonacular
 *   node apps/api/etl/index.js --all
 *   node apps/api/etl/index.js --all --dry-run
 *
 * Idempotent: re-running any command does not create duplicates.
 */
const db = require('./lib/db');
const lookups = require('./transform/lookups');
const wger = require('./sources/wger');
const spoonacular = require('./sources/spoonacular');

function parseArgs(argv) {
  const args = {};
  for (const raw of argv.slice(2)) {
    if (!raw.startsWith('--')) continue;
    const eq = raw.indexOf('=');
    const key = eq === -1 ? raw.slice(2) : raw.slice(2, eq);
    const value = eq === -1 ? true : raw.slice(eq + 1);
    args[key] = value;
  }
  return args;
}

function toInt(value, fallback) {
  if (value == null || value === true) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function help() {
  console.log(`Athlo ETL

  --source=<wger|spoonacular>           pick a single source
  --all                                 run every source in order
  --limit=N                             cap items fetched (per source)
  --dry-run                             fetch + transform, skip DB writes
  --from-dump                           skip API, load from etl/dumps/ instead
  --help                                this message
`);
}

async function runSource(source, options) {
  switch (source) {
    case 'wger':
      return wger.run(options);
    case 'spoonacular':
      return spoonacular.run(options);
    default:
      throw new Error(`Unknown source: ${source}`);
  }
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    help();
    return;
  }

  const dryRun = Boolean(args['dry-run']);
  const fromDump = Boolean(args['from-dump']);
  const limit = toInt(args.limit, undefined);

  const baseOptions = { dryRun, limit, fromDump };

  console.log(`[etl] starting${dryRun ? ' (dry-run)' : ''}`);

  // Reference lookups (visibility/tracking_types/units) — required by every source.
  if (!dryRun) {
    await db.withTransaction((client) => lookups.ensureCoreLookups(client));
  }

  if (args.all) {
    for (const source of ['wger', 'spoonacular']) {
      console.log(`\n[etl] === ${source} ===`);
      try {
        await runSource(source, baseOptions);
      } catch (err) {
        console.error(`[etl] ${source} failed:`, err.message);
        process.exitCode = 1;
      }
    }
  } else if (args.source) {
    await runSource(String(args.source), {
      ...baseOptions,
      enrichGifs: Boolean(args['enrich-gifs']),
    });
  } else {
    help();
    return;
  }

  console.log('\n[etl] done');
}

main()
  .catch((err) => {
    console.error('[etl] fatal:', err);
    process.exitCode = 1;
  })
  .finally(() => db.close());
