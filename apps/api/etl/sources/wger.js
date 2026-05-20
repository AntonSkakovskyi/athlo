/**
 * wger.de exercise loader.
 *
 *   GET https://wger.de/api/v2/exerciseinfo/?language=2&status=2&limit=100
 *
 * Each result carries an English translation, embedded muscles[],
 * muscles_secondary[], category, equipment[], images[is_main].
 *
 * Output: upserted rows in `exercises`, `exercise_muscles`, plus newly
 * discovered muscles/equipments captured in the lookup tables. Idempotency:
 * dedup by `LOWER(name) WHERE user_id IS NULL`.
 */
const { createClient, sleep } = require('../lib/http');
const { withTransaction } = require('../lib/db');
const { stripHtml } = require('../lib/normalize');
const {
  loadNameIndex,
  ensureLookupByName,
  upsertMuscle,
  upsertEquipment,
} = require('../transform/lookups');
const { upsertExercise, syncExerciseMuscles } = require('../transform/exercise');

const WGER_BASE = 'https://wger.de/api/v2';
const EN_LANGUAGE = 2;
const STATUS_APPROVED = 2;
const PAGE_SIZE = 100;

const http = createClient({
  baseURL: WGER_BASE,
  minDelayMs: 500,
  maxRetries: 4,
});

function pickEnglish(translations) {
  if (!Array.isArray(translations) || translations.length === 0) return null;
  return translations.find((t) => t.language === EN_LANGUAGE) || translations[0];
}

/**
 * Heuristic tracking-type assignment. wger does not expose this directly.
 */
function inferTrackingType({ category, equipment }) {
  const catName = (category?.name || '').toLowerCase();
  if (catName === 'cardio') return 'TIME_BASED';

  const equipNames = (equipment || []).map((e) => (e?.name || '').toLowerCase());
  const hasWeight = equipNames.some((n) =>
    /barbell|dumbbell|kettlebell|cable|machine|smith|sled|trap bar|ez bar|weight/i.test(n),
  );
  if (hasWeight) return 'WEIGHT_AND_REPS';

  return 'REPS_ONLY';
}

function pickMainImage(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const main = images.find((i) => i.is_main);
  return (main || images[0])?.image || null;
}

async function fetchAllExercises(limit) {
  const results = [];
  let url = `/exerciseinfo/?language=${EN_LANGUAGE}&status=${STATUS_APPROVED}&limit=${PAGE_SIZE}`;
  let page = 0;

  while (url) {
    page += 1;
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
    if (page % 5 === 0) await sleep(500);
  }

  process.stdout.write('\n');
  return results;
}

async function run({ limit, dryRun }) {
  console.log('[wger] fetching exercises…');
  const items = await fetchAllExercises(limit);
  console.log(`[wger] received ${items.length} items`);

  if (dryRun) {
    const sample = items.slice(0, 5);
    for (const item of sample) {
      const tr = pickEnglish(item.translations);
      console.log(`  · ${tr?.name || '(no translation)'}  category=${item.category?.name || '-'}  equipment=${(item.equipment || []).map((e) => e.name).join(',') || '-'}  muscles=${(item.muscles || []).length}+${(item.muscles_secondary || []).length}`);
    }
    console.log(`[wger] dry-run — would upsert ${items.filter((i) => pickEnglish(i.translations)?.name).length} rows`);
    return;
  }

  let inserted = 0;
  let skipped = 0;

  await withTransaction(async (client) => {
    const trackingTypeCache = await loadNameIndex(client, 'tracking_types');

    for (const item of items) {
      const tr = pickEnglish(item.translations);
      if (!tr?.name) {
        skipped += 1;
        continue;
      }

      const trackingTypeId = await ensureLookupByName(
        client,
        'tracking_types',
        inferTrackingType(item),
        trackingTypeCache,
      );

      // Equipment: take the first wger-provided one, dedup by name.
      const firstEquip = (item.equipment || [])[0];
      const equipmentId = firstEquip
        ? await upsertEquipment(client, { name: firstEquip.name })
        : null;

      // Muscles: upsert each so we capture wger SVGs + canonical English names.
      const muscleRows = [];
      for (const m of item.muscles || []) {
        const id = await upsertMuscle(client, {
          name: m.name_en || m.name,
          nameEn: m.name_en,
          imageUrl: m.image_url_main || null,
          imageUrlSecondary: m.image_url_secondary || null,
        });
        muscleRows.push({ muscleId: id, isPrimary: true, impact: 100 });
      }
      for (const m of item.muscles_secondary || []) {
        const id = await upsertMuscle(client, {
          name: m.name_en || m.name,
          nameEn: m.name_en,
          imageUrl: m.image_url_main || null,
          imageUrlSecondary: m.image_url_secondary || null,
        });
        muscleRows.push({ muscleId: id, isPrimary: false, impact: 50 });
      }

      const exerciseId = await upsertExercise(client, {
        name: tr.name,
        description: stripHtml(tr.description),
        instructions: null,
        equipmentId,
        trackingTypeId,
        visibilityTypeId: 1,
        imageUrl: pickMainImage(item.images),
        gifUrl: null,
      });

      await syncExerciseMuscles(client, exerciseId, muscleRows);
      inserted += 1;

      if (inserted % 50 === 0) {
        process.stdout.write(`\r[wger] upserted ${inserted}/${items.length}…`);
      }
    }
  });

  process.stdout.write('\n');
  console.log(`[wger] done. upserted=${inserted} skipped=${skipped}`);
}

module.exports = { run };
