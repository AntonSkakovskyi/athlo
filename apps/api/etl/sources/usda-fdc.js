/**
 * USDA FoodData Central loader.
 *
 *   GET https://api.nal.usda.gov/fdc/v1/foods/search?dataType=Foundation,SR%20Legacy
 *
 * Auth: data.gov API key in USDA_FDC_API_KEY. Rate limit: 1000 req/hr.
 *
 * Nutrient ids we read:
 *   1008  Energy (kcal)
 *   1003  Protein (g)
 *   1004  Total fat (g)
 *   1005  Carbohydrate by difference (g)
 */
const { createClient } = require('../lib/http');
const { withTransaction } = require('../lib/db');
const { upsertFood, ensureNutritionFact } = require('../transform/food');

const FDC_BASE = 'https://api.nal.usda.gov/fdc/v1';
const PAGE_SIZE = 200;

const NUTRIENT_IDS = {
  calories: 1008,
  proteins: 1003,
  fats: 1004,
  carbs: 1005,
};

function getKey() {
  const key = process.env.USDA_FDC_API_KEY;
  if (!key) {
    throw new Error(
      'USDA_FDC_API_KEY missing in env — get one free at https://api.data.gov/signup',
    );
  }
  return key;
}

const http = createClient({
  baseURL: FDC_BASE,
  minDelayMs: 4000, // ≤ 900 req/hour to stay well under the 1000/hr cap
  maxRetries: 4,
});

function nutrient(food, nutrientId) {
  const n = (food.foodNutrients || []).find((f) => f.nutrientId === nutrientId);
  if (!n) return null;
  const v = Number(n.value);
  return Number.isFinite(v) ? v : null;
}

function mapFood(food) {
  return {
    name: (food.description || '').trim() || null,
    brand: null,
    calories: nutrient(food, NUTRIENT_IDS.calories),
    proteins: nutrient(food, NUTRIENT_IDS.proteins),
    fats: nutrient(food, NUTRIENT_IDS.fats),
    carbs: nutrient(food, NUTRIENT_IDS.carbs),
    imageUrl: null,
  };
}

function isValid(food) {
  if (!food.name) return false;
  if (!Number.isFinite(food.calories)) return false;
  if (food.calories < 0 || food.calories > 1000) return false;
  return Number.isFinite(food.proteins) || Number.isFinite(food.fats) || Number.isFinite(food.carbs);
}

async function run({ limit, dryRun, dataType }) {
  const apiKey = getKey();
  const types = dataType ? [dataType] : ['Foundation', 'SR Legacy'];
  const target = limit || 300;
  const collected = [];

  for (const dt of types) {
    let page = 1;
    while (collected.length < target) {
      const data = await http.get('/foods/search', {
        api_key: apiKey,
        dataType: dt,
        pageSize: PAGE_SIZE,
        pageNumber: page,
      });
      const foods = data?.foods || [];
      if (foods.length === 0) break;

      for (const food of foods) {
        const mapped = mapFood(food);
        if (!isValid(mapped)) continue;
        collected.push(mapped);
        if (collected.length >= target) break;
      }
      if (foods.length < PAGE_SIZE) break;
      page += 1;
    }
    if (collected.length >= target) break;
  }

  console.log(`[fdc] collected ${collected.length} foods`);

  if (dryRun) {
    for (const f of collected.slice(0, 5)) {
      console.log(`  · ${f.name}  kcal=${f.calories}`);
    }
    return;
  }

  let written = 0;
  const { buildPayload } = require('../transform/food');
  await withTransaction(async (client) => {
    for (const food of collected) {
      const id = await upsertFood(client, food);
      const data = buildPayload(food);
      // Store exactly as it comes (per 100g)
      await ensureNutritionFact(client, id, 'g', {
        amount: 100,
        calories: data.calories,
        proteins: data.proteins,
        fats: data.fats,
        carbs: data.carbs,
      });
      written += 1;
      if (written % 100 === 0) process.stdout.write(`\r[fdc] upserted ${written}/${collected.length}…`);
    }
  });
  process.stdout.write('\n');
  console.log(`[fdc] done. upserted=${written}`);
}

module.exports = { run };
