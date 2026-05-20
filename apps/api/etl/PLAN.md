# Seeding Athlo DB from external APIs (exercises + foods)

> **План збережено в** `C:\Users\AntonSkakovskyi\.claude\plans\elegant-floating-eagle.md`. Файл переживає сесії (per-user, не per-session). Щоб мати копію в репозиторії: `copy C:\Users\AntonSkakovskyi\.claude\plans\elegant-floating-eagle.md C:\root\diploma\athlo\apps\api\etl\PLAN.md`.

## Як продовжити в новій сесії

У новій сесії скажи: «Імплементуй план з `C:\Users\AntonSkakovskyi\.claude\plans\elegant-floating-eagle.md`». Все необхідне дослідження вже зроблено й зафіксоване нижче (API-вибір, ліцензії, поля, обмеження) — нову сесію не треба змушувати повторно ходити в WebSearch.

**Стек проєкту (важливо для нової сесії):**
- API — NestJS + TypeORM 0.3.28 + Postgres (`pg` driver). Не raw pg як у seed.js — є повноцінні ентіті та міграції.
- Міграції зараз порожні (`apps/api/src/migrations/` ще не існує — буде створено). Команди:
  - `npm run migration:generate -- src/migrations/AddExternalSourcesAndMedia` (з `apps/api/`)
  - `npm run migration:run`
- Сама data-source конфігурація: `apps/api/src/config/data-source.ts:9-10` сканує `src/**/*.entity.ts` та `src/migrations/*.ts`.
- Існуючий `seed.js` — окремий raw-pg скрипт; ETL дотримуйся того ж підходу (raw pg через `pg.Pool`), щоб не тягти Nest-bootstrap.

**Уточнені шляхи ентіті:**
| Ентіті | Шлях |
|---|---|
| Exercise | `apps/api/src/exercise-catalog/entities/exercise.entity.ts` |
| Equipment | `apps/api/src/exercise-catalog/entities/equipment.entity.ts` |
| Muscle | `apps/api/src/exercise-catalog/entities/muscle.entity.ts` |
| ExerciseMuscle | `apps/api/src/exercise-catalog/entities/exercise-muscle.entity.ts` |
| TrackingType | `apps/api/src/exercise-catalog/entities/tracking-type.entity.ts` |
| VisibilityType | `apps/api/src/exercise-catalog/entities/visibility-type.entity.ts` |
| Food | `apps/api/src/nutrition-service/entities/food.entity.ts` |
| FoodUnit | `apps/api/src/nutrition-service/entities/food-unit.entity.ts` |
| Unit | `apps/api/src/user-service/body-metrics/entities/unit.entity.ts` |
| Achievement | `apps/api/src/workouts-service/achievement/entities/achievement.entity.ts` |

**Існуючі image-поля (важливо — щоб не дублювати):**
- `muscles.image_url VARCHAR(255) NULL` ✅ існує (заповнюємо з wger SVG)
- `achievements.icon_url VARCHAR(512) NULL` ✅ існує
- `exercises` — **немає** жодного image/gif/url поля
- `equipments` — немає
- `foods` — немає (нема й barcode/serving)

**Що зробили demo-агенти (Phase 1):**
- Прочитали `apps/api/seed.js` (787 рядків): 47 hardcoded вправ, 25 продуктів, довідники (visibility_type/tracking_types/muscles/equipments/units/meal_types/metric_types), 24 demo-тренування, 4 meal-plans, achievements. Структура seed: lookups → exercises+muscles pivot → body_metrics → workouts → templates → nutrition → achievements.
- Зафіксовано: НЕМАЄ S3/Cloudinary/multer/FileInterceptor у проєкті. Image-handling доведеться додати, але для цього плану рішення — **зовнішні URL без локального зберігання** (затверджено користувачем).

## Context

`apps/api/seed.js` зараз містить ~47 hardcoded вправ і ~25 hardcoded продуктів — це достатньо для демо, але мало для реального користування. Користувачам потрібен великий каталог, щоб одразу знаходити вправи й продукти без створення власних. Поточна БД також не зберігає **зображення вправ, GIF-демонстрації, фото продуктів і штрих-коди** — без них UI виглядає текстовим, а майбутній barcode-scan для харчування неможливий.

Мета: написати окремий ідемпотентний ETL-скрипт, який підтягує дані з безкоштовних API, нормалізує під поточну схему й завантажує в БД. `seed.js` залишається для демо-користувачів, тренувань і планів — після створення схеми він викликає ETL якщо довідники порожні.

## Обрані джерела

