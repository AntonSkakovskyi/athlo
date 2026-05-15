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
- Be under ~60–80 lines.

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
- **Avoid type assertions (`as`)** unless absolutely necessary; add a comment explaining why.
- **Use discriminated unions** for state variants (e.g., loading / success / error).

```typescript
// ✅ Good
interface WorkoutsListProps {
  workouts: Workout[];
  onPress: (id: string) => void;
  isLoading?: boolean;
}

// ❌ Bad
const WorkoutsList = (props: any) => { ... }
```

---

## 4. Components & Styling

### 4.1 Styling Rules
- Use `StyleSheet.create()` for all styles. Never use inline style objects.
- All design tokens come from `constants/theme.ts` — no hardcoded color/spacing values.
- Use flexbox for layout. Avoid fixed pixels unless necessary.
- Support dark mode via theme tokens from the start.

### 4.2 Performance & Responsiveness
- Wrap expensive components in `React.memo()`.
- Use `useCallback` for prop functions, `useMemo` for expensive computations.
- Always provide `keyExtractor` for lists; never use index as key.
- Use `FlatList` instead of `ScrollView` for long lists.
- Use `useWindowDimensions()` for responsive sizing.
- Respect safe areas via `useSafeAreaInsets()`.

---

## 5. Atomic UI Components (MANDATORY)

> **Rule:** Never write an inline primitive where an atomic component already exists or could exist.

### 5.1 Lookup Algorithm
Before writing any button, input, chip, or other primitive:

1. **Check `components/ui/`** — does a component already exist?
2. **If yes** — import and use it. Do not duplicate.
3. **If no** — create it in `components/ui/` first, then use it.


### 5.2 Creating a New Atomic Component
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

**Query Keys Pattern:** `constants/queryKeys.ts` with typed, structured keys (no magic strings).

**API Hook Pattern:**
- One export per query/mutation
- Use `useQueryClient()` for invalidations
- Set `staleTime`: 0 (real-time), 5 min (user data), 1 hour (static)

**Error States:** Every component handles `isPending`, `isError` with `<LoadingScreen />` / `<ErrorState />`.

**Optimistic Updates:** Use `onMutate` / `onError` for mutations affecting lists.

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

- **DRY:** Extract repeated logic into hooks/utils
- **KISS:** Prefer simple, readable solutions
- **Single Responsibility:** One purpose per file
- **Optional Chaining & Nullish Coalescing:** Use `?.` and `??`
- **No magic values:** Extract to `constants/`
- **Max ~200 lines:** Decompose if longer
- **Absolute imports:** Use path aliases (`@/components/ui`), no relative paths
---

## 13. Security

- Never store sensitive data (tokens, passwords) in `AsyncStorage` — use `expo-secure-store`.
- Never log sensitive data in production.
- Validate all user inputs before sending to API.
- Use `EXPO_PUBLIC_` prefix only for truly non-sensitive env vars.