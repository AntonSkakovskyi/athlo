# Figma Design Plan — Вкладка «Тренування» (Workouts Tab)

Цей документ описує всі екрани, компоненти та стани, які потрібно створити у Figma для вкладки тренувань. Дизайн є джерелом істини для фронтенду.

> **UI Language**: English (all labels, buttons, texts in the app must be in English)
> **App Name**: Athlo
> **Primary Color**: `#2BDE6A` (extracted from logo icon)
> **Background Color**: `#0A0906` (dark theme)

---

## 📐 Загальна структура навігації

Додаток має **3 основні таби** (Bottom Tab Bar):
| Таб | Іконка | Роут |
|---|---|---|
| Тренування | 🏋️ | `/(app)/workouts` |
| Харчування | 🍎 | `/(app)/(nutrition)` |
| Профіль | 👤 | `/(app)/(profile)` |

> Таб "Тренування" є **головним** (default) і відображається першим при вході в додаток.

---

## 🗂️ Перелік екранів для вкладки «Тренування»

### Screen 1: `workouts.tsx` — Головний екран тренувань
**Роль**: Точка входу у вкладку. Дає швидкий доступ до старту тренування та управління шаблонами.

#### Секції (зверху вниз):

**1.1 Header**
- Заголовок: "Тренування"
- (Опціонально) аватар користувача справа

**1.2 Quick Actions (горизонтальні карточки або кнопки)**
- **«Пусте тренування»** — створити тренування з нуля (без шаблону). Натискання → перехід на `ActiveWorkout` з порожнім списком вправ.
- **«Із шаблону»** — перехід на екран `templates.tsx` для вибору шаблону.

**1.3 Мої шаблони (горизонтальний скрол або вертикальний список)**
- Відображає список шаблонів користувача (`UserWorkoutTemplate`).
- Кожен елемент — `TemplateCard`:
  - Назва шаблону
  - Кількість вправ (число)
  - Основні м'язові групи (теги/чіпи)
  - Кнопка **▶ Розпочати** — створює `Workout` з шаблону і переходить на `ActiveWorkout`
- Внизу списку — кнопка **«+ Додати шаблон»** → перехід на `templates.tsx`
- **Empty State**: Якщо шаблонів немає — ілюстрація + текст "У вас ще немає шаблонів" + кнопка "Переглянути шаблони"

**1.4 Історія тренувань (вертикальний список)**
- Останні завершені тренування (`Workout` зі статусом `COMPLETED`)
- Кожен елемент — `WorkoutHistoryCard`:
  - Назва тренування
  - Дата (formatted)
  - Тривалість (endedAt - startedAt)
  - Загальний обʼєм (сума weight × reps по всіх сетах)
  - Кількість вправ
- Натискання → перехід на `WorkoutSummary`
- Пагінація або "Показати більше"
- **Empty State**: "Ви ще не тренувались" + кнопка "Розпочати перше тренування"

---

### Screen 2: `templates.tsx` — Бібліотека шаблонів
**Роль**: Перегляд, пошук та збереження шаблонів тренувань.

#### Секції:

**2.1 Header**
- Заголовок: "Шаблони"
- Кнопка **«+ Створити»** (створити новий порожній шаблон → перехід на `template/[id].tsx`)

**2.2 Tabs / Segment Control**
Три підвкладки:
| Підвкладка | Дані |
|---|---|
| **Мої** | Шаблони, створені користувачем (`creator_id = current_user`) |
| **Збережені** | Шаблони, додані через `user_workout_templates` |
| **Публічні** | Шаблони з `visibility_type = PUBLIC` від інших користувачів |

**2.3 Пошук та Фільтри**
- **Search Input**: Пошук за назвою шаблону
- **Фільтри** (горизонтальний скрол чіпів або bottom sheet):
  - За м'язовою групою (chest, back, legs...) — на основі `muscles` таблиці
  - За обладнанням (barbell, dumbbell, cable...) — на основі `equipments` таблиці
  - За видимістю (тільки для вкладки "Мої"): Private / Public / Friends Only

**2.4 Список шаблонів**
Кожен елемент — `TemplateCard` (variant залежно від вкладки):
- **Мої шаблони**:
  - Назва, опис (truncated), кількість вправ
  - Іконка visibility (🔒 / 🌐 / 👥)
  - Actions: **▶ Розпочати** | **✏️ Редагувати** | **🗑️ Видалити**
