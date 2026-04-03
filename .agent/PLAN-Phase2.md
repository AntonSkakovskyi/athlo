# Plan: Backend & Frontend Improvements (5 Features)

## TL;DR
Five improvements to the Athlo backend (+frontend sync): (1) friend request/accept/reject flow instead of instant friendship, (2) CRUD for user-created exercises & equipment, (3) statistics/analytics endpoints, (4) achievements system, (5) "get previous workout data" endpoint. Each feature requires DB changes, backend service/controller/DTO work, shared interface updates, and frontend hook/route updates.

---

## Phase 1: Friend Request Flow (replaces instant friendship)

### Current state
- `user_friends` table: `id, user_id, friend_id` — friendship created instantly and bidirectionally
- `FriendService.addFriend()` creates two records (forward + reverse) immediately
- `isFriend()` / `getFriendIds()` used for visibility filtering on templates/workouts

### DB Changes
- **Add `status` column** to `user_friends`: `VARCHAR` with values `PENDING | ACCEPTED | REJECTED`
- **Add `created_at` column** (timestamptz, default now)
- **Remove** the automatic reverse record creation — a single row represents the request (requester = `user_id`, receiver = `friend_id`)
- **Add index** on `(friend_id, status)` for efficient "incoming requests" query

### Backend Changes

**Entity** (`user-friend.entity.ts`):
- Add `status: string` column (default: `PENDING`)
- Add `createdAt: Date` column

**Shared** (`packages/shared`):
- Add `FriendRequestStatus` enum: `PENDING | ACCEPTED | REJECTED`
- Update `IFriendship` interface: add `status: FriendRequestStatus`, `createdAt: Date`

**Service** (`friend.service.ts`):
- `sendRequest(userId, friendId)` — create record with status=PENDING (replaces `addFriend`)
- `acceptRequest(userId, requestId)` — set status=ACCEPTED (validate receiver == userId)
- `rejectRequest(userId, requestId)` — set status=REJECTED or delete record
- `cancelRequest(userId, requestId)` — delete pending request (sender cancels)
- Update `getFriends(userId)` — return only ACCEPTED friendships (both directions via OR query)
- `getIncomingRequests(userId)` — return PENDING where friend_id = userId
- `getOutgoingRequests(userId)` — return PENDING where user_id = userId
- Update `isFriend()` — check for ACCEPTED status only
- Update `getFriendIds()` — return IDs where status = ACCEPTED only

**Controller** (`friend.controller.ts`):
- `POST /friends/request` — sendRequest (replaces `POST /friends`)
- `PATCH /friends/requests/:id/accept` — acceptRequest
- `PATCH /friends/requests/:id/reject` — rejectRequest
- `DELETE /friends/requests/:id` — cancelRequest
- `GET /friends` — getFriends (already exists, update logic)
- `GET /friends/requests/incoming` — getIncomingRequests
- `GET /friends/requests/outgoing` — getOutgoingRequests
- `DELETE /friends/:friendId` — removeFriend (stays, but only for ACCEPTED)

**Frontend**:
- Update `api-routes.ts`: add request/accept/reject/incoming/outgoing routes
- Create/update friend hooks with new mutations: `useSendFriendRequest`, `useAcceptFriendRequest`, `useRejectFriendRequest`, `useCancelFriendRequest`, `useGetIncomingRequests`, `useGetOutgoingRequests`
- Update query invalidation keys

---

## Phase 2: CRUD for User Exercises & Equipment

### Current state
- Exercises: only `GET /exercises` with pagination/filter. No userId, no visibilityTypeId in exercise entity
- Equipment: only `GET /equipments`. No userId
- All data is global seed data — users can't create their own

### DB Changes
- **Add `user_id` column** (nullable FK) to `exercises` table — NULL = system exercise, non-null = user-created
- **Add `visibility_type_id` column** (FK, default 1=PRIVATE) to `exercises` table
- **Add `user_id` column** (nullable FK) to `equipments` table — NULL = system equipment
- No visibility needed for equipment (equipment is just a label; exercises control visibility)

### Backend Changes

