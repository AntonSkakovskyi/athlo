# Athlo — Code Review (повний звіт)

> Глибокий код-рев'ю монорепозиторію: NestJS + TypeORM + PostgreSQL (бекенд), React Native / Expo + TanStack Query (мобільний клієнт), Turborepo + спільний пакет `@athlo/shared`.
> Знахідки відсортовано за критичністю: Critical → High → Medium → Low → Info.

---

# Executive Summary

## Загальна оцінка зрілості кодової бази

**Оцінка: 6/10 — «міцний прототип з продуманим доменом, але без операційної стійкості».**

| Вимір | Оцінка | Коментар |
|---|---|---|
| Доменна модель / схема БД | 7/10 | Добре нормалізована, вдалі partial-індекси; але дірки в FK та інваріантах |
| Архітектура бекенду | 7/10 | Канонічний NestJS, чисті контролери, повне guard-покриття; немає exception-шару і транзакцій |
| Безпека | 4/10 | Витік password_hash, приватні дані чужих профілів, без rate-limit, невідкликувані JWT |
| Цілісність даних | 4/10 | **Нуль транзакцій** на мульти-табличних операціях; «тихі» втрати даних на контракті |
| Shared-контракт | 5/10 | Правильна ідея, але не виконує роль контракту: дрейф енумів, request-DTO не винесені |
| Продуктивність | 5/10 | N+1 на гарячих шляхах, повні relations у списках, посекундні ререндери |
| UI/UX-інженерія | 6/10 | Хороша декомпозиція і темізація; 1 memo на 130 компонентів, stale-closure баги |
| Інфраструктура / DevEx | 5/10 | Turbo-конфіг від Next.js, немає CI, mobile без лінта, ESM/CJS-міна |
| Тести | 6/10 | Юніт-спеки сервісів є; e2e-каркас є; критичні баги (нижче) ними не ловляться |

**Сильні сторони:** продумана доменна модель (розділення plan/log, шаблони, видимість, перерахунок рекордів у обидва боки), послідовні перевірки ownership (жодного IDOR не знайдено), охайні фабрики query-keys, віртуалізація довгих списків, токен у SecureStore.

**Системні корені проблем (3 теми, що породжують 80 % знахідок):**
1. **Відсутність централізованих захисних шарів** — немає транзакцій, exception filter, серіалізації відповідей, обробки помилок мутацій. Кожен сервіс/екран «сам за себе», і там, де забули — діра.
2. **Shared-пакет не є джерелом правди** — по дроту ходять поля, яких немає в DTO (мовчки відкидаються), енуми розсинхронізовані з даними в БД, request-типи дубльовані на клієнті.
3. **Найважливіший екран продукту (активне тренування) — найслабше місце** — і за продуктивністю, і за надійністю даних.

## ТОП-10 проблем для першочергового виправлення

| # | Проблема | Локація | Ефект |
|---|---|---|---|
| 1 | [x] 🔴 `register` повертає `password_hash` клієнту | `auth.service.ts` | Витік хешів паролів |
| 2 | [x] 🔴 Нуль транзакцій; `complete()` робить delete→insert сетів окремими запитами | весь бекенд, `workout.service.ts` | Безповоротна втрата даних тренування при збої |
| 3 | [x] 🔴 ESM/CJS-конфлікт `@athlo/shared` ↔ API | `packages/shared` | Потенційний `ERR_REQUIRE_ESM` — API не стартує |
| 4 | [x] 🔴 `visibility`/`description` мовчки відкидаються ValidationPipe-ом при завершенні тренування | mobile ↔ `complete-workout.dto.ts` | Користувач «ділиться» тренуванням, воно лишається приватним |
| 5 | [x] 🔴 Активне тренування живе тільки в RAM | `ActiveWorkoutContext.tsx` | ОС вбила процес у залі — година роботи втрачена |
| 6 | [x] 🔴 `GET /profile/:id` віддає email/вагу/антропометрію будь-кому | `user.controller.ts` | Витік приватних даних, енумерація акаунтів |
| 7 | [x] 🔴 `reorderSets`: stale closure — порядок сетів ніколи не зберігається | `useActiveWorkoutScreen.ts:302` | UI бреше: після перезапуску порядок відкочується |
| 8 | [x] 🔴 Дрейф метрик: БД має `'1RM'`/`'VOLUME'`, енум — `ESTIMATED_1RM` і без VOLUME | shared ↔ `achievement.service.ts` ↔ mobile | Фільтри по енуму мовчки повертають порожнечу |
| 9 | [x] 🟡 `idx_unique_friendship` не унікальний + відсутні FK (`nutrition_facts`, `settings`) | `athlo-db.sql` | Дублі дружб, осиротілі дані |
| 10 | [x] 🟡 Секундний таймер ререндерить усе дерево екрана; PATCH на кожен символ | `useActiveWorkoutScreen.ts` | Лаги введення, шторм запитів із перерахунком PR |