| Домен | Джерело | Що дає | Ліцензія | Auth |
|---|---|---|---|---|
| Вправи (база) | **wger** `https://wger.de/api/v2/exerciseinfo/` | 845 вправ, embedded muscles (з SVG-анатомією), equipment, переклади EN, зображення `is_main`, категорії (Cardio/Legs/Chest/Arms/Abs/Back/Shoulders) | CC-BY-SA / CC-BY | Без ключа |
| Вправи (GIF) | **ExerciseDB** (open-source v1, self-host або публічний інстанс) | 5000+ GIF-анімацій, name-matched до wger | AGPL-3.0 (для софту; контент — окремо) | Без ключа на публічному інстансі |
| Харчування (бренди + фото + barcode) | **Open Food Facts** `https://world.openfoodfacts.org/api/v2/` | 2.5M продуктів з фото, EAN-кодами, серіями порцій, NOVA, Nutri-Score; bulk JSONL дамп для початкового завантаження | ODbL (data) + CC-BY-SA (images) | User-Agent header; rate 10–15 req/min |
| Харчування (базові інгредієнти) | **USDA FoodData Central** `https://api.nal.usda.gov/fdc/v1/` | 300K, Foundation/SR Legacy типи — еталонні макроси для chicken/rice/banana | CC0 public domain | API-key data.gov, 1000 req/hr |

Зображення зберігаємо як зовнішні URL (без локального кешу) — швидкий старт. Локальний кеш або S3 — окремий task поза скоупом цього плану.

## Зміни схеми БД

Усі зміни — через TypeORM-міграцію `apps/api/src/migrations/<timestamp>-AddExternalSourcesAndMedia.ts`. Існуючі ентіті — `apps/api/src/**/*.entity.ts` (з агентом виявили: exercise.entity.ts, equipment.entity.ts, muscle.entity.ts, food.entity.ts тощо). Кожній зміні відповідає правка ентіті.

### `exercises` (додати)

| Колонка | Тип | Призначення |
|---|---|---|
| `image_url` | `VARCHAR(512) NULL` | Головне фото з wger `images[is_main=true].image` |
| `gif_url` | `VARCHAR(512) NULL` | Анімація з ExerciseDB (name-matched) |
| `instructions` | `TEXT NULL` | Покрокова інструкція (з ExerciseDB або з wger перекладу) |
| `category_id` | `INTEGER NULL` | FK на нову `exercise_categories` |
| `external_source` | `VARCHAR(50) NULL` | `'wger'` \| `'exercisedb'` \| NULL (user-created) |
| `external_id` | `VARCHAR(255) NULL` | UUID wger або id ExerciseDB |
| `license` | `VARCHAR(50) NULL` | e.g. `'CC-BY-SA-4.0'` для attribution |
| `license_author` | `VARCHAR(255) NULL` | Ім'я автора |

Індекс: `CREATE UNIQUE INDEX idx_exercises_external ON exercises (external_source, external_id) WHERE external_source IS NOT NULL;`

### `exercise_categories` (нова таблиця-довідник)

```
id INTEGER PK, name VARCHAR(50) UNIQUE NOT NULL
```
Префіл: `Cardio, Legs, Chest, Arms, Abs, Back, Shoulders` (з wger).

### `equipments` (додати)

| Колонка | Тип | Призначення |
|---|---|---|
| `external_source` | `VARCHAR(50) NULL` | |
| `external_id` | `VARCHAR(255) NULL` | |

Індекс: UNIQUE (external_source, external_id) WHERE external_source IS NOT NULL.

### `muscles` (додати)

| Колонка | Тип | Призначення |
|---|---|---|
| `name_en` | `VARCHAR(255) NULL` | Канонічна англ. назва з wger `name_en` |
| `external_id` | `VARCHAR(255) NULL` | `id` з wger |
| `image_url_secondary` | `VARCHAR(512) NULL` | Вже є `image_url`, додаємо ще view |

(`image_url` уже існує — заповниться `muscles.image_url_main` SVG.)

### `foods` (додати)

| Колонка | Тип | Призначення |
|---|---|---|
| `image_url` | `VARCHAR(512) NULL` | Фронтальне фото з OFF |
| `barcode` | `VARCHAR(50) NULL` | EAN-13 з OFF `code`, UNIQUE WHERE NOT NULL |
| `serving_size_g` | `DECIMAL(10,2) NULL` | Стандартна порція |
| `fiber` | `DECIMAL(10,2) NULL DEFAULT 0` | Розширені макроси (опціонально) |
| `sugar` | `DECIMAL(10,2) NULL DEFAULT 0` | |
| `sodium_mg` | `DECIMAL(10,2) NULL DEFAULT 0` | |
| `external_source` | `VARCHAR(50) NULL` | `'off'` \| `'usda_fdc'` \| NULL |
| `external_id` | `VARCHAR(100) NULL` | OFF barcode або FDC `fdcId` |

