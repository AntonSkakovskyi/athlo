# React Native & Expo — Development Standards

> This document defines code quality, architecture, and structure standards for scalable and maintainable mobile development. Follow these rules when generating any frontend code.

---

## 1. Architecture & Project Structure

### 1.1 Feature-based Organization
Organize code by domain/feature, not by type:

```
src/
├── app/                        # Expo Router pages (screens only)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── login/
│   │       └── components/     # Screen-specific components
│   │           ├── LoginForm.tsx
│   │           └── SocialButtons.tsx
│   └── (app)/
│       ├── workouts.tsx
│       └── workouts/
│           └── components/
│               ├── WorkoutsHeader.tsx
│               └── WorkoutsFilter.tsx
├── components/
│   ├── ui/                     # Atomic, reusable primitives
│   └── shared/                 # Shared feature-level components
├── features/                   # Feature modules (self-contained)
│   └── workouts/
│       ├── components/
│       │   └── WorkoutsList/
│       │       ├── WorkoutsList.tsx
│       │       └── WorkoutsListCard/
│       │           ├── WorkoutsListCard.tsx
│       │           └── WorkoutsListCardBadge.tsx
│       ├── hooks/
│       │   ├── useWorkouts.ts
│       │   └── useWorkoutMutation.ts
│       ├── services/
│       │   └── workoutsService.ts
│       └── types.ts
├── hooks/                      # Global/shared hooks
├── services/                   # Global API client, interceptors
├── constants/                  # theme.ts, queryKeys.ts, config.ts
├── types/                      # Global shared types
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
- All design tokens (colors, spacing, border radii, font sizes, shadows) must come from `constants/theme.ts`. No hardcoded values.
- Use **flexbox** for layout. Avoid fixed `width`/`height` in pixels unless absolutely necessary.
- Support both light and dark mode via theme tokens from the start.

```typescript
// constants/theme.ts
export const colors = {
  primary: '#6C47FF',
  background: '#0F0F0F',
  surface: '#1C1C1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  danger: '#FF3B30',
  success: '#34C759',
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const borderRadius = {
  sm: 6, md: 12, lg: 16, xl: 24, full: 9999,
};

export const fontSize = {
  xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 28, xxxl: 34,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};
```

### 4.2 Responsiveness
- Use `useWindowDimensions()` for dynamic sizing.
- Use `Platform.OS` for platform-specific adjustments.
- Respect safe areas via `useSafeAreaInsets()`.
- Use `KeyboardAvoidingView` on all forms.

### 4.3 Performance
- Wrap expensive components in `React.memo()`.
- Use `useCallback` for functions passed as props, `useMemo` for expensive computations.
- Always provide `keyExtractor` for lists; never use index as key for dynamic lists.
- Use `FlatList` or `FlashList` (preferred) instead of `ScrollView` for long lists.
- Use `getItemLayout` on `FlatList` when item height is fixed.
- Lazy-load heavy screens with `React.lazy` + `Suspense` where applicable.

---

## 5. Atomic UI Components (MANDATORY)

> **Rule:** Never write an inline primitive where an atomic component already exists or could exist.

### 5.1 Lookup Algorithm
Before writing any button, input, chip, or other primitive:

1. **Check `components/ui/`** — does a component already exist?
2. **If yes** — import and use it. Do not duplicate.
3. **If no** — create it in `components/ui/` first, then use it.

### 5.2 UI Component Library (`components/ui/`)

| Component | When to use |
|---|---|
| `<Button>` | Any tappable action. Variants: `primary`, `secondary`, `danger`, `ghost`, `outline`. Supports `isLoading`, `disabled`, `leftIcon`, `rightIcon`. |
| `<Input>` | Any text input field. Supports `label`, `error`, `hint`, `secureTextEntry`, `leftIcon`. |
| `<Chip>` | Single tag / filter badge. Variants: `active`, `default`. |
| `<SegmentControl>` | Tab switcher (2–4 segments). |
| `<EmptyState>` | Empty state: illustration + title + subtitle + optional CTA. |
| `<Badge>` | Numeric or status indicator on icons/cards. |
| `<Avatar>` | User profile image with fallback initials. |
| `<Skeleton>` | Loading placeholder for any content shape. |
| `<Divider>` | Horizontal or vertical separator. |
| `<Card>` | Surface container with shadow and border radius from theme. |
| `<Typography>` | All text rendering with predefined style variants (`h1`–`h6`, `body`, `caption`, `label`). |
| `<BottomSheet>` | Modal-style sliding panel. |
| `<Toast>` / `<Snackbar>` | Temporary feedback messages. |

### 5.3 Prohibited Patterns

```typescript
// ❌ Forbidden
<Pressable style={...}><Text>Submit</Text></Pressable>
<TextInput style={...} placeholder="Email" />
<View style={{ backgroundColor: '#6C47FF', borderRadius: 12 }} />
<Text style={{ fontSize: 17, fontWeight: 'bold' }}>Title</Text>

// ✅ Required
<Button variant="primary" onPress={handleSubmit}>Submit</Button>
<Input label="Email" value={email} onChangeText={setEmail} />
<Card>...</Card>
<Typography variant="h3">Title</Typography>
```

### 5.4 Creating a New Atom
When a needed primitive does not exist:
1. Create `components/ui/NewComponent/NewComponent.tsx`.
2. Define all necessary `variant` and `props` upfront.
3. Apply only tokens from `constants/theme.ts` — no hardcoded values.
4. Export from `components/ui/index.ts`.
5. Immediately use it in the current task.

---

## 6. Data Fetching (React Query)

- **Query keys:** Use a centralized `queryKeys` object in `constants/queryKeys.ts`. No magic strings.
- **One hook per resource:** Each GET request and each mutation lives in its own hook file inside `features/<feature>/hooks/` or `hooks/api/`.
- **Error & loading states:** Every component consuming a query must handle `isPending`, `isError`, and show appropriate UI (`<Skeleton>` or `<EmptyState>`).
- **Optimistic updates:** Use `onMutate` / `onError` / `onSettled` for mutations that affect list state.
- **Stale time:** Set appropriate `staleTime` per query — avoid over-fetching.

```typescript
// constants/queryKeys.ts
export const queryKeys = {
  workouts: {
    all: ['workouts'] as const,
    byId: (id: string) => ['workouts', id] as const,
    byUser: (userId: string) => ['workouts', 'user', userId] as const,
  },
  profile: {
    me: ['profile', 'me'] as const,
  },
};
```

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

- **Local state:** `useState` / `useReducer` for component-level state.
- **Server state:** React Query exclusively.
- **Global client state:** Zustand (preferred) or Context API for lightweight global state (auth session, theme, locale).
- **Avoid prop drilling** beyond 2 levels — use context or a store.
- **Persist state** with `zustand/middleware` `persist` + `AsyncStorage` or `expo-secure-store` for sensitive data.

```typescript
// Example Zustand store
interface AuthStore {
  token: string | null;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
    }),
    { name: 'auth-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);
```

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

- **DRY:** Extract any logic repeated more than once into a hook or util.
- **KISS:** Prefer simple, readable solutions over clever ones.
- **Single Responsibility:** Each file does one thing.
- **Optional Chaining & Nullish Coalescing:** Use `?.` and `??` throughout.
- **JSDoc:** Add JSDoc comments to all public hooks, services, and utility functions.
- **No magic numbers/strings:** Extract to named constants in `constants/`.
- **Max file length:** ~200 lines. If longer, decompose.
- **Imports:** Absolute imports via `tsconfig.json` path aliases (e.g., `@/components/ui`). No deep relative paths.

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

## 12. Testing

- **Unit tests:** All utility functions and hooks must have unit tests (Jest + React Native Testing Library).
- **Component tests:** Smoke test each atomic UI component.
- **Integration tests:** Key user flows (login, main feature flow).
- **Naming:** Test files co-located: `ComponentName.test.tsx`, `useHook.test.ts`.
- **Coverage target:** ≥70% for `utils/` and `hooks/`.

---

## 13. Security

- Never store sensitive data (tokens, passwords) in `AsyncStorage` — use `expo-secure-store`.
- Never log sensitive data in production.
- Validate all user inputs before sending to API.
- Use `EXPO_PUBLIC_` prefix only for truly non-sensitive env vars.