- **Збережені**:
  - Назва, опис, автор (`@nickname`)
  - Actions: **▶ Розпочати** | **❌ Видалити зі збережених**
- **Публічні**:
  - Назва, опис, автор (`@nickname`)
  - Actions: **▶ Розпочати** | **💾 Зберегти**

**Empty States**:
- Мої: "Створіть свій перший шаблон"
- Збережені: "Збережіть шаблон з публічної бібліотеки"
- Публічні: "Не знайдено шаблонів" (при фільтрації)

---

### Screen 3: `template/[id].tsx` — Деталі / Редагування шаблону
**Роль**: Перегляд та редагування вмісту конкретного шаблону.

#### Секції:

**3.1 Header**
- Назва шаблону (editable inline)
- Кнопка **«Зберегти»** (якщо є зміни)
- Кнопка **«▶ Розпочати тренування»**

**3.2 Metadata**
- Опис (editable, multiline)
- Видимість (dropdown: Private / Public / Friends Only)

**3.3 Список вправ у шаблоні**
Для кожної `TemplateExercise` (відсортовано за `order`):
- **TemplateExerciseCard**:
  - Назва вправи (`exercise.name`)
  - Обладнання (`exercise.equipment.name`)
  - Час відпочинку (`restTime` секунд)
  - Список сетів (`TemplateSet[]`):
    - Кожен сет відображає заплановані значення:
      - Для `WEIGHT_AND_REPS`: `weight` кг × `reps` разів
      - Для `REPS_ONLY`: `reps` разів
      - Для `TIME_BASED`: `duration` секунд, `distance` м (якщо є)
  - Кнопка **«+ Додати сет»**
  - Swipe/Long-press → **Видалити вправу**
  - Drag handle для reorder

**3.4 Footer**
- Кнопка **«+ Додати вправу»** → відкриває `ExercisePicker`

---

### Screen 4: `active-workout.tsx` — Активне тренування
**Роль**: Головний робочий екран під час тренування. Відображає поточний прогрес.

> **Цей екран є Stack screen, а не Tab screen** — він відкривається поверх табів.

#### Секції:

**4.1 Top Bar (sticky)**
- Кнопка **«✅ Завершити тренування»** (权вий верхній кут)
- Назва тренування (editable)

**4.2 Stats Bar (sticky, під top bar)**
Три метрики в рядок:
| Метрика | Значення | Іконка |
|---|---|---|
| Тривалість | `HH:MM:SS` (live timer від `startedAt`) | ⏱️ |
| Загальний обʼєм | Сума `weight × reps` по завершених сетах (кг) | 🏋️ |
| Завершені сети | `completed / total` | ✅ |

**4.3 Список вправ (scrollable)**
Для кожної `LogExercise` (відсортовано за `order`):

- **ActiveExerciseCard**:
  - **Header вправи**:
    - Назва вправи (`exercise.name`)
    - Кнопка **📝 Нотатка** (toggle notepad) → текстовий інпут для `notes`
    - Кнопка **⏱️ Таймер** (якщо `restTime > 0`) → запуск таймера відпочинку
  
  - **Таблиця сетів** (колонки залежать від `trackingType`):
    
    Для **WEIGHT_AND_REPS**:
    | # | Попередній | Вага (кг) | Рази | ✅ |
    |---|---|---|---|---|
    | 1 | 60×10 | [input] | [input] | ☐ |
    | 2 | 60×8 | [input] | [input] | ☐ |
    
    Для **REPS_ONLY**:
    | # | Попередній | Рази | ✅ |
    |---|---|---|---|
    | 1 | 15 | [input] | ☐ |
    
    Для **TIME_BASED**:
    | # | Попередній | Тривалість | Дистанція | ✅ |
    |---|---|---|---|---|
    | 1 | 30:00 / 5km | [input] | [input] | ☐ |
    
    - Колонка **«Попередній»**: дані з останнього аналогічного тренування (останній `LogSet` для цієї вправи цього юзера)
    - Колонка **«✅»**: Чекбокс `isCompleted`. При натисканні — рядок візуально підсвічується як завершений.
    - Інпути попередньо заповнені з шаблону (якщо тренування створено з шаблону)
  
  - Кнопка **«+ Додати сет»** під таблицею