Індекси: UNIQUE (external_source, external_id) WHERE external_source IS NOT NULL; UNIQUE (barcode) WHERE barcode IS NOT NULL.

## Архітектура ETL

Розташування: `apps/api/etl/`

```
apps/api/etl/
├── index.js                  # CLI entrypoint
├── lib/
│   ├── http.js               # axios + retry + rate-limit delay
│   ├── db.js                 # shared pg Pool
│   └── normalize.js          # name normalize (lowercase, strip "(Barbell)", etc.) для matching
├── sources/
│   ├── wger.js               # GET /exerciseinfo/?language=2&status=2 paginated
│   ├── exercisedb.js         # fetch GIF map, name-match до wger
│   ├── openfoodfacts.js      # stream JSONL dump OR API search by category
│   └── usda-fdc.js           # /foods/search?dataType=Foundation,SR%20Legacy
├── transform/
│   ├── exercise.js           # upsert exercises + exercise_muscles, мапить category, muscles, equipment
│   ├── food.js               # upsert foods, food_units
│   └── lookups.js            # ensure muscles/equipments/categories/units існують
└── README.md                 # як запускати + attribution-блок
```

### CLI

```
node apps/api/etl/index.js --source=wger --limit=850
node apps/api/etl/index.js --source=exercisedb --enrich-gifs
node apps/api/etl/index.js --source=off --categories=cereals,dairy --limit=500
node apps/api/etl/index.js --source=fdc --datatype=Foundation --limit=300
node apps/api/etl/index.js --all                 # все по черзі
node apps/api/etl/index.js --all --dry-run       # показати скільки б завантажилось
```

### Pipeline (для кожного джерела)

1. **Ensure lookups** — `lookups.js` робить upsert довідників (`muscles`, `equipments`, `exercise_categories`, `units`, `tracking_types`, `visibility_type`) за `name` (як зараз робить `nameId` у seed.js:15).
2. **Extract** — посторінкова GET-пагінація з `lib/http.js`, делей між запитами (для OFF — 4s між запитами, для wger — 0.5s).
3. **Transform** — обрати EN-переклад, замапити вкладені muscles/equipment-id на локальні id через нормалізовану назву; для wger зробити `tracking_type` за евристикою (Cardio→TIME_BASED, bodyweight→REPS_ONLY, інше→WEIGHT_AND_REPS).
4. **Load** — `INSERT ... ON CONFLICT (external_source, external_id) DO UPDATE SET ...` (ідемпотентність). Для `exercise_muscles` — окрема upsert по композитному ключу.
5. **Enrich GIFs** (тільки після `wger`) — пройти ExerciseDB-список, для кожного знайти best-match у `exercises WHERE external_source='wger'` за нормалізованою назвою (Levenshtein ≤ 3 або точний збіг після `normalize`), `UPDATE exercises SET gif_url=$1 WHERE id=$2`.

### Mapping таблиці

**wger exercise → exercises:**
```
external_source = 'wger'
external_id     = wger.uuid
name            = wger.translations[language=2].name
description     = wger.translations[language=2].description (strip HTML)
category_id     = lookup by wger.category.name
equipment_id    = lookup by wger.equipment[0].name (перший)
visibility_type_id = 1 (PUBLIC)
image_url       = first image where is_main=true
license         = wger.license.short_name  (e.g. 'CC-BY-SA 4')
license_author  = wger.license_author
tracking_type_id = heuristic
```
Потім для кожного `muscles[]` → INSERT exercise_muscles is_primary=true, для `muscles_secondary[]` → is_primary=false.

**OFF product → foods:**
```
external_source = 'off'
external_id     = product.code (EAN)
barcode         = product.code
name            = product.product_name (або product_name_en)
brand           = product.brands (перший до коми)
calories        = product.nutriments['energy-kcal_100g']
proteins        = product.nutriments.proteins_100g
fats            = product.nutriments.fat_100g
carbs           = product.nutriments.carbohydrates_100g
fiber           = product.nutriments.fiber_100g
sugar           = product.nutriments.sugars_100g
sodium_mg       = product.nutriments.sodium_100g * 1000
image_url       = product.image_url
serving_size_g  = product.serving_quantity (якщо number)
```
Фільтр: тільки продукти з ненульовими kcal+proteins+fats+carbs та валідним `product_name`. Беремо ~1000–2000 продуктів зі стабільних категорій.