**Рекомендований порядок робіт:** (1) хотфікси безпеки — #1, #6 (години); (2) цілісність даних — #2, #9 + exception filter (1–2 дні); (3) контракт — #3, #4, #8: винести request-DTO у shared, вирівняти енуми (1–2 дні); (4) активне тренування — #5, #7, #10 (2–3 дні).

---

# 🔴 Critical

## [x] C1. `POST /auth/register` повертає `password_hash` у відповіді

📁 `apps/api/src/user-service/auth/auth.service.ts:19–29`; `user.service.ts` (`create()`)

🚨 У `login()` хеш відрізається, у `register()` — ні: користувач приходить прямо з `userRepository.save()` і віддається клієнту **разом із bcrypt-хешем**. Хеш потрапляє в HTTP-відповідь, логи, кеші. Наслідок ручного «віднімання» чутливих полів у кожному місці — одне місце забули.

💡 Рішення на рівні даних, а не латка:
```ts
@Column({ select: false })
password_hash: string;
// у login/create — явно: .addSelect('user.password_hash')
```
Мінімальний хотфікс — деструктуризація в `register()` як у `login()`.

## [x] C2. Нуль транзакцій у всьому бекенді; `complete()` — деструктивний rewrite без атомарності

📁 Усі 19 сервісів (grep `transaction|QueryRunner` — 0 збігів); найгірше: `workout.service.ts:172–242` (`complete`), `249–290` (`copyWorkout`), `meal-plan.service.ts:43–70` (`create`), `user.service.ts` (`updateProfile`)

🚨 Завершення тренування: `remove(toDelete)` → у циклі `delete всіх log_sets` + `save нових` → `save(workout)` → achievements. Збій між `delete` і `save` = **підходи користувача стерті безповоротно**, тренування лишилося `IN_PROGRESS` без даних. Аналогічно: копія тренування без сетів, мил-план без днів, профіль із наполовину застосованими цілями.

💡 `DataSource.transaction(async (em) => { ... })` для всіх мульти-табличних записів; achievements — після коміту.

## [x] C3. ESM/CommonJS-конфлікт: `@athlo/shared` — чистий ESM, API — CommonJS

📁 `packages/shared/package.json` (`"type": "module"`), `tsconfig.base.json` (`module: ESNext`) ↔ `apps/api/tsconfig.json` (`module: commonjs`); shared імпортується в 10+ файлах API, включно з ентіті (енуми — рантайм-значення)

🚨 Скомпільований Nest робить `require('@athlo/shared')` для ESM-пакета. Працює лише на Node ≥ 20.19/22.12 (`require(esm)`); на старіших — `ERR_REQUIRE_ESM` на старті. Dockerfile використовує плаваючий `node:20-alpine`. Jest маскує проблему через `moduleNameMapper` на `src/`.

💡 Зробити shared CommonJS (прибрати `"type": "module"`, компілювати в CJS — Metro споживає CJS без проблем) і зафіксувати базовий образ `node:20.19-alpine`.

## [x] C4. Фронт шле `visibility` і `description` при завершенні тренування — бекенд мовчки викидає

