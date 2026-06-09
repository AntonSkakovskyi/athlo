# Athlo ETL

Idempotent loader that seeds the Athlo Postgres DB with **exercises** and
**foods** from free public APIs. Designed as a plain Node script (CommonJS,
raw `pg`) so it mirrors `apps/api/seed.js` and runs without booting Nest.

## Prerequisites

1. The schema in `apps/api/athlo-db.sql` must already be
   applied — the ETL relies on the media columns (`image_url`, `gif_url`,
   `instructions`, muscle SVGs) and the partial unique indexes
   `idx_exercises_system_name` and `idx_foods_system_name`. Food macros land in
   `nutrition_facts` (`calories`, `proteins`, `fats`, `carbs` per unit).
2. `apps/api/.env` (or root `.env`) must define:
   - `DATABASE_URL` — same connection string the API uses.
   - `DATABASE_SSL` — `false` for local Docker Postgres.
   - `SPOONACULAR_API_KEY` — required for `--source=spoonacular` (foods + dishes).
     Free at <https://spoonacular.com/food-api> (150 points/day).

## Usage

Run from the repo root (deps are hoisted into the root `node_modules`):

```bash
# everything in one go
node apps/api/etl/index.js --all

# individual sources
node apps/api/etl/index.js --source=wger --limit=850
node apps/api/etl/index.js --source=exercisedb         # enriches gif_url
node apps/api/etl/index.js --source=spoonacular        # ingredients + dishes (foods)

# preview without touching the DB (also caps API points spent)
node apps/api/etl/index.js --source=spoonacular --limit=10 --dry-run
```

## Raw Dump (Local Files)

To fetch raw payloads from APIs and save them directly to JSON files (bypassing the database), use `dump.js`. This is useful for inspecting the data shape or offline debugging.

Files are saved to `apps/api/etl/dumps/` by default.

```bash
# everything in one go (default limits)
node apps/api/etl/dump.js

# individual sources
node apps/api/etl/dump.js --source=wger --limit=100
node apps/api/etl/dump.js --source=exercisedb
node apps/api/etl/dump.js --source=spoonacular --limit=12

# custom output directory
node apps/api/etl/dump.js --out-dir=./tmp/raw_data
```

## Sources & licensing

| Source | Endpoint | Output | License |
|---|---|---|---|
| [wger](https://wger.de/api/v2/exerciseinfo/) | `https://wger.de/api/v2` | 800+ exercises + muscles (with SVG diagrams) | CC-BY-SA 4.0 |
| [ExerciseDB](https://github.com/exercisedb-org/exercisedb-api) | configurable (`EXERCISEDB_BASE_URL`) | GIF animations, instructions | content varies |
| [Spoonacular](https://spoonacular.com/food-api) | `https://api.spoonacular.com` | curated whole-food ingredients + composite dishes, macros + photos | proprietary (attribution required) |

> Attribution required for end-user UI: include a credits line such as
> *"Exercise data: wger (CC-BY-SA 4.0). Food & dish data and images: spoonacular.com."*
> in the mobile Settings screen.

## Pipeline behaviour

For each source the pipeline is:

1. **Ensure lookups** — `transform/lookups.js` upserts the static lookup tables
   (`visibility_type`, `tracking_types`, `units`, `exercise_categories`).
2. **Extract** — GETs through `lib/http.js`, which applies a per-source minimum
   delay (wger 0.5s, Spoonacular ~1.1s) and retries 408/429/5xx with exponential
   backoff (`Retry-After` honoured).
3. **Transform** — exercises: pick the English translation, resolve
   muscle/equipment ids, strip HTML, infer tracking type. Foods: normalise every
   row to per-100g macros (dishes converted from per-serving via
   `weightPerServing`); validate macros (`validateMacros`).
4. **Load** — `INSERT … ON CONFLICT … DO UPDATE …` inside a single transaction.
   `exercise_muscles` is reconciled by id-diff (delete missing, upsert present).
5. **GIF enrichment** (`exercisedb` after `wger`) — name-matches via
   normalized form + Levenshtein ≤ 3, updates only `gif_url` (and
   `instructions` if still null).
6. **Spoonacular** — skips ingredients already in the DB (resume past quota),
   and treats a `402` as a clean stop so a re-run the next day continues.

## Idempotency

Re-running any command is a no-op for unchanged rows. Anchors:

| Table | Anchor | Used by |
|---|---|---|
| `visibility_type`, `tracking_types`, `units`, `exercise_categories` | `name` | core lookups |
| `muscles` | `LOWER(name)` | wger upsert |
| `equipments` | `LOWER(name) WHERE user_id IS NULL` | wger upsert |
| `exercises` | partial idx `idx_exercises_system_name` on `LOWER(name) WHERE user_id IS NULL` | wger upsert |
| `exercise_muscles` | unique `(exercise_id, muscle_id)` | wger upsert |
| `foods` (Spoonacular) | partial idx `idx_foods_system_name` on `(LOWER(name), COALESCE(LOWER(brand), '')) WHERE creator_id IS NULL` | ingredients (`brand IS NULL`) + dishes (`brand = 'Dish'`) |
| `nutrition_facts` | unique `(food_id, unit_id)` | Spoonacular |

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
│   └── spoonacular.js       # ingredients + dishes (foods)
└── transform/
    ├── lookups.js           # visibility/tracking/categories/muscle/equipment
    ├── exercise.js          # exercise + exercise_muscles upserts
    └── food.js              # food + nutrition_facts upserts (+ validateMacros)
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
  COUNT(image_url) AS with_image,
  (SELECT COUNT(*) FROM nutrition_facts) AS macro_rows
FROM foods
WHERE creator_id IS NULL;
```

Expected after a full `--all` run:

- `exercises WHERE user_id IS NULL` ≥ 800 rows, ≥ 80% with `image_url`.
- ≥ 50% of those rows pick up a `gif_url` from ExerciseDB.
- `foods WHERE creator_id IS NULL` ≈ 130–170 rows (ingredients + dishes), nearly
  all with `image_url`; dishes carry `brand = 'Dish'`.
- Re-running any command keeps the row count stable.

## Known limits

- **wger tracking_type** is heuristic — users can edit individual exercises.
- **ExerciseDB matching** covers ~50–70% of wger exercises; the rest remain
  without GIFs (acceptable for the demo).
- **Image hosting** points at wger/Spoonacular CDNs. For production, mirror the
  URLs to S3 — out of scope for this loader.
- **Spoonacular free tier** = 150 points/day. A full foods run sits close to the
  cap; if a `402` interrupts it, just re-run the next day — already-imported
  ingredients are skipped and dishes upsert idempotently.
- **`exercise_categories`** table is kept but no longer wired into `exercises`
  (no `category_id` FK). Future work can re-introduce the column or expose
  categories via a separate join table.
