# React Native & Expo — Development Standards

> This document defines code quality, architecture, and structure standards for scalable and maintainable mobile development. Follow these rules when generating any frontend code.

---

## 1. Architecture & Project Structure

### 1.1 Feature-based Organization
Organize code by domain/feature, not by type:

```
apps/mobile/
├── app/                        # Expo Router pages (screens only)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── login/
│   │       └── components/     # Screen-specific components
│   │           ├── LoginForm.tsx
│   │           └── SocialButtons.tsx
│   └── (app)/
│       ├── (workout)/
│       │   ├── index.tsx
│       │   ├── active-workout.tsx
│       │   └── active-workout/
│       │       └── components/
│       │           ├── WorkoutHeader.tsx
│       │           └── ExerciseList/
│       ├── (nutrition)/
│       ├── (profile)/
│       └── _layout.tsx
├── components/
│   ├── ui/                     # Atomic, reusable primitives
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Typography/
│   │   ├── LineChartBlock/
│   │   └── ... (24+ atomic components)
│   └── shared/                 # Shared feature-level components (if needed)
├── features/                   # Feature modules (self-contained)
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/              # Screen-specific hooks
│   │   ├── services/           # API services
│   │   └── types.ts
│   ├── nutrition/
│   │   ├── components/
│   │   │   ├── DailyMacrosSummary/
│   │   │   ├── WaterTracker/
│   │   │   ├── PlanMealCard/
│   │   │   ├── CreateFoodModal/
│   │   │   └── FoodDetailPanel/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── profile/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   └── workout/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── types.ts
│       └── index.ts
├── hooks/                      # Global/shared hooks
│   └── api/                    # Centralized API hooks (all mutations + queries)
│       ├── useAuthAPI.ts
│       ├── useWorkoutAPI.ts
│       ├── useMealPlanAPI.ts
│       ├── useExerciseAPI.ts
│       └── ... (20 API hooks)
├── contexts/                   # Global context providers
│   ├── AuthContext.tsx
│   ├── ActiveWorkoutContext.tsx
│   └── ...
├── services/                   # Global API client, interceptors
│   └── api-client.ts
├── constants/                  # theme.ts, queryKeys.ts, config.ts, api-routes.ts
│   └── theme.ts
├── types/                      # Global shared types (if @athlo/shared not available)
└── utils/                      # Pure utility functions
```

### 1.2 Component Folder Structure (REQUIRED)

Every non-trivial component lives in its own folder named after it. The folder contains the main component file and any sub-components that belong exclusively to it.

**Pattern:**
```
ComponentName/           ← folder (PascalCase)
├── ComponentName.tsx    ← main file (same name as folder)
└── SubComponent/        ← nested child, same pattern recursively
    └── SubComponent.tsx
```

**Example:**
```
WorkoutsList/
├── WorkoutsList.tsx
└── WorkoutsListCard/
    ├── WorkoutsListCard.tsx
    └── WorkoutsListCardBadge.tsx
```

**Rules:**
- The main file always has the same name as the folder.
- Sub-components that are **only** used by this component stay inside the folder.
- Sub-components used in **multiple places** move to `components/shared/` or `features/<feature>/components/`.
- Never mix unrelated components in the same folder.

### 1.3 Screen (Page) Structure

Each screen in `app/` is a thin orchestrator. Screen-specific components live in a sibling `components/` subfolder:

```
app/(app)/
├── workout-detail.tsx           ← screen (orchestrator only)
└── workout-detail/
    └── components/
        ├── WorkoutDetailHeader.tsx
        ├── ExerciseList/
        │   ├── ExerciseList.tsx
        │   └── ExerciseListItem/
        │       └── ExerciseListItem.tsx
        └── WorkoutDetailFooter.tsx
```

**A screen file must:**
- Import and compose components, nothing else.
- Contain no inline styles.
- Contain no business logic — delegate to hooks.
- Be under ~60–80 lines of JSX; extract logic sections to hooks.

### 1.4 Component Decomposition Thresholds

- **Component files > 150 lines** → split into sub-components (folder structure per 1.2)
- **JSX sections > 80 lines** within a component → extract to separate component or custom hook
- **Nested ternaries / conditionals > 3 levels** → extract to computed variables or guards at top
- Apply before comitting; large components slow development and reduce code clarity

---

## 2. Separation of Concerns

| Layer | Location | Responsibility |
|---|---|---|
| **UI** | `components/`, `features/*/components/` | Render only. Receive data via props. |
| **Logic** | `hooks/`, `features/*/hooks/` | State, side effects, API calls via React Query. |
| **Services** | `services/`, `features/*/services/` | Raw API calls (axios/fetch). No UI logic. |
| **Utils** | `utils/` | Pure functions: formatting, calculations, transformations. |
| **Constants** | `constants/` | Theme tokens, query keys, config values. |