📁 `useFinishWorkoutScreen.ts:29,62–63`; `useWorkoutAPI.ts:96–132` ↔ `complete-workout.dto.ts`, `update-workout.dto.ts`

🚨 Екран Finish дає вибрати видимість (дефолт — **PUBLIC**) і опис, але DTO цих полів не мають, і `ValidationPipe({ whitelist: true })` мовчки їх відрізає. Тренування назавжди лишається `visibility_type_id = 1` (PRIVATE), опис губиться. Користувач упевнений, що поділився — друзі ніколи не побачать. Жодної помилки на жодній стороні.

💡 Додати `@IsEnum(VisibilityType) visibility?` і `description?` у DTO + обробку в сервісі. Системно: винести request-DTO (`CompleteWorkoutData` тощо) з `useWorkoutAPI.ts` у `@athlo/shared` — тоді дрейф ловить компілятор.

## [x] C5. Активне тренування живе лише в оперативній пам'яті

📁 `contexts/ActiveWorkoutContext.tsx` (AsyncStorage у contexts/features — 0 збігів)

🚨 Сети/ваги/повтори — тільки в `useState`. Тренування триває 60–90 хв, телефон у кишені, Android вбиває фонові процеси постійно. Повернувся в застосунок — воркаут порожній (на бекенді лише «шапка» IN_PROGRESS; сети летять тільки при завершенні). Найболючіший збій для фітнес-трекера.

💡 Персистити стейт у AsyncStorage з debounce на кожну зміну; при старті — пропонувати «Resume workout» після звірки статусу з беком.

## [x] C6. `GET /profile/:id` та `GET /profile/search` віддають приватні дані будь-кового користувача

📁 `user.controller.ts` (`getOtherProfile`, `searchUsers`); `user.service.ts`

🚨 Обидва ендпоінти повертають повний профіль: **email, вік, зріст, вагу, фітнес-цілі, нутрі-цілі** — будь-якому автентифікованому користувачу. Механіка приватності (visibility, friends) існує, але тут не застосована. Search по `%` віддає перших 20 користувачів з email-ами.

💡 Окремий публічний DTO (`id, nickname, fullName, avatar`); антропометрія — лише власнику (та, за задумом, друзям після перевірки `ACCEPTED`). У search — `select` по білому списку колонок.

## [x] C7. `reorderSets`: stale closure — перестановка сетів ніколи не зберігається на сервері

📁 `useActiveWorkoutScreen.ts:302–325`

🚨 Після `reorderSetsLocal(...)` код читає `const updatedEx = exercises[exerciseIndex]` з коментарем «Get fresh sets after local update» — але `exercises` зі stale-замикання, React не оновлює його синхронно. PATCH-и переписують кожному сету його **старий** порядок. UI показує нову послідовність, БД зберігає стару; після перезапуску сети «стрибають» назад. Споріднений баг — `addSet:248`: серверний id може записатися не в той рядок при швидких тапах.

💡 Обчислити новий масив локально (`splice`) і слати порядки з нього, не зі стейту; id нових сетів прив'язувати по localKey, не по індексу.

## [x] C8. Дрейф контракту метрик: БД пише `'1RM'`/`'VOLUME'`, shared-енум — `ESTIMATED_1RM` і без `VOLUME`

📁 `achievement.service.ts:138–140` ↔ `packages/shared/src/enums/tracking-metric.enum.ts` ↔ `app/(app)/(profile)/exercise-detail.tsx:123–125`

🚨 Будь-який код, що чесно скористається енумом (`where: { metricType: TrackingMetric.ESTIMATED_1RM }`), мовчки отримає порожній результат. Mobile «знає» це і дублює магічні рядки; `IUserExerciseRecord.metricType` деградував до `string` з коментарем. Аналогічно `trackingTypeName` зіставляється сирими літералами при існуючому енумі `TrackingType`.

💡 Додати `VOLUME` в енум, привести значення до фактичних даних (`UPDATE` за потреби), типізувати `metricType: TrackingMetric`, замінити літерали на енум по всьому стеку.