**USDA FDC food → foods:**
```
external_source = 'usda_fdc'
external_id     = food.fdcId
name            = food.description
brand           = NULL (Foundation/SR Legacy)
calories        = food.foodNutrients[nutrientId=1008].amount  # Energy kcal
proteins        = food.foodNutrients[nutrientId=1003].amount
fats            = food.foodNutrients[nutrientId=1004].amount
carbs           = food.foodNutrients[nutrientId=1005].amount
image_url       = NULL
```

### Rate limits / етикет

- **wger**: 0.5s delay між запитами, batch 100
- **OFF**: 4–6s delay (10 req/min), User-Agent `'Athlo-ETL/0.1 (skanton3@gmail.com)'`; для масиву ≥1000 — використати JSONL дамп `https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz`
- **USDA FDC**: ключ у `.env` як `USDA_FDC_API_KEY`, 1000/hr — батчити по 200 з sleep 4s

### Attribution

Додати в `apps/mobile/app/(app)/settings` або в `apps/api/etl/README.md` блок:
> Exercise data: wger (CC-BY-SA 4.0). Food data: Open Food Facts (ODbL) + USDA FoodData Central (public domain).

## Файли, які зміняться/створяться

**Створити:**
- `apps/api/src/migrations/<timestamp>-AddExternalSourcesAndMedia.ts`
- `apps/api/etl/index.js`
- `apps/api/etl/lib/{http,db,normalize}.js`
- `apps/api/etl/sources/{wger,exercisedb,openfoodfacts,usda-fdc}.js`
- `apps/api/etl/transform/{exercise,food,lookups}.js`
- `apps/api/etl/README.md`

**Змінити (TypeORM ентіті — додати колонки):**
- `apps/api/src/**/exercise.entity.ts`
- `apps/api/src/**/equipment.entity.ts`
- `apps/api/src/**/muscle.entity.ts`
- `apps/api/src/**/food.entity.ts`
- `apps/api/src/**/exercise-category.entity.ts` (новий)

**Змінити (опціонально):**
- `apps/api/seed.js` — додати fallback виклик ETL якщо `SELECT COUNT(*) FROM exercises WHERE external_source='wger'` повертає 0; або інструкція в README запускати ETL перед seed.
- `apps/api/.env.example` — `USDA_FDC_API_KEY=`

**Перевикористовуються:**
- `apps/api/seed.js:15` `nameId` patternдля upsert довідників — портується в `etl/transform/lookups.js`
- `apps/api/seed.js:21` `insertRow` — портується в `lib/db.js`

## Верифікація

1. **Міграція проходить:** `npm run migration:run` у `apps/api/` — нові колонки існують.
2. **Dry-run:** `node apps/api/etl/index.js --source=wger --limit=10 --dry-run` друкує 10 мапнутих рядків без INSERT.
3. **Повне wger-завантаження:** `node apps/api/etl/index.js --source=wger` — у БД має бути ~845 рядків `WHERE external_source='wger'`, кожен має `image_url` (≥80%) і ≥1 рядок у `exercise_muscles`.
4. **GIF-збагачення:** `node apps/api/etl/index.js --source=exercisedb --enrich-gifs` — ≥50% wger-вправ отримують `gif_url`.
5. **OFF:** `node apps/api/etl/index.js --source=off --limit=500` — у `foods` має бути ≥500 рядків з `external_source='off'`, кожен з `image_url`, `barcode`, валідними макросами.
6. **USDA:** `node apps/api/etl/index.js --source=fdc --limit=300` — ≥300 рядків з `external_source='usda_fdc'`, NULL image_url, валідні макроси.
7. **Ідемпотентність:** повторний запуск тих самих команд НЕ створює дублікатів (`COUNT(*)` стабільний).
8. **Mobile UI:** запустити mobile app, відкрити `apps/mobile/app/(app)/(nutrition)/food-picker.tsx` — продукти показують фото; екран вправ — image/gif. Скриншот або візуальне підтвердження.
9. **Attribution check:** у README ETL і/або в Settings mobile є посилання на джерела.

## Ризики / відомі обмеження

- **wger tracking_type евристика** недосконала — частина вправ матиме невірний tracking_type, користувач зможе перевизначити.
- **ExerciseDB name-matching** дасть ~50–70% покриття; решта залишиться без GIF — це ок.
- **OFF rate limit** через API повільний (10/min). Якщо ETL запускати на ≥1000 продуктів — переходимо на JSONL дамп (потокове читання, без rate-limit). У плані передбачено обидва шляхи.
- **Зовнішні URL зображень** залежать від доступності wger/OFF CDN. Для прод-релізу слід замігрувати в S3 (окремий task поза цим планом).