- **Між вправами**: роздільник або відступ

**4.4 Footer Actions**
- Кнопка **«+ Додати вправу»** → відкриває `ExercisePicker`
- Кнопка **«❌ Скасувати тренування»** (danger, з confirmation alert)

**4.5 Rest Timer (overlay / bottom sheet)**
Відображається після натискання ⏱️ або після завершення сетаь(якщо restTime задано):
- Countdown timer (кругова анімація)
- Час, що залишився (великі цифри)
- Кнопки: **«+15с»**, **«-15с»**, **«Пропустити»**
- Звуковий сигнал / вібрація при завершенні

---

### Screen 5: `exercise-picker.tsx` — Вибір вправи
**Роль**: Modal / full-screen екран для пошуку та вибору вправи при додаванні до тренування або шаблону.

> **Відкривається як Modal (Stack screen з `presentation: 'modal'`).**

#### Секції:

**5.1 Header**
- Заголовок: "Обрати вправу"
- Кнопка **«Скасувати»** (закрити modal)

**5.2 Search**
- **Search Input**: Пошук за назвою вправи (`exercise.name`)
- Debounced search (300ms)

**5.3 Фільтри (горизонтальний скрол чіпів)**
- **За м'язами** (`muscles`): Chest, Back, Shoulders, Biceps, Triceps, Legs, Core, etc.
- **За обладнанням** (`equipments`): Barbell, Dumbbell, Cable, Machine, Bodyweight, etc.
- Активні фільтри візуально виділені (filled chip vs outlined)
- Можливість множинного вибору
- Кнопка **«Скинути фільтри»** (якщо є активні)

**5.4 Список вправ**
- `ExerciseListItem`:
  - Назва вправи
  - Обладнання (badge/tag)
  - Основні м'язи (мілкі теги: "Chest, Front Delt")
  - Тип трекінгу (іконка: 🏋️ / 🔄 / ⏱️)
- Натискання на вправу → виділення (radio / checkbox для multiple)
- Alphabetical sorting або групування за м'язами

**5.5 Footer (sticky)**
- Кнопка **«Додати вправу (N)»** — де N = кількість вибраних
  - Disabled якщо нічого не вибрано
- Закриває modal і повертає вибрані вправи на попередній екран

---

### Screen 6: `workout-summary.tsx` — Підсумок тренування
**Роль**: Відображається після завершення тренування або при перегляді з історії.

#### Секції:

**6.1 Header**
- Назва тренування
- Дата та час
- Кнопка **«Назад»** (до списку або головного екрану)

**6.2 Overview Cards (горизонтальний скрол або grid 2×2)**
| Метрика | Значення |
|---|---|
| Тривалість | `HH:MM:SS` |
| Загальний обʼєм | `XXXX кг` |
| Кількість вправ | `N` |
| Кількість сетів | `N` (completed only) |

**6.3 Опціональні метрики (якщо заповнені)**
- RPE: 1-10 шкала (візуальна)
- Самопочуття: 1-5 (emoji або зірки: 😫😐😊😄🔥)
- Калорії: `XXX kcal`
- Пульс: `avg / max bpm`

**6.4 Список вправ з результатами**
Для кожної вправи:
- Назва вправи
- Notes (якщо є)
- Таблиця сетів (тільки завершені):
  - `#` | Вага | Рази | (або відповідні колонки за типом)
  - Найкращий сет виділений (наприклад, max weight × reps)

**6.5 Footer**
- Кнопка **«Зберегти як шаблон»** (якщо тренування без шаблону)
- Кнопка **«Поділитися»** (optional, phase 2)

---

### Screen 7: Finish Workout Modal — Завершення тренування
**Роль**: Modal що зʼявляється при натисканні «Завершити тренування» на `ActiveWorkout`.

#### Секції:

**7.1 Summary preview**
- Тривалість, обʼєм, кількість сетів

**7.2 Optional inputs**
- RPE selector (1-10, slider або кнопки)
- Feeling score (1-5, emoji selector)
- Calories (number input)
- Avg Heart Rate (number input)
- Max Heart Rate (number input)