---

# 🟠 High

## [x] H1. Немає глобального Exception Filter: помилки БД = «500 Internal server error»

📁 `main.ts`/`app.module.ts` (APP_FILTER — 0 збігів); `auth.service.ts:19–23`

🚨 (1) Race у реєстрації: `findByEmail` → `create` — паралельні запити дають необроблений `QueryFailedError` → 500 замість 409. (2) Nickname не перевіряється взагалі — дубль = 500 на щасливому шляху. (3) Будь-яке FK/CHECK-порушення вилітає 500-кою.

💡 Глобальний `@Catch(QueryFailedError)`-фільтр: `23505 → 409`, `23503 → 400`; констрейнт — джерело правди, передперевірки — лише для дружніх повідомлень.

## [x] H2. `idx_unique_friendship` не унікальний; відсутні FK на `nutrition_facts`, `settings`, `log_sets.achievement_id`

📁 `athlo-db.sql:218` (звичайний CREATE INDEX з назвою «unique»); рядки 279–289, 21–29, 164

🚨 Дублікати запитів дружби (подвійний тап), дзеркальні пари (1→2 і 2→1) — листинг друзів двоїться. `nutrition_facts` (ядро домену харчування) — взагалі без FK: факти для неіснуючої їжі, сироти після видалення. `settings.user_id` без FK — сміття після видалення користувача.

💡
```sql
CREATE UNIQUE INDEX idx_unique_friendship
  ON user_friends (LEAST(user_id, friend_id), GREATEST(user_id, friend_id));
ALTER TABLE nutrition_facts ADD FOREIGN KEY(food_id) REFERENCES foods(id) ON DELETE CASCADE;
ALTER TABLE nutrition_facts ADD FOREIGN KEY(unit_id) REFERENCES units(id);
ALTER TABLE settings ADD FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE log_sets ADD FOREIGN KEY(achievement_id) REFERENCES achievements(id) ON DELETE SET NULL;
```

## [x] H3. N+1 на гарячих шляхах: `getBatchLastPerformance` = 3×N запитів; `complete()` = 50–100 запитів

📁 `workout.service.ts:337–351, 292–335`; `achievement.service.ts:59–252`

🚨 Batch last-performance (екран активного тренування, всі вправи одразу) — цикл з `await`, кожна ітерація — 3 послідовні запити. 8 вправ = 24 round-trip-и. `checkAndUpdateRecords`: `achievementRepo.find` та `logSetRepo.save` всередині циклу по сетах; `complete()` викликає це для кожної вправи послідовно.

💡 Один SQL з `DISTINCT ON (le.exercise_id)` + один `IN`-запит для сетів; підняти find із циклу, зберігати сети батчем.

## [x] H4. Мутації без обробки помилок: збій мережі = тиша

📁 Усі `hooks/api/*.ts` (0 `onError` на 21 файл); `_layout.tsx:16` (`new QueryClient()` без конфігурації); `useFinishWorkoutScreen.ts:53–76`

🚨 `completeWorkout.mutate(..., { onSuccess })` — якщо запит упав (timeout 10 с на мобільному інтернеті), не відбувається нічого: ні тосту, ні ретраю. ToastProvider існує, але до API-помилок не підключений.

💡 `MutationCache({ onError: toast })` глобально + локальні onError у критичних місцях; `defaultOptions: { queries: { staleTime: 60_000, retry: 2 } }`.

## [x] H5. Секундний таймер на корені екрана + 1 `React.memo` на 130 компонентів

📁 `useActiveWorkoutScreen.ts:45,96–103`; `active-workout.tsx`; `ExerciseListSection.tsx:78–99`

🚨 `elapsed` оновлюється щосекунди на рівні всього екрана → повний ререндер усіх карток/рядків/інпутів 60 разів на хвилину, годину поспіль (плюс на кожен символ у полі ваги). `ExerciseListSection` передає в кожну картку ~14 інлайнових замикань — memo все одно не спрацював би.

