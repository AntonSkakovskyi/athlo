/**
 * Incremental JSON dump store.
 *
 * Each ETL source can checkpoint its progress to disk *before* it touches the
 * DB so a failure (DB error, network blip, OOM) doesn't lose data already
 * pulled from a rate-limited or quota-bound API. On re-run the source loads
 * the dump and skips the items it already has — the API quota is precious.
 *
 * Atomic writes: payload is written to `<file>.tmp` then renamed over the
 * target so a crash mid-write can't leave a half-flushed file.
 */
const fs = require('fs');
const path = require('path');

const DUMPS_DIR = path.join(__dirname, '..', 'dumps');

function dumpPath(name) {
  return path.join(DUMPS_DIR, name);
}

function load(name, fallback = null) {
  try {
    const raw = fs.readFileSync(dumpPath(name), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

function save(name, data) {
  fs.mkdirSync(DUMPS_DIR, { recursive: true });
  const target = dumpPath(name);
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, target);
}

/**
 * Build a checkpoint helper for an array-shaped dump.
 *
 *   const cp = checkpoint('spoonacular.foods.json');
 *   cp.append(item);            // pushes + flushes (debounced)
 *   cp.flush();                 // force write now
 *   cp.items;                   // current in-memory list
 *
 * `flushEvery` debounces writes so we don't hit the disk on every push when
 * fetches are fast (still flushes on errors via `flush()`).
 */
function checkpoint(name, { flushEvery = 1 } = {}) {
  const items = load(name, []) || [];
  let dirty = 0;

  function flush() {
    if (dirty === 0) return;
    save(name, items);
    dirty = 0;
  }

  function append(item) {
    items.push(item);
    dirty += 1;
    if (dirty >= flushEvery) flush();
  }

  function reset() {
    items.length = 0;
    dirty = 1;
    flush();
  }

  return {
    get items() { return items; },
    append,
    flush,
    reset,
  };
}

module.exports = { load, save, checkpoint, dumpPath, DUMPS_DIR };