**7.3 Actions**
- **«Завершити»** → зберігає, закриває, переходить на `WorkoutSummary`
- **«Повернутися»** → закриває modal, повертає на `ActiveWorkout`

---

## 🔔 Floating Mini Player — Плаваюче вікно активного тренування

**Роль**: Відображається над tab bar, коли користувач покидає екран `ActiveWorkout` під час активного тренування (навігація на інші таби).

#### Структура:
```
┌──────────────────────────────────────────────┐
│ 🏋️ Push Day          ⏱️ 45:23    ❌ Close  │
│ ↳ Bench Press — Set 3/5                      │
└──────────────────────────────────────────────┘
                    [Tab Bar]
```

- **Назва тренування** (bold)
- **Поточний таймер** (live)
- **Поточна вправа та сет** (subtitle)
- **Кнопка ❌** — Confirmation alert: "Скасувати тренування?"
- **Натискання на весь блок** → повернення на екран `ActiveWorkout`
- **Стиль**: Floating card з тінню, border-radius, фіксований над tab bar
- Висота: ~56-64pt
- Горизонтальний Auto Layout, fill container width з margin 16px

---

## 🧱 Компоненти для створення у Figma (Component Library)

Перелік атомів та молекул, які потрібно створити як Figma Components із варіантами:

### Atoms (базові елементи)
| Компонент | Варіанти | Props |
|---|---|---|
| `Button` | Primary, Secondary, Danger, Ghost | Label, Icon (bool), Disabled (bool), Loading (bool) |
| `Input` | Default, Focused, Error, Disabled | Label, Placeholder, Value, HelperText |
| `Checkbox` | Unchecked, Checked, Disabled | — |
| `Chip` | Default, Active | Label, Icon (bool), Closable (bool) |
| `Badge` | Info, Success, Warning | Label |
| `IconButton` | Default, Active, Disabled | Icon |
| `Avatar` | Small (32), Medium (40), Large (56) | Image, Initials |
| `Divider` | Horizontal, Vertical | — |
| `TabItem` | Active, Inactive | Label, Icon |

### Molecules (складені елементи)
| Компонент | Опис |
|---|---|
| `TemplateCard` | Картка шаблону (назва, опис, мʼязи, actions). Variants: My / Saved / Public |
| `WorkoutHistoryCard` | Картка тренування в історії (назва, дата, тривалість, обʼєм) |
| `ActiveExerciseCard` | Блок вправи в ActiveWorkout (header + таблиця сетів + add set) |
| `SetRow` | Рядок сету (номер, попередній, інпути, чекбокс). Variants: WeightReps / RepsOnly / TimeBased / Completed |
| `ExerciseListItem` | Елемент списку вправ для ExercisePicker (назва, обладнання, мʼязи) |
| `StatsBar` | Горизонтальна панель з 3 метриками (duration, volume, sets) |
| `RestTimerOverlay` | Overlay з countdown таймером відпочинку |
| `FloatingWorkoutMini` | Плаваюче вікно активного тренування над tab bar |
| `SegmentControl` | Перемикач підвкладок (My / Saved / Public) |
| `SearchBar` | Поле пошуку з іконкою та кнопкою очищення |
| `FilterChipRow` | Горизонтальний скрол з фільтр-чіпами |
| `EmptyState` | Ілюстрація + заголовок + опис + CTA кнопка |
| `ConfirmationAlert` | Діалог підтвердження дії (delete, cancel workout) |
| `MetricCard` | Квадратна/прямокутна картка метрики (іконка, значення, label) |
| `RpeSelector` | Selector RPE 1-10 (кнопки або slider) |
| `FeelingSelector` | Selector самопочуття 1-5 (emoji) |
| `TabBar` | Нижня панель навігації (3 таби) з підтримкою FloatingWorkoutMini |

---

## 🎯 User Flows (послідовність екранів)

### Flow 1: Старт порожнього тренування
```
workouts.tsx → [натиснути "Пусте тренування"]
  → active-workout.tsx (порожній список)
    → [+ Додати вправу] → exercise-picker.tsx (modal)
      → [обрати вправу] → повернення на active-workout.tsx
    → [логувати сети, відмічати чекбокси]
    → [Завершити] → finish-workout-modal
      → workout-summary.tsx
```