💡 Ізолювати таймер в окремий компонент; `React.memo` на `ExerciseLogCard`/`LogSetRow`; передавати `exIdx` пропом + стабільні колбеки замість інлайн-обгорток; розділити контекст на State/Actions.

## [x] H6. «Бог-ефект» на 120 рядків: мутація кешу react-query і fire-and-forget POST-и всередині useEffect

📁 `useActiveWorkoutScreen.ts:96–217` (автор лишив `//TODO виправити, бо тут піздєц`)

🚨 (1) `workoutQuery.data.logExercises.sort(...)` — **сортування на місці = мутація кешу TanStack Query** (ламає structural sharing, інші підписники отримують переставлені дані без ререндера). (2) Асинхронні POST-и створення сетів усередині ефекту, без скасування: refetch/вихід з екрана — і `Promise.all` падає наполовину виконаним. (3) Три ref-и-прапорці + `eslint-disable exhaustive-deps`.

💡 Мінімум: `[...logExercises].sort(...)`; POST-и — в імперативний флоу додавання вправи. Правильно: prefill-сети створює бекенд транзакційно в `POST /workouts/:id/exercises`.

## [x] H7. Брутфорс не обмежений; JWT 7 днів без відкликання й без перевірки існування користувача

📁 `auth.module.ts:18`; `jwt.strategy.ts:21–23`; немає `@nestjs/throttler`

🚨 `login` — необмежений підбір пароля. `validate()` не звертається до БД: токен видаленого користувача валідний до 7 днів; зміна пароля сесій не інвалідовує.

💡 `ThrottlerModule` (10/хв) + перевірка існування користувача у `validate()`; далі — пара access 15 хв + refresh із ротацією.

---

# 🟡 Medium

## [ ] M1. Рантайм-залежності застосунків у кореневому `package.json`