> **Rule:** If a function does not render anything, it does not belong in a component file.

---

## 3. TypeScript

- **No `any`** — strictly forbidden. Use `unknown` and narrow types explicitly.
- **No implicit `any`** — enable `strict: true` in `tsconfig.json`.
- **Interfaces for props:** Every component must have a named `Props` interface.
- **API response types:** Every API response must be typed. Store shared models in `types/` or `features/<feature>/types.ts`.
- **Untyped `useState`:** If type cannot be inferred, add explicit generic: `useState<Workout | null>(null)` not `useState(null)`.
- **Type assertions (`as`):** Avoid entirely; use type guards. If unavoidable, add single-line comment explaining why.
- **Discriminated unions** for state variants (e.g., `{ status: 'loading' }` not separate booleans).

```typescript
// ✅ Good
interface WorkoutsListProps {
  workouts: Workout[];
  onPress: (id: string) => void;
  isLoading?: boolean;
}
const [workout, setWorkout] = useState<Workout | null>(null);

// ❌ Bad
const WorkoutsList = (props: any) => { ... }
const [workout, setWorkout] = useState(null);
```

---

## 4. Components & Styling

### 4.1 Styling Rules (ZERO Hardcoded Values)
- **All** styles via `StyleSheet.create()` — never inline `style={{ ... }}`
- **All design tokens** from `constants/theme.ts`: colors, spacing, borderRadius, fontSize, shadows
- Consolidate theme tokens: zero unique border-radius, shadow, or font-weight values across project
- Layout: flexbox always. Fixed pixels only with justification
- Support dark mode via tokens from start

### 4.2 Performance & Responsiveness
- Wrap expensive components in `React.memo()`
- Functions as props → `useCallback`, expensive computations → `useMemo`
- Lists: `keyExtractor` required (never index), `getItemLayout` for long lists, set `initialNumToRender`
- Long `ScrollView` → replace with `FlatList` or `FlashList`
- **Large / Paginated Lists:** If you suspect a list will have a large number of elements or needs pagination, always use the `<InfiniteList>` component from `@/components/ui/InfiniteList/InfiniteList`.
  - **Crucial Rule for InfiniteList:** Never place an `<InfiniteList>` inside a `ScrollView`. If a screen requires content above the list (e.g., profile headers, stat cards), pass that upper content to the `ListHeaderComponent` prop of `<InfiniteList>` instead of wrapping the entire screen in a `ScrollView`. This prevents the "VirtualizedLists should never be nested inside plain ScrollViews" warning and ensures optimal performance.
- **Isolate high-frequency timers:** A `setInterval` that ticks every second must live in its own component with its own `useState`, never in a parent hook/screen. If a screen receives a `startedAt: string` and needs to display elapsed time, create a dedicated `<SomeDuration startedAt={...} />` child component so only that leaf re-renders per tick — not the whole screen tree.
- **Stale-closure rule for derived state:** Never read React state after a synchronous `setState` call and expect fresh values — React batches updates. If you need the post-update value immediately (e.g., to fire an API call), compute it locally from the current state **before** calling `setState`, then use that local variable for downstream work.
- **AsyncStorage persistence for long-lived UX flows:** Any in-memory state that would be catastrophic to lose if the OS kills the process (e.g., an active workout session) must be persisted. Save a recovery key (e.g., `workoutId`) to `AsyncStorage` when the session starts; clear it when it ends. On app boot, check for this key and restore the session from the server.
- Responsive: `useWindowDimensions()` for sizing, `useSafeAreaInsets()` for safe areas

---

## 5. Atomic UI Components (MANDATORY — Replace All Raw Primitives)

> **Rule:** Never write an inline primitive where an atomic component already exists or could exist.

### 5.1 Primitive Replacement Rules
- Raw `<Pressable>`, `<TouchableOpacity>`, `<TouchableHighlight>` rendering text/icon as button → `<Button>`
- Raw `<TextInput>` → wrap with `<Input>` (even simple inputs)
- Styled `<Text>` with fontSize/fontWeight/color → `<Typography variant="...">`
- `<View>` with card pattern (bg + borderRadius + shadow) → `<Card>`
- Loading placeholders (grey boxes, skeleton UI) → `<Skeleton>`
- Empty-state UI (illustration + text + button) → `<EmptyState>`
- Duplicate implementations (multiple "badge" or "chip" versions) → consolidate into one atom

### 5.2 Lookup Algorithm
Before writing any primitive:

1. **Check `components/ui/`** — does a component already exist?
2. **If yes** — import and use it. Do not duplicate.
3. **If no** — create it in `components/ui/` first, then use it.

### 5.3 Creating a New Atomic Component
1. Create `components/ui/ComponentName/ComponentName.tsx`
2. Use only tokens from `constants/theme.ts`
3. Export from `components/ui/index.ts`
4. Use immediately in the task

---