**Entities**:
- `ExerciseEntity`: add `userId?: number`, `visibilityTypeId: number` (default: 1), relations to `UserEntity` and `VisibilityTypeEntity`
- `EquipmentEntity`: add `userId?: number`, relation to `UserEntity`

**Shared**:
- Update `IExercise`: add `userId?: number | null`, `visibilityTypeId?: number`
- Update `IEquipment`: add `userId?: number | null`

**DTOs** (new):
- `CreateExerciseDto`: name, description?, equipmentId?, trackingTypeId, muscleIds (array with isPrimary & impactPercentage), visibilityTypeId? (forced to PRIVATE for user-created)
- `UpdateExerciseDto`: same fields, all optional
- `CreateEquipmentDto`: name
- `UpdateEquipmentDto`: name

**Service** (`exercise.service.ts`):
- `findById(id, userId)` — get single exercise with access check (public or own)
- `create(userId, dto)` — create exercise with userId set, visibility forced to PRIVATE
- `update(id, userId, dto)` — update only own exercises
- `remove(id, userId)` — delete only own exercises
- Update `findAll()` — return system exercises (userId=null) + user's own private exercises + public user exercises

**Service** (`equipment.service.ts`):
- `create(userId, dto)` — create user equipment
- `update(id, userId, dto)` — update only own equipment
- `remove(id, userId)` — delete only own equipment
- Update `findAll(userId)` — return system equipment + user's own

**Controller** (`exercise.controller.ts`):
- `GET /exercises/:id` — findById (new)
- `POST /exercises` — create (new)
- `PATCH /exercises/:id` — update (new)
- `DELETE /exercises/:id` — remove (new)

**Controller** (`equipment.controller.ts`):
- `POST /equipments` — create (new)
- `PATCH /equipments/:id` — update (new)
- `DELETE /equipments/:id` — remove (new)

**Recommendation**: User-created exercises always PRIVATE (visibility_type_id=1). Users can't make their exercises PUBLIC or FRIENDS_ONLY — this prevents spam/abuse and keeps the global catalog clean. The `visibility_type_id` column still exists for potential future admin use.

**Frontend**:
- Update `api-routes.ts`: add CRUD routes for exercises and equipment
- Add `useGetExerciseById` query hook
- Add `useCreateExercise`, `useUpdateExercise`, `useDeleteExercise` mutation hooks
- Add `useCreateEquipment`, `useUpdateEquipment`, `useDeleteEquipment` mutation hooks
- Query invalidation for exercises/equipment lists

---

## Phase 3: Statistics & Analytics

### Current state
- No workout statistics endpoints
- No exercise progress endpoints
- Body metrics only returns raw data (no aggregation/trends)
- Nutrition has a daily summary endpoint

### Backend Changes (new `statistics` module or extend existing services)

**Approach**: Create a new `StatisticsService` under `workouts-service/` (or a standalone stats module) to keep logic separate.

**New Endpoints**:

1. **Workout Statistics** — `GET /statistics/workouts`
   - Total workouts completed (all time)
   - Workouts per month (array: `[{ month: '2026-01', count: 5 }, ...]`)
   - Total sets completed
   - Total weight lifted (sum of `weight * reps` across all log_sets)
   - Average workout duration
   - Query params: `from?`, `to?` (date range filter)

2. **Exercise Progress** — `GET /statistics/exercises/:exerciseId`
   - Based on exercise's trackingType:
     - WEIGHT_AND_REPS: max weight lifted, progression over time (best set per workout, ordered by date)
     - REPS_ONLY: max reps in a single set, progression over time
     - TIME_BASED: max duration, max distance, progression over time
   - Returns array of records: `{ date, bestValue, workoutId }`
   - Query params: `from?`, `to?`

3. **Body Metrics Progress** — `GET /statistics/body-metrics/:metricTypeId`
   - Value over time for specific metric type (weight, chest, bicep, etc.)
   - Min, max, current, change (delta from first to last)
   - Returns: `{ current, min, max, change, history: [{ date, value }] }`
   - Query params: `from?`, `to?`

4. **General Summary** — `GET /statistics/summary`
   - Total workouts, total exercises performed, total sets, total weight, streak (consecutive days with workouts)
   - Quick overview for profile page