📁 `package.json" (корінь): `react`, `react-native`, `expo`, `date-fns`, `rxjs`, `expo-router`
🚨 Дублювання версій із воркспейсами — два джерела правди; для RN дві копії react = «Invalid hook call».
💡 Корінь — лише тулінг; конфлікти hoisting вирішувати через `overrides`.

## [ ] M2. Turbo-пайплайн від Next.js: кеш збірки не працює

📁 `turbo.json:5–9` — `outputs: [".next/**"]`, артефакти ж у `dist/**`
🚨 Cache hit відновлює «нічого»; задачі `test` немає в графі.
💡 `outputs: ["dist/**"]`, додати `test` із `dependsOn: ["^build"]`.

## [ ] M3. `tsconfig.base.json` мертвий для 2 із 3 воркспейсів; API без повного strict

📁 `apps/api/tsconfig.json` — лише `strictNullChecks` + `noImplicitAny`
💡 `extends` базу, `strict: true` + `strictPropertyInitialization: false` (для TypeORM-ентіті).

## [ ] M4. Mobile не лінтиться взагалі; CI відсутній

📁 `apps/mobile" без eslint-конфіга; `.github/workflows` немає
🚨 Без `eslint-plugin-react-hooks` пропущені deps `useEffect` ніщо не ловить (а вони є — H6).
💡 `eslint-config-expo` + мінімальний GitHub Actions: `npm ci` → `turbo run build lint check-types test`.

## [ ] M5. `legacy-peer-deps=true` глобально приховує конфлікти залежностей

📁 `.npmrc`
💡 Прибрати; розв'язати реальні конфлікти точковими `overrides`.

## [x] M6. Відсутні індекси на FK-колонках (Postgres їх не створює сам)

📁 `athlo-db.sql`: `log_meal_items.log_meal_id`, `nutrition_facts.food_id`, `template_exercises.workout_template_id`, `template_sets.template_exercise_id`, `plan_days/plan_meals/plan_meal_items`, `user_achievements.achievement_id`, `exercises.user_id` та ін.
🚨 Кожен CASCADE — seq scan; JOIN-и деградують із ростом даних.
💡 Індекс на кожну FK-колонку, що бере участь у JOIN/CASCADE.

## [ ] M7. Статуси як VARCHAR без CHECK; дві конкурентні стратегії довідкових значень; магічні числа visibility по всьому коду

📁 `athlo-db.sql` (`workouts.status`, `user_friends.status` без CHECK; lookup-таблиці з `DEFAULT 1`); `workout.service.ts:53–56`, `meal-plan.service.ts:88,121,157,210–227`; `useWorkoutSummaryScreen.ts:53–58` (клієнтська мапа 1/2/3)
🚨 БД прийме `status='BANANA'`; `[2] // PUBLIC` повторено в 6+ місцях двох модулів + на клієнті; зміна правил доступу = правки скрізь.
💡 VARCHAR + CHECK з shared-енумами як єдиним джерелом правди; один `VisibilityPolicyService` (`visibleTo(viewerId, ownerId)`).

## [ ] M8. Каскадний ланцюг тихо знищує історію рекордів (PR)

📁 `athlo-db.sql:410–411, 432, 427`
🚨 Видалення одного тренування каскадом зносить `user_exercise_records` (all-time PR), хоча `user_achievements` лишаються. Хард-деліт вправи зніс би й зароблені досягнення.
💡 `user_exercise_records.log_set_id → ON DELETE SET NULL`; `achievements.exercise_id → RESTRICT`.

## [ ] M9. Відсутні бізнес-інваріанти в БД

📁 `user_workout_templates" (немає `UNIQUE(user_id, template_id)`), `workouts` (можливі кілька IN_PROGRESS; немає `CHECK ended_at >= started_at`)
💡
```sql
CREATE UNIQUE INDEX uq_user_saved_template ON user_workout_templates (user_id, workout_template_id);
CREATE UNIQUE INDEX uq_one_active_workout ON workouts (user_id) WHERE status = 'IN_PROGRESS';
ALTER TABLE workouts ADD CONSTRAINT chk_workout_time CHECK (ended_at IS NULL OR ended_at >= started_at);
```

## [ ] M10. Змішаний нейминг у shared-контракті: `started_at` поруч із `avgHeartRate`

📁 `workout.interface.ts:9–10` (також `isPR` ↔ `is_pr`)
🚨 Аномалію мусять відтворювати ентіті, серіалізація і фронт — будь-який ручний мапінг тихо дає `undefined`.
💡 camelCase у контракті; снейк — лише в БД через `@Column({ name })`.

## [ ] M11. DTO без верхніх меж + body-ліміт 5 МБ + base64-аватар у БД

📁 `register.dto.ts" (немає `@MaxLength`); `main.ts:10–11`; `users.avatar TEXT`
🚨 Нікнейм на 300 символів = 500 із БД; 5-мегабайтні «імена»; роздута таблиця users.
💡 `@MaxLength` скрізь; аватар — у сторадж, у БД — URL; ліміт body назад до 1 МБ.

## [ ] M12. Ручне «віднімання» `password_hash` у 4 місцях (одне вже відмовило — C1)

📁 `auth.service.ts`, `user.service.ts` (×3)
💡 `select: false` на колонці або `@Exclude` + глобальний `ClassSerializerInterceptor` — один механізм замість патерну.

## [ ] M13. Досягнення рахуються синхронно в запиті завершення тренування

📁 `workout.service.ts:233–239`
🚨 Латентність `complete` росте з історією користувача; виняток в achievements → 500 на вже збереженому тренуванні → ретрай клієнта.
💡 Мінімум try/catch + logger; правильно — подія `workout.completed` через `@nestjs/event-emitter`.

## [ ] M14. Порушення меж модулів

📁 `nutrition-log.service.ts:12–13" (репозиторії `UserEntity`, `BodyMetricEntity` чужого модуля), `workout.service.ts:18`, `meal-plan.service.ts:22`
🚨 Папки обіцяють «сервіси» (`user-service`, `workouts-service`), зв'язність — монолітна; циклічні залежності — питання часу.
💡 Чужі дані — лише через експортований сервіс модуля-власника; соціальний граф — в окремий модуль. Або чесно перейменувати модулі (`users`, `workouts`, `nutrition`).

## [ ] M15. Списки тренувань тягнуть повне дерево relations; `useGetWorkouts` із `limit: 1000`

📁 `workout.service.ts:58–123`; `useWorkoutAPI.ts:16–26`
🚨 Для екрана-списку вантажаться всі вправи × сети × досягнення (сотні JOIN-рядків на сторінку); паралельно клієнт має хук, що тягне до 1000 тренувань одним запитом.
💡 Полегшений список (агрегати через підзапити), повне дерево — лише в `findOne`; споживачів `useGetWorkouts` перевести на infinite/зведення.

## [ ] M16. 401-інтерсептор реагує і на `/auth/login`; довідники без `staleTime`

📁 `api-client.ts:19–29`; `_layout.tsx:16`
💡 Виключити auth-роути з глобального 401-хендлера; довідникам (м'язи, обладнання, типи) — `staleTime: Infinity`.

## [ ] M17. «Товстий» `ActiveWorkoutContext`: кожен символ ререндерить усіх споживачів

📁 `ActiveWorkoutContext.tsx:254–275`
🚨 Дані + 12 колбеків в одному value; `useMemo` залежить від `state` цілком.
💡 Розділити на StateContext + ActionsContext (колбеки вже стабільні — структура готова).

## [x] M18. PATCH на кожен символ без debounce, `.then` без `.catch`, оптимістичні оновлення без відкату

📁 `useActiveWorkoutScreen.ts:257–277, 336–424`
🚨 «102.5» = 5 PATCH-ів, кожен запускає повний перерахунок рекордів на бекенді; out-of-order відповіді перезаписують `isPR`; збій лишає чекбокс у неправильному стані назавжди.
💡 Debounce 500–800 мс + токен останнього запиту; відкат у catch + тост; перерахунок PR перенести на complete.

## [ ] M19. `workout-summary.tsx` — God-компонент на 578 рядків

📁 `app/(app)/(workout)/workout-summary.tsx`; `useWorkoutSummaryScreen.ts` (useCallback зі ~20 deps)
🚨 Перегляд + редагування + picker-и + PR-шторка; `local*`-стейти — паралельна копія server state, синхронізована вручну в 5 місцях.
💡 Розділити на View + EditForm (форма зі своїм станом, монтується лише в edit-режимі).

## [ ] M20. Таймзони: «день» користувача рахується в таймзоні сервера

📁 `athlo-db.sql:351–352" (`day_log_date DEFAULT CURRENT_DATE`); `nutrition-log.service.ts:173–180` (`T00:00:00` локально, `23:59:59` губить мс); `user.service.ts` (`MoreThanOrEqual(today)`)
🚨 Вечеря о 00:30 за Києвом потрапляє у «вчора»; добові підсумки з'їжджають на межі доби.
💡 Клієнт зобов'язаний передавати локальну дату (`day_log_date NOT NULL` без дефолта); межі діб — піврозчинені інтервали `[start, nextDay)`.

---

# 🟢 Low

| # | Проблема | Локація | Рішення |
|---|---|---|---|
| L1 | [ ] Мертві `App.tsx` + `index.ts` із шаблону (entry — `expo-router/entry`) | `apps/mobile` | Видалити |
| L2 | [ ] Зайвий `app.json` у корені репо | корінь | Видалити; `android.package` — у `apps/mobile/app.json` |
| L3 | [ ] Windows-only `clean: rmdir /s /q` | `packages/shared/package.json` | `rimraf` / `fs.rmSync` |
| L4 | [ ] Дрейф TypeScript: 5.9.2 (корінь) vs `^5.7.3`→5.9.3 (api) | package.json-и | Зафіксувати одну версію |
| L5 | [ ] `users`: `age` замість `birth_date` (BMR «протухає»); немає `created_at`; email/nickname регістрозалежні | `athlo-db.sql:5–19` | `birth_date DATE`; `created_at`; `UNIQUE INDEX ON users (LOWER(email))` |
| L6 | [ ] `calculateGoals`: дефіцит −500 без нижньої межі (можливі цілі < 1000 ккал) | `calculations.ts:47–53` | Кламп: 1500 (чол.) / 1200 (жін.) |
| L7 | [ ] Цілі по калоріях ніде не зберігаються — лише макроси | `settings`, `daily_goals` | Додати `calorie_goal` |
| L8 | [ ] `JWT_SECRET` із fallback `change-me-in-production`; api без healthcheck | `docker-compose.yml:32` | `${JWT_SECRET:?required}`; healthcheck |
| L9 | [ ] `enableCors()` = `*`; `ssl: { rejectUnauthorized: false }`; floating `bootstrap()`; Swagger у prod; немає shutdown hooks | `main.ts`, `typeorm.config.ts` | Allowlist; CA-серт; `.catch`+exit; умовний Swagger; `enableShutdownHooks()` |
| L10 | [ ] Guard продубльований на 14 контролерах — opt-in security | усі контролери | Глобальний `APP_GUARD` + `@Public()` на auth |
| L11 | [ ] Два формати пагінації: `{data, meta}` vs `{items, total}` | workouts vs meal-plans | Уніфікувати на `IPaginatedResponse` |
| L12 | [ ] Патерн «findOne → 404 → ownership → 403» скопійований ~15 разів | сервіси | Хелпер `findOwnedOrFail()` |
| L13 | [ ] Тимчасові id сетів `Date.now() + Math.random()` у полі серверного id | `ActiveWorkoutContext.tsx:147` | Окреме поле `localKey` |
| L14 | [ ] `useAuth().user` застигає на moment логіна (редагування профілю не оновлює) | `AuthContext.tsx:56–59` | Джерело правди — query `profileKeys.me` |
| L15 | [ ] Хардкод українською `'Незаповнений підхід'` посеред англомовного UI | `LogSetRow.tsx:115` | Єдиний словник рядків |
| L16 | [ ] `any`: `achievement?: any`, `useState<any>` — при існуючому `IAchievement` | `LogSetRow.tsx:23`, `active-workout.tsx:54` | Типізувати |
| L17 | [ ] `keyExtractor` з index → ремаунти при зміні фільтра | `exercise-picker.tsx:165–167` | Лише `id` |
| L18 | [ ] 35-рядковий блок форматування PR скопійований 2×; споріднені switch-і ще у 2 місцях | `active-workout.tsx:70–105` ≈ `useActiveWorkoutScreen.ts:386–414`; `LogSetRow.tsx` | Утиліта `formatSetValue(trackingType, set)` (підходить і для shared) |
| L19 | [ ] `console.log` токен-операцій та API-помилок у проді; штучний `setTimeout(500)` на старті | `auth.ts`, `api-client.ts:22`, `_layout.tsx:25–30` | `if (__DEV__)`; видалити затримку |
| L20 | [ ] Імпорт без `.js` у ESM-пакеті (рятує лише `import type`) | `workout.interface.ts:1` | Додати розширення |

---

# ℹ️ Що зроблено добре

- **Схема БД:** розділення plan/log, шаблони як окремий агрегат, partial unique індекси (ETL-ідемпотентність, «один активний мил-план»), composite-індекси під типові вибірки, soft-delete довідників.
- **Бекенд:** канонічний NestJS DI (`forRootAsync` + `ConfigService`, `getOrThrow`), `synchronize: false`, чисті контролери, **повне guard-покриття всіх 14 контролерів**, послідовні перевірки ownership (IDOR не знайдено), achievement-логіка вміє відкликати рекорди при перерахунку.
- **Mobile:** фабрики query-keys зразкові (інвалідація префіксами працює коректно), токен у SecureStore, dev-URL через `Constants.expoConfig.hostUri`, віртуалізовані `InfiniteList` для довгих списків, патерн `makeStyles(colors)` + `useMemo`, дисциплінований `useCallback` із функціональними `setState`.
- **Монорепо:** сама структура (Turborepo + workspaces + shared-пакет) — правильний вибір; Dockerfile — коректний multi-stage під монорепо.
