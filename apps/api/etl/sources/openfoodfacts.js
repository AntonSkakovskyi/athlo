/**
 * Open Food Facts loader.
 *
 * Search endpoint (default — small batches, rate-limited):
 *   GET https://world.openfoodfacts.org/api/v2/search
 *       ?fields=...&page_size=100&page=N
 *       &categories_tags_en=<tag>  (when --categories passed)
 *
 * For ≥1000 products switch to the JSONL dump (`openfoodfacts-products.jsonl.gz`).
 * That path is left as a TODO behind the `--dump` flag — not needed for demo.
 *
 * Politeness:
 *   - User-Agent header (Athlo-ETL/0.1; contact email)
 *   - 4s min delay between requests (≤ 15 req/min)
 */
const { createClient } = require('../lib/http');
const { withTransaction } = require('../lib/db');
const { upsertFood, ensureFoodUnit } = require('../transform/food');

const OFF_BASE = 'https://world.openfoodfacts.org';
const FIELDS = [
  'code',
  'product_name',
  'product_name_en',
  'brands',
  'image_url',
  'image_front_small_url',
  'image_front_url',
  'nutriments',
  'serving_quantity',
  'serving_size',
  'nova_group',
  'nutriscore_grade',
].join(',');

const http = createClient({
  baseURL: OFF_BASE,
  minDelayMs: 4000,
  maxRetries: 4,
});

const DEFAULT_CATEGORIES = [
  'dairies',
  'cereals',
  'meats',
  'fruits',
  'vegetables',
  'snacks',
  'beverages',
];

function pickName(p) {
  const n = (p.product_name_en || p.product_name || '').trim();
  return n.length >= 2 && n.length <= 200 ? n : null;
}

function pickImage(p) {
  return p.image_front_url || p.image_url || p.image_front_small_url || null;
}

function pickBrand(p) {
  if (!p.brands) return null;
  const first = String(p.brands).split(',')[0].trim();
  return first || null;
}

function pickServingSize(p) {
  const n = Number(p.serving_quantity);
  if (Number.isFinite(n) && n > 0) return n;
  return null;
}

function pickNutriment(p, key) {
  const n = Number(p.nutriments?.[key]);
  return Number.isFinite(n) ? n : null;
}

/**
 * Decide if a product is good enough to import. We require all 4 macros to be
 * present (calories may be 0 for water-like items, but they must be defined).
 */
function isValid(p, mapped) {
  if (!mapped.name) return false;
  if (!Number.isFinite(mapped.calories)) return false;
  if (!Number.isFinite(mapped.proteins)) return false;
  if (!Number.isFinite(mapped.fats)) return false;
  if (!Number.isFinite(mapped.carbs)) return false;
  // Reject obviously bogus rows.
  if (mapped.calories < 0 || mapped.calories > 1000) return false;
  return true;
}

function mapProduct(p) {
  return {
    name: pickName(p),
    brand: pickBrand(p),
    calories: pickNutriment(p, 'energy-kcal_100g'),
    proteins: pickNutriment(p, 'proteins_100g'),
    fats: pickNutriment(p, 'fat_100g'),
    carbs: pickNutriment(p, 'carbohydrates_100g'),
    fiber: pickNutriment(p, 'fiber_100g'),
    sugar: pickNutriment(p, 'sugars_100g'),
    // OFF stores sodium in grams per 100g; convert to mg.
    sodiumMg: (() => {
      const s = pickNutriment(p, 'sodium_100g');
      return s == null ? null : Math.round(s * 1000 * 100) / 100;
    })(),
    servingSizeG: pickServingSize(p),
    imageUrl: pickImage(p),
    barcode: p.code ? String(p.code) : null,
  };
}

async function fetchSearchPage({ category, page, pageSize }) {
  const params = {
    page,
    page_size: pageSize,
    fields: FIELDS,
    sort_by: 'unique_scans_n',
    countries_tags_en: 'united-states,united-kingdom,germany,france',
  };
  if (category) params.categories_tags_en = category;
  return http.get('/api/v2/search', params);
}

async function run({ limit, dryRun, categories }) {
  const targets = (categories && categories.length ? categories : DEFAULT_CATEGORIES);
  const perCategory = limit
    ? Math.ceil(limit / targets.length)
    : Math.ceil(2000 / targets.length);

  const collected = [];

  for (const category of targets) {
    console.log(`[off] category=${category} fetching up to ${perCategory}…`);
    let page = 1;
    while (collected.length < (limit || Infinity)) {
      const data = await fetchSearchPage({ category, page, pageSize: 100 });
      const products = data?.products || [];
      if (products.length === 0) break;

      for (const p of products) {
        const mapped = mapProduct(p);
        if (!isValid(p, mapped)) continue;
        collected.push(mapped);
        if (limit && collected.length >= limit) break;
      }

      const taken = (page) * 100;
      if (taken >= perCategory) break;
      if (limit && collected.length >= limit) break;
      page += 1;
    }
    if (limit && collected.length >= limit) break;
  }

  console.log(`[off] valid products collected: ${collected.length}`);

  if (dryRun) {
    for (const food of collected.slice(0, 5)) {
      console.log(`  · ${food.name}  brand=${food.brand || '-'}  kcal=${food.calories}  barcode=${food.barcode}`);
    }
    return;
  }

  let written = 0;
  await withTransaction(async (client) => {
    for (const food of collected) {
      const id = await upsertFood(client, food);
      await ensureFoodUnit(client, id, 'g', 1);
      written += 1;
      if (written % 100 === 0) process.stdout.write(`\r[off] upserted ${written}/${collected.length}…`);
    }
  });
  process.stdout.write('\n');
  console.log(`[off] done. upserted=${written}`);
}

module.exports = { run };