**Shared**:
- New interfaces: `IWorkoutStatistics`, `IExerciseProgress`, `IBodyMetricProgress`, `IStatisticsSummary`

**Frontend**:
- Add `api-routes.ts` entries for statistics
- New hooks: `useWorkoutStatistics`, `useExerciseProgress`, `useBodyMetricProgress`, `useStatisticsSummary`
- These feed the profile statistics section

---

## Phase 4: Achievements System

### DB Changes (New Tables)

1. **`achievements`** — global achievement definitions
   - `id` (PK)
   - `name: string` — e.g. "10 Workouts", "Lift 100,000 kg"
   - `description: string`
   - `type: string` — enum: `GLOBAL_WORKOUTS | GLOBAL_SETS | GLOBAL_WEIGHT | EXERCISE_PERSONAL_RECORD`
   - `threshold: decimal` — value to reach (10, 20, 50, 100 for workouts; 100000 for weight)
   - `exercise_id: number | null` — NULL for global, FK for exercise-specific
   - `tracking_metric: string | null` — `WEIGHT | REPS | DURATION | DISTANCE | ESTIMATED_1RM` — which metric this achievement tracks (for exercise achievements)
   - `icon_url: string | null`
   - `order: number` — display order

2. **`user_achievements`** — unlocked achievements per user
   - `id` (PK)
   - `user_id` (FK)
   - `achievement_id` (FK)
   - `unlocked_at: timestamptz`
   - `value: decimal` — actual value when unlocked
   - Unique constraint: `(user_id, achievement_id)`

3. **`user_exercise_records`** — personal records per exercise per user
   - `id` (PK)
   - `user_id` (FK)
   - `exercise_id` (FK)
   - `best_weight: decimal | null`
   - `best_reps: int | null`
   - `best_duration: int | null`
   - `best_distance: decimal | null`
   - `estimated_1rm: decimal | null` — calculated via formula (Epley/Brzycki)
   - `updated_at: timestamptz`
   - Unique constraint: `(user_id, exercise_id)`

### Backend Changes

**Module**: New `achievement` module under `workouts-service/` or standalone

**Entities**: `AchievementEntity`, `UserAchievementEntity`, `UserExerciseRecordEntity`

**Shared**:
- New enum: `AchievementType` (GLOBAL_WORKOUTS | GLOBAL_SETS | GLOBAL_WEIGHT | EXERCISE_PERSONAL_RECORD)
- New enum: `TrackingMetric` (WEIGHT | REPS | DURATION | DISTANCE | ESTIMATED_1RM)
- New interfaces: `IAchievement`, `IUserAchievement`, `IUserExerciseRecord`

**Service** (`achievement.service.ts`):
- `getAll()` — get all achievement definitions
- `getUserAchievements(userId)` — get user's unlocked achievements
- `getUserExerciseRecords(userId)` — get all personal records
- `getExerciseRecord(userId, exerciseId)` — get PR for specific exercise
- `checkAndUpdateRecords(userId, logExerciseId)` — called after a set is logged/updated:
  1. Load the log_set + exercise + trackingType
  2. Compare with current `user_exercise_records` for that (userId, exerciseId)
  3. Update PR if new value is higher
  4. For WEIGHT_AND_REPS: calculate estimated 1RM using Epley formula: `weight * (1 + reps/30)`
  5. Check if any exercise achievements are now unlocked
- `checkGlobalAchievements(userId)` — called after workout completion:
  1. Count total completed workouts → check GLOBAL_WORKOUTS thresholds
  2. Count total sets → check GLOBAL_SETS thresholds
  3. Sum total weight lifted → check GLOBAL_WEIGHT thresholds
  4. Unlock newly reached achievements

**Integration Points**:
- `LogSetService.create()` / `LogSetService.update()` → call `achievementService.checkAndUpdateRecords()`
- `WorkoutService.complete()` → call `achievementService.checkGlobalAchievements()`

**Controller** (`achievement.controller.ts`):
- `GET /achievements` — getAll definitions
- `GET /achievements/user` — getUserAchievements (unlocked)
- `GET /achievements/records` — getUserExerciseRecords (all PRs)
- `GET /achievements/records/:exerciseId` — getExerciseRecord