## 6. Data Fetching (React Query)

### 6.1 Three-Layer Hook Architecture

**Layer 1: API Hooks** (`hooks/api/`)
- All mutations and queries live here
- One hook file per resource: `useWorkoutAPI.ts`, `useMealPlanAPI.ts`, etc.
- Pure React Query logic with no screen-specific logic
- Exported from `hooks/api/index.ts`

**Layer 2: Screen-Specific Hooks** (`features/<feature>/hooks/`)
- Compose API hooks + local screen logic (filters, pagination, etc.)
- Example: `useNutritionHomeScreen.ts` imports from `@/hooks/api/useMealPlanAPI`
- Handle side effects and state management specific to that screen

**Layer 3: Query Keys** (`constants/queryKeys.ts`)
- Centralized, typed query key factory
- No magic strings in API hooks

### 6.2 Data Fetching Enforcement Rules

- **No direct fetch/axios in components** — extract to service + hook layer
- **Every useQuery/useMutation** must use `queryKeys.*` factory (no magic strings like `['workouts']`)
- **Query Keys Pattern:** `constants/queryKeys.ts` with typed, structured keys
- **API Hook Pattern:**
  - One export per query/mutation
  - Use `useQueryClient()` for invalidations
  - Set `staleTime`: 0 (real-time), 5 min (user data), 1 hour (static)
- **Error States:** Every component handles `isPending`, `isError` with `<LoadingScreen />` / `<ErrorState />`
- **Optimistic Updates:** Use `onMutate` / `onError` for mutations affecting lists

---

## 7. Navigation (Expo Router)

- Use the `app/` file system for routing.
- Group routes: `(auth)` for authentication, `(app)` for authenticated features, `(modals)` for modal screens.
- Use typed `href` and `router.push()` / `router.replace()`.
- Pass only primitive values (IDs) via route params. Load full data inside the screen using a hook.
- Use `<Stack>`, `<Tabs>`, and `<Drawer>` navigators from Expo Router.
- Define shared screen options in `_layout.tsx` files.

---

## 8. State Management

- **Component state:** `useState` / `useReducer`
- **Server state:** React Query exclusively
- **Global state:** Zustand or Context API (auth, theme, locale)
- **Avoid prop drilling:** Use context/store beyond 2 levels
- **Persist:** Zustand `persist` middleware + `AsyncStorage` (or `expo-secure-store` for sensitive data)

---

## 9. Error Handling

- Wrap root-level screens in an **Error Boundary** component.
- All async functions must be wrapped in `try/catch`. Never let unhandled promise rejections surface.
- Use a centralized `apiClient` (axios instance) with interceptors for:
  - Auth token injection.
  - 401 → automatic token refresh or logout.
  - Logging errors in non-production builds.
- Show user-facing errors via `<Toast>` / `<Snackbar>`, never `console.error` in production.

---

## 10. Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Components | PascalCase | `WorkoutsListCard.tsx` |
| Component folders | PascalCase | `WorkoutsListCard/` |
| Hooks | camelCase + `use` prefix | `useWorkouts.ts` |
| Services | camelCase + `Service` suffix | `workoutsService.ts` |
| Store files | camelCase + `Store` suffix | `authStore.ts` |
| Utils | camelCase | `formatDuration.ts` |
| Constants | UPPER_SNAKE_CASE for values | `MAX_RETRY_COUNT` |
| Constant files | camelCase | `queryKeys.ts`, `theme.ts` |
| Types/Interfaces | PascalCase | `WorkoutSession`, `UserProfile` |
| Screen files | kebab-case | `workout-detail.tsx` |

---

## 11. Clean Code Principles

- **Utility-First:** Before implementing any pure logic helper (date formatting, time calculations, string manipulation), check if a utility already exists in `apps/mobile/utils/`. If it doesn't, create it there to ensure reusability across the app.
- **Icon Standardization:** Never use inline emojis or hardcoded icon strings in components. Always add new icons to `apps/mobile/utils/icons.ts` and import them from the `ICONS` constant. This ensures a consistent look and feel and simplifies global icon updates.
- **DRY:** Extract repeated logic into hooks/utils.
- **KISS:** Prefer simple, readable solutions.
- **Single Responsibility:** One purpose per file
- **Optional Chaining & Nullish Coalescing:** Use `?.` and `??`
- **No magic values:** Extract to `constants/`
- **Max ~200 lines:** Decompose if longer
- **Absolute imports only:** Use path aliases (`@/components/ui`), never relative imports (no `../../..`)
- **No import chains > 2 levels deep** — if needed, convert to absolute alias or add new alias
---

## 13. Security

- Never store sensitive data (tokens, passwords) in `AsyncStorage` — use `expo-secure-store`.
- Never log sensitive data in production.
- Validate all user inputs before sending to API.
- Use `EXPO_PUBLIC_` prefix only for truly non-sensitive env vars.