### Flow 2: Старт тренування з шаблону
```
workouts.tsx → [натиснути ▶ на шаблоні]
  → active-workout.tsx (предзаповнені вправи та сети з шаблону)
    → [логувати, додавати вправи/сети]
    → [Завершити] → finish-workout-modal
      → workout-summary.tsx
```

### Flow 3: Пошук та збереження публічного шаблону
```
workouts.tsx → [Із шаблону]
  → templates.tsx → [таб "Публічні"]
    → [пошук + фільтри]
    → [💾 Зберегти] → шаблон додається до "Збережених"
    → [▶ Розпочати] → active-workout.tsx
```

### Flow 4: Вихід з активного тренування + повернення
```
active-workout.tsx → [натиснути таб "Харчування"]
  → з'являється FloatingWorkoutMini над tab bar
    → [натиснути на FloatingWorkoutMini]
      → повернення на active-workout.tsx
```

### Flow 5: Скасування тренування
```
active-workout.tsx → [Скасувати тренування]
  → ConfirmationAlert ("Ви впевнені?")
    → [Підтвердити] → видалення workout, повернення на workouts.tsx
    → [Скасувати] → залишитися на active-workout.tsx
```

---

## 📋 Стани екранів (States to design)

Для кожного екрану потрібно створити варіанти:

| Екран | Стани |
|---|---|
| `workouts.tsx` | Default, Empty (no templates + no history), Loading |
| `templates.tsx` | Default (кожен таб), Empty (кожен таб), Search results, No results |
| `template/[id].tsx` | View mode, Edit mode, Empty (no exercises) |
| `active-workout.tsx` | Empty (no exercises), In progress, With rest timer, With note open |
| `exercise-picker.tsx` | Default, Filtered, No results, With selection |
| `workout-summary.tsx` | Full data, Minimal data (no optional metrics) |
| `FloatingWorkoutMini` | Default, Different exercise states |

---

## 📏 Відповідність до сутностей БД

| Figma Component | DB Entity | Ключові поля |
|---|---|---|
| `TemplateCard` | `workout_templates` + `template_exercises` | name, description, visibility_type_id |
| `ActiveExerciseCard` | `log_exercises` | exercise_id, order, notes, restTime |
| `SetRow` | `log_sets` | weight, reps, duration, distance, isCompleted, order |
| `ExerciseListItem` | `exercises` + `exercise_muscles` | name, equipment_id, tracking_type_id |
| `WorkoutHistoryCard` | `workouts` | name, started_at, ended_at, status |
| `FloatingWorkoutMini` | `workouts` (status=IN_PROGRESS) | name, started_at |
| `FilterChip (muscles)` | `muscles` | name |
| `FilterChip (equipment)` | `equipments` | name |
| `StatsBar` | Aggregated from `log_sets` | Σ(weight×reps), count(isCompleted) |

---

## 🔧 Порядок створення у Figma

### Етап 1: Foundations
1. Визначити палітру кольорів (Variables)
2. Створити типографічні стилі
3. Визначити spacing tokens

### Етап 2: Atoms
4. Button (всі варіанти)
5. Input
6. Checkbox
7. Chip
8. Badge, IconButton, Avatar, Divider, TabItem

### Етап 3: Molecules
9. SearchBar
10. FilterChipRow
11. SegmentControl
12. SetRow (3 tracking type варіанти)
13. TemplateCard (3 варіанти)
14. ExerciseListItem
15. ActiveExerciseCard
16. WorkoutHistoryCard
17. StatsBar
18. MetricCard
19. RestTimerOverlay
20. FloatingWorkoutMini
21. EmptyState
22. RpeSelector, FeelingSelector
23. TabBar

### Етап 4: Screens
24. `workouts.tsx` (+ empty state)
25. `templates.tsx` (3 таби + empty states)
26. `template/[id].tsx`
27. `active-workout.tsx` (+ rest timer overlay)
28. `exercise-picker.tsx`
29. `workout-summary.tsx`
30. Finish Workout Modal

### Етап 5: Prototyping
31. Зв'язати екрани переходами
32. Додати анімації (rest timer, floating mini)