**Tracking metric selection per exercise** (based on `trackingType`):
- `WEIGHT_AND_REPS` → primary metric: `WEIGHT` or `ESTIMATED_1RM`
- `REPS_ONLY` → primary metric: `REPS`
- `TIME_BASED` → primary metric: `DURATION` or `DISTANCE`

**Estimated 1RM Formula** (Epley): `1RM = weight × (1 + reps / 30)`
- Only applies to WEIGHT_AND_REPS exercises
- Stored in `user_exercise_records.estimated_1rm`
- Example: 100kg × 5 reps = 100 × (1 + 5/30) = 116.67 kg estimated 1RM

**Frontend**:
- Add `api-routes.ts` entries
- New hooks: `useGetAchievements`, `useGetUserAchievements`, `useGetExerciseRecords`, `useGetExerciseRecord`
- No mutations needed from frontend — achievements auto-unlock on backend

---

## Phase 5: Previous Workout Data Endpoint

### Current state
- "Start from template" copies template set data (static preset values)
- No way to pull actual performance data from last workout for same exercises
- User can't see what weight/reps they did last time for an exercise

### Backend Changes

**New Endpoint**: `GET /workouts/exercises/:exerciseId/last-performance`
- Returns the log_sets from the most recent COMPLETED workout that contains the given exerciseId for the current user
- Response: `{ workoutId, workoutName, date, sets: [{ order, weight, reps, duration, distance, isCompleted }] }`

**Service** (`workout.service.ts` or `log-exercise.service.ts`):
- `getLastPerformance(userId, exerciseId)`:
  1. Find the most recent COMPLETED workout for this user that has a `log_exercise` with exerciseId
  2. Return all `log_sets` for that exercise in that workout, ordered by `order`
  3. Return null/empty if no previous data

**Alternative enhanced endpoint**: `POST /workouts/:workoutId/last-performance` (batch)
- Accepts: `{ exerciseIds: number[] }`
- Returns: map of exerciseId → last performance sets
- More efficient when loading a full workout — one request instead of N

**Shared**:
- New interface: `ILastPerformance { workoutId, workoutName, date, sets: ILogSet[] }`

**Frontend**:
- Add `api-routes.ts` entries
- New hooks: `useGetLastPerformance(exerciseId)`, `useGetBatchLastPerformance(workoutId, exerciseIds)`
- Used in active workout screen to pre-populate or display previous values

---

## Relevant Files

### Backend — Modified
- `apps/api/src/user-service/friends/entities/user-friend.entity.ts` — add status, createdAt
- `apps/api/src/user-service/friends/friend.service.ts` — request/accept/reject logic
- `apps/api/src/user-service/friends/friend.controller.ts` — new endpoints
- `apps/api/src/user-service/friends/dto/add-friend.dto.ts` — rename/update DTOs
- `apps/api/src/exercise-catalog/entities/exercise.entity.ts` — add userId, visibilityTypeId
- `apps/api/src/exercise-catalog/entities/equipment.entity.ts` — add userId
- `apps/api/src/exercise-catalog/exercise/exercise.service.ts` — CRUD methods
- `apps/api/src/exercise-catalog/exercise/exercise.controller.ts` — CRUD endpoints
- `apps/api/src/exercise-catalog/equipment/equipment.service.ts` — CRUD methods
- `apps/api/src/exercise-catalog/equipment/equipment.controller.ts` — CRUD endpoints
- `apps/api/src/exercise-catalog/dto/` — new DTOs for create/update
- `apps/api/src/workouts-service/workout/workout.service.ts` — last performance + global achievement trigger
- `apps/api/src/workouts-service/log-set/log-set.service.ts` — achievement check trigger
- `apps/api/src/workouts-service/workouts-service.module.ts` — register new providers

### Backend — New Files
- `apps/api/src/workouts-service/statistics/statistics.service.ts`
- `apps/api/src/workouts-service/statistics/statistics.controller.ts`
- `apps/api/src/workouts-service/achievement/achievement.module.ts`
- `apps/api/src/workouts-service/achievement/achievement.service.ts`
- `apps/api/src/workouts-service/achievement/achievement.controller.ts`
- `apps/api/src/workouts-service/achievement/entities/achievement.entity.ts`
- `apps/api/src/workouts-service/achievement/entities/user-achievement.entity.ts`
- `apps/api/src/workouts-service/achievement/entities/user-exercise-record.entity.ts`

### Shared — Modified
- `packages/shared/src/interfaces/friendship.interface.ts`
- `packages/shared/src/interfaces/exercise.interface.ts`
- `packages/shared/src/interfaces/equipment.interface.ts`
- `packages/shared/src/index.ts`

### Shared — New Files
- `packages/shared/src/enums/friend-request-status.enum.ts`
- `packages/shared/src/enums/achievement-type.enum.ts`
- `packages/shared/src/enums/tracking-metric.enum.ts`
- `packages/shared/src/interfaces/achievement.interface.ts`
- `packages/shared/src/interfaces/user-achievement.interface.ts`
- `packages/shared/src/interfaces/user-exercise-record.interface.ts`
- `packages/shared/src/interfaces/workout-statistics.interface.ts`
- `packages/shared/src/interfaces/exercise-progress.interface.ts`
- `packages/shared/src/interfaces/body-metric-progress.interface.ts`
- `packages/shared/src/interfaces/statistics-summary.interface.ts`
- `packages/shared/src/interfaces/last-performance.interface.ts`

### Frontend — Modified
- `apps/mobile/api/api-routes.ts` — new routes for all features
- `apps/mobile/api/queries/query-keys.ts` — new query keys

### Frontend — New/Updated Hooks
- `apps/mobile/hooks/api/useFriendHooks.ts` (or update existing)
- `apps/mobile/hooks/api/useExerciseQueries.ts` — add mutation hooks
- `apps/mobile/hooks/api/useEquipmentQueries.ts` — add mutation hooks
- `apps/mobile/hooks/api/useStatisticsHooks.ts` (new)
- `apps/mobile/hooks/api/useAchievementHooks.ts` (new)
- `apps/mobile/hooks/api/useWorkoutHooks.ts` — add last performance hook

---

## Verification

1. **Friends**: Send request → verify status=PENDING in DB → accept → verify status=ACCEPTED → check `getFriendIds` returns friend → verify FRIENDS_ONLY templates visible → reject request → verify not visible
2. **Exercises CRUD**: Create exercise → verify userId set, visibility=PRIVATE → findAll returns it for creator only → update → delete → verify cascade deletes exercise_muscles
3. **Equipment CRUD**: Create → update → delete → verify exercises with that equipment aren't deleted
4. **Statistics**: Complete 3 workouts → GET /statistics/workouts → verify counts → verify per-month breakdown → verify total weight calculation
5. **Achievements**: Seed global achievements → complete workouts → verify achievements auto-unlock → log a heavy set → verify exercise PR updated → verify estimated 1RM correct
6. **Last Performance**: Complete workout with exercise X → start new workout with same exercise → GET last-performance → verify returns previous sets with correct weight/reps

---

## Decisions

- User-created exercises are always PRIVATE — no PUBLIC/FRIENDS_ONLY to avoid spam
- Friend requests use a status column on existing `user_friends` table (no separate table needed)
- Rejected friend requests are deleted (not kept with REJECTED status) to keep the table clean
- Estimated 1RM uses Epley formula: `weight × (1 + reps / 30)`
- Statistics module lives under `workouts-service/` since it primarily queries workout data
- Achievement checks are synchronous (called inline after set creation/workout completion) — acceptable for MVP; can be made async with events later
- Batch last-performance endpoint uses POST (accepts body with exerciseIds array) — pragmatic choice for batch queries

## Implementation Order & Dependencies
1. **Phase 1 (Friends)** — independent, can start immediately
2. **Phase 2 (Exercises CRUD)** — independent, *parallel with Phase 1*
3. **Phase 3 (Statistics)** — independent, *parallel with Phases 1-2*
4. **Phase 4 (Achievements)** — *depends on Phase 3 partially* (shares query patterns), but can be developed in parallel if interfaces agreed upfront
5. **Phase 5 (Last Performance)** — independent, *parallel with all others*
