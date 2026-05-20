# Athlo ETL

Idempotent loader that seeds the Athlo Postgres DB with **exercises** and
**foods** from free public APIs. Designed as a plain Node script (CommonJS,
raw `pg`) so it mirrors `apps/api/seed.js` and runs without booting Nest.

## Prerequisites

1. The schema in `apps/api/athlo-db.sql` must already be
   applied — the ETL relies on the new media columns (`image_url`, `gif_url`,
   `instructions`, `barcode`, `serving_size_g`, `fiber`, `sugar`, `sodium_mg`,
   muscle SVGs) and the partial unique indexes `idx_exercises_system_name`,
   `idx_foods_barcode`, `idx_foods_system_name`.
2. `apps/api/.env` (or root `.env`) must define:
   - `DATABASE_URL` — same connection string the API uses.
   - `DATABASE_SSL` — `false` for local Docker Postgres.
   - `USDA_FDC_API_KEY` — required only for `--source=fdc`. Free at
     <https://api.data.gov/signup/>.

## Usage

Run from the repo root (deps are hoisted into the root `node_modules`):

```bash
# everything in one go
node apps/api/etl/index.js --all

# individual sources
node apps/api/etl/index.js --source=wger --limit=850
node apps/api/etl/index.js --source=exercisedb         # enriches gif_url
node apps/api/etl/index.js --source=off --categories=cereals,dairy --limit=500
node apps/api/etl/index.js --source=fdc --datatype=Foundation --limit=300

# preview without touching the DB
node apps/api/etl/index.js --source=wger --limit=10 --dry-run
```

## Sources & licensing

| Source | Endpoint | Output | License |
|---|---|---|---|
| [wger](https://wger.de/api/v2/exerciseinfo/) | `https://wger.de/api/v2` | 800+ exercises + muscles (with SVG diagrams) | CC-BY-SA 4.0 |
| [ExerciseDB](https://github.com/exercisedb-org/exercisedb-api) | configurable (`EXERCISEDB_BASE_URL`) | GIF animations, instructions | content varies |
| [Open Food Facts](https://world.openfoodfacts.org/) | `/api/v2/search` | branded foods, barcodes, photos | ODbL (data) + CC-BY-SA (images) |
| [USDA FoodData Central](https://fdc.nal.usda.gov/) | `https://api.nal.usda.gov/fdc/v1` | reference whole foods macros | Public domain (CC0) |

> Attribution required for end-user UI: include a credits line such as
> *"Exercise data: wger (CC-BY-SA 4.0). Food data: Open Food Facts (ODbL) +
> USDA FoodData Central (public domain)."* in the mobile Settings screen.

## Pipeline behaviour

For each source the pipeline is:

1. **Ensure lookups** — `transform/lookups.js` upserts the static lookup tables
   (`visibility_type`, `tracking_types`, `units`, `exercise_categories`).
2. **Extract** — paginated GETs through `lib/http.js`, which applies a per-source
   minimum delay (wger 0.5s, OFF 4s, FDC 4s) and retries 408/429/5xx with
   exponential backoff (`Retry-After` honoured).
3. **Transform** — picks the English translation, resolves muscle/equipment ids,
   strips HTML, infers tracking type (Cardio → `TIME_BASED`, bodyweight →
   `REPS_ONLY`, else `WEIGHT_AND_REPS`).
4. **Load** — `INSERT … ON CONFLICT … DO UPDATE …` inside a single transaction.
   `exercise_muscles` is reconciled by id-diff (delete missing, upsert present).
5. **GIF enrichment** (`exercisedb` after `wger`) — name-matches via
   normalized form + Levenshtein ≤ 3, updates only `gif_url` (and
   `instructions` if still null).

## Idempotency

Re-running any command is a no-op for unchanged rows. Anchors:

| Table | Anchor | Used by |
|---|---|---|
| `visibility_type`, `tracking_types`, `units`, `exercise_categories` | `name` | core lookups |
| `muscles` | `LOWER(name)` | wger upsert |
| `equipments` | `LOWER(name) WHERE user_id IS NULL` | wger upsert |
| `exercises` | partial idx `idx_exercises_system_name` on `LOWER(name) WHERE user_id IS NULL` | wger upsert |
| `exercise_muscles` | unique `(exercise_id, muscle_id)` | wger upsert |
| `foods` (OFF) | partial idx `idx_foods_barcode` on `barcode WHERE barcode IS NOT NULL` | OFF upsert |
| `foods` (FDC, no barcode) | partial idx `idx_foods_system_name` on `(LOWER(name), COALESCE(LOWER(brand), '')) WHERE creator_id IS NULL` | FDC upsert |
| `food_units` | unique `(food_id, unit_id)` | both food sources |

User-created rows (`user_id IS NOT NULL` / `creator_id IS NOT NULL`) are never
touched by the ETL — they live outside the partial unique indexes.

Trade-offs of dropping `external_source` / `external_id`:

- The ETL cannot tell whether a given system row originally came from wger or
  ExerciseDB. That's fine — ExerciseDB only enriches `gif_url` and
  `instructions`, the rest of the row is wger-shaped.
- If two sources publish the same exercise name (e.g. "Push Up"), they collapse
  into one row. Usually desired.
- If you later want per-row license/attribution, re-introduce
  `exercises.license` + `exercises.license_author`. Until then attribution
  lives at the source level only.

## Layout

```
apps/api/etl/
├── index.js                 # CLI entrypoint
├── lib/
│   ├── db.js                # pg.Pool + upsert helpers
│   ├── http.js              # axios + retry + min-delay
│   └── normalize.js         # name normalize + Levenshtein + stripHtml
├── sources/
│   ├── wger.js
│   ├── exercisedb.js
│   ├── openfoodfacts.js
│   └── usda-fdc.js
└── transform/
    ├── lookups.js           # visibility/tracking/categories/muscle/equipment
    ├── exercise.js          # exercise + exercise_muscles upserts
    └── food.js              # food + food_units upserts
```

## Verification

```sql
-- system rows seeded by the ETL
SELECT COUNT(*) FROM exercises WHERE user_id IS NULL;
SELECT COUNT(*) FROM foods WHERE creator_id IS NULL;

-- coverage
SELECT
  COUNT(*) AS total,
  COUNT(image_url) AS with_image,
  COUNT(gif_url)   AS with_gif,
  COUNT(instructions) AS with_steps
FROM exercises
WHERE user_id IS NULL;

-- food coverage
SELECT
  COUNT(*) AS total,
  COUNT(barcode) AS with_barcode,
  COUNT(image_url) AS with_image
FROM foods
WHERE creator_id IS NULL;
```

Expected after a full `--all` run:

- `exercises WHERE user_id IS NULL` ≥ 800 rows, ≥ 80% with `image_url`.
- ≥ 50% of those rows pick up a `gif_url` from ExerciseDB.
- `foods WHERE creator_id IS NULL` matches `--limit` (sum across sources).
- Re-running any command keeps the row count stable.

## Known limits

- **wger tracking_type** is heuristic — users can edit individual exercises.
- **ExerciseDB matching** covers ~50–70% of wger exercises; the rest remain
  without GIFs (acceptable for the demo).
- **Image hosting** points at wger/OFF CDNs. For production, mirror the
  URLs to S3 — out of scope for this loader.
- **OFF search API** caps out around 10–15 req/min. For ≥1000 products,
  switch to the JSONL dump (`openfoodfacts-products.jsonl.gz`) — TBD.
- **`exercise_categories`** table is kept but no longer wired into `exercises`
  (no `category_id` FK). Future work can re-introduce the column or expose
  categories via a separate join table.
