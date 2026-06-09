/**
 * Spoonacular loader — high-quality, photo-rich foods for the demo.
 *
 * Two kinds of `foods` rows are produced, both with macros stored per 100 g in
 * `nutrition_facts` so the mobile app's gram-based calorie math stays uniform:
 *
 *   1. INGREDIENTS — whole foods (chicken breast, oats, banana…). Macros come
 *      back already per-100g from `/food/ingredients/{id}/information?amount=100`.
 *      Stored with `brand = NULL`.
 *
 *   2. DISHES («страви») — composite recipes (greek salad, poke bowl…). The API
 *      returns per-serving nutrition + `weightPerServing`; we normalise to
 *      per-100g. Stored with `brand = 'Dish'` so the seed/UI can tell them apart
 *      from raw ingredients (and so a dish never collides with an ingredient of
 *      the same name in `idx_foods_system_name`).
 *
 * Env: SPOONACULAR_API_KEY (free at https://spoonacular.com/food-api).
 *
 * Free tier = 150 points/day. Endpoints are cheap (ingredient info ~1 pt, recipe
 * search ~1 pt) but a full run sits close to the cap, so:
 *   - already-imported ingredients are skipped *before* spending an API call
 *     (a re-run the next day resumes where the quota stopped), and
 *   - a 402 ("quota exhausted") is treated as a clean stop: whatever was
 *     collected so far is still written.
 */
const { pool, withTransaction } = require('../lib/db');
const { createClient } = require('../lib/http');
const { upsertFood, ensureNutritionFact, validateMacros } = require('../transform/food');

const SPOON_BASE = 'https://api.spoonacular.com';
const IMG_BASE = 'https://img.spoonacular.com';

// Sentinel thrown when the daily point quota is exhausted (HTTP 402).
class QuotaExhausted extends Error {}

// ── Curated catalogs ─────────────────────────────────────────────────────────
// Canonical display names double as the seed's lookup keys, so keep them stable.
const INGREDIENTS = [
  // Proteins
  'Chicken Breast', 'Chicken Thigh', 'Turkey Breast', 'Lean Ground Beef', 'Beef Steak',
  'Pork Chop', 'Salmon', 'Tuna', 'Cod', 'Shrimp', 'Eggs', 'Egg White', 'Tofu', 'Tempeh',
  'Greek Yogurt', 'Cottage Cheese',
  // Grains & starches
  'White Rice', 'Brown Rice', 'Quinoa', 'Oats', 'Whole Wheat Bread', 'Pasta', 'Sweet Potato',
  'Potato', 'Couscous', 'Buckwheat', 'Rice Cakes', 'Bagel', 'Tortilla',
  // Legumes
  'Lentils', 'Chickpeas', 'Black Beans', 'Kidney Beans', 'Green Peas', 'Edamame',
  // Vegetables
  'Broccoli', 'Spinach', 'Kale', 'Asparagus', 'Green Beans', 'Bell Pepper', 'Carrot',
  'Cucumber', 'Tomato', 'Zucchini', 'Cauliflower', 'Mushroom', 'Onion', 'Avocado',
  'Brussels Sprouts', 'Lettuce', 'Cabbage', 'Beetroot',
  // Fruits
  'Banana', 'Apple', 'Orange', 'Strawberries', 'Blueberries', 'Raspberries', 'Grapes',
  'Pineapple', 'Mango', 'Watermelon', 'Pear', 'Kiwi', 'Peach', 'Pomegranate',
  // Dairy & fats
  'Milk', 'Cheddar Cheese', 'Mozzarella', 'Butter', 'Olive Oil', 'Coconut Oil',
  'Almond Milk', 'Feta Cheese',
  // Nuts & seeds
  'Almonds', 'Walnuts', 'Cashews', 'Peanut Butter', 'Almond Butter', 'Chia Seeds',
  'Flax Seeds', 'Sunflower Seeds', 'Pumpkin Seeds',
  // Other staples
  'Honey', 'Dark Chocolate', 'Hummus', 'Granola',
];

const DISH_QUERIES = [
  'oatmeal', 'greek salad', 'caesar salad', 'grilled chicken breast', 'chicken stir fry',
  'beef stir fry', 'baked salmon', 'sushi roll', 'poke bowl', 'burrito bowl', 'chicken curry',
  'pad thai', 'spaghetti bolognese', 'lasagna', 'margherita pizza', 'cheeseburger',
  'club sandwich', 'avocado toast', 'pancakes', 'omelette', 'protein smoothie',
  'smoothie bowl', 'overnight oats', 'chicken wrap', 'falafel', 'shakshuka', 'beef tacos',
  'risotto', 'minestrone soup', 'tomato soup', 'chicken noodle soup', 'quinoa salad',
  'cobb salad', 'tuna salad', 'mac and cheese', 'egg fried rice', 'chili con carne',
  'ramen', 'butter chicken', 'shepherds pie',
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeClient() {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    throw new Error(
      'SPOONACULAR_API_KEY missing in env — get one free at https://spoonacular.com/food-api',
    );
  }
  // 1 req/s is well within free-tier limits and polite.
  const http = createClient({ baseURL: SPOON_BASE, minDelayMs: 1100, maxRetries: 3 });
  return { http, apiKey };
}

function isQuotaError(err) {
  return err?.response?.status === 402;
}

function nutrientAmount(nutrients, name) {
  const hit = (nutrients || []).find((n) => n.name === name);
  if (!hit) return null;
  const v = Number(hit.amount);
  return Number.isFinite(v) ? v : null;
}

async function ingredientExists(name) {
  const r = await pool.query(
    `SELECT 1 FROM foods WHERE LOWER(name) = LOWER($1) AND brand IS NULL AND creator_id IS NULL LIMIT 1`,
    [name],
  );
  return r.rowCount > 0;
}

// ── Extract ──────────────────────────────────────────────────────────────────
async function fetchIngredient(http, apiKey, name) {
  const search = await http.get('/food/ingredients/search', { apiKey, query: name, number: 1 });
  const hit = search?.results?.[0];
  if (!hit) return null;

  const info = await http.get(`/food/ingredients/${hit.id}/information`, {
    apiKey,
    amount: 100,
    unit: 'grams',
  });
  const nutrients = info?.nutrition?.nutrients || [];
  const image = hit.image || info.image;

  return {
    name, // keep our canonical name for stable seed lookups
    brand: null,
    imageUrl: image ? `${IMG_BASE}/ingredients_250x250/${image}` : null,
    calories: nutrientAmount(nutrients, 'Calories'),
    proteins: nutrientAmount(nutrients, 'Protein'),
    fats: nutrientAmount(nutrients, 'Fat'),
    carbs: nutrientAmount(nutrients, 'Carbohydrates'),
  };
}

async function fetchDishes(http, apiKey, query, number) {
  const data = await http.get('/recipes/complexSearch', {
    apiKey,
    query,
    number,
    addRecipeNutrition: true,
    instructionsRequired: true,
  });
  const out = [];
  for (const r of data?.results || []) {
    const nutrition = r.nutrition || {};
    const grams = Number(nutrition.weightPerServing?.amount);
    if (!Number.isFinite(grams) || grams <= 0) continue; // can't normalise to per-100g

    const factor = 100 / grams;
    const perServing = (n) => {
      const v = nutrientAmount(nutrition.nutrients, n);
      return v == null ? null : Math.round(v * factor * 100) / 100;
    };

    out.push({
      name: String(r.title || '').trim(),
      brand: 'Dish',
      imageUrl: r.image || null,
      calories: perServing('Calories'),
      proteins: perServing('Protein'),
      fats: perServing('Fat'),
      carbs: perServing('Carbohydrates'),
    });
  }
  return out;
}

// ── Load ─────────────────────────────────────────────────────────────────────
async function writeFoods(foods) {
  let written = 0;
  await withTransaction(async (client) => {
    for (const food of foods) {
      const id = await upsertFood(client, food);
      await ensureNutritionFact(client, id, 'g', {
        amount: 100,
        calories: food.calories,
        proteins: food.proteins,
        fats: food.fats,
        carbs: food.carbs,
      });
      written += 1;
    }
  });
  return written;
}

async function run({ limit, dryRun } = {}) {
  const { http, apiKey } = makeClient();
  const cap = Number.isFinite(limit) ? limit : Infinity;
  const collected = [];
  let quota = false;

  // 1) Ingredients — skip ones already in the DB so a re-run resumes past quota.
  for (const name of INGREDIENTS) {
    if (collected.length >= cap) break;
    if (!dryRun && (await ingredientExists(name))) continue;
    try {
      const mapped = await fetchIngredient(http, apiKey, name);
      if (!mapped) {
        console.warn(`[spoonacular] no ingredient match for "${name}"`);
        continue;
      }
      if (!validateMacros(mapped)) {
        console.warn(`[spoonacular] dropped "${name}" — implausible macros`);
        continue;
      }
      collected.push(mapped);
      process.stdout.write(`\r[spoonacular] ingredients collected ${collected.length}…`);
    } catch (err) {
      if (isQuotaError(err)) { quota = true; break; }
      console.warn(`[spoonacular] ingredient "${name}" failed: ${err.message}`);
    }
  }
  process.stdout.write('\n');

  // 2) Dishes — 2 recipes per query for variety.
  if (!quota) {
    for (const query of DISH_QUERIES) {
      if (collected.length >= cap) break;
      try {
        const dishes = await fetchDishes(http, apiKey, query, 2);
        for (const dish of dishes) {
          if (collected.length >= cap) break;
          if (!dish.name || !validateMacros(dish)) continue;
          collected.push(dish);
        }
        process.stdout.write(`\r[spoonacular] +dishes, total ${collected.length}…`);
      } catch (err) {
        if (isQuotaError(err)) { quota = true; break; }
        console.warn(`[spoonacular] dish "${query}" failed: ${err.message}`);
      }
    }
    process.stdout.write('\n');
  }

  if (quota) {
    console.warn('[spoonacular] daily point quota reached (402) — writing what we have, re-run tomorrow to continue');
  }
  console.log(`[spoonacular] collected ${collected.length} foods (${collected.filter((f) => f.brand === 'Dish').length} dishes)`);

  if (dryRun) {
    for (const f of collected.slice(0, 12)) {
      console.log(`  · ${f.name}${f.brand ? ` [${f.brand}]` : ''}  kcal=${f.calories} P=${f.proteins} F=${f.fats} C=${f.carbs}  img=${f.imageUrl ? 'y' : 'n'}`);
    }
    return;
  }

  const written = await writeFoods(collected);
  console.log(`[spoonacular] done. upserted=${written}`);
}

module.exports = { run, INGREDIENTS, DISH_QUERIES };
