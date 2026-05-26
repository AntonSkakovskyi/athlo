# Athlo

A full-stack fitness tracking platform: **NestJS REST API**, **React Native (Expo) mobile app**, and **PostgreSQL** database — all in a single Turborepo monorepo.

## Repository structure

```
athlo/
├── apps/
│   ├── api/          # NestJS server (REST + Swagger)
│   │   ├── etl/      # Data seeding scripts (exercises, foods)
│   │   └── src/
│   └── mobile/       # Expo / React Native client (iOS & Android)
├── docker-compose.yml
└── turbo.json
```

## Key configuration files

| File | Purpose |
|---|---|
| `docker-compose.yml` | Orchestrates API + database containers |
| `apps/api/Dockerfile` | Builds the server Docker image |
| `apps/api/.env` | Server environment variables (local) |
| `apps/mobile/app.json` | Expo project config (bundle ID, version) |
| `apps/mobile/eas.json` | EAS build profiles |
| `apps/mobile/api/config.ts` | API base URL for dev / production modes |

## Prerequisites

- **Node.js** 18 or newer
- **Docker Desktop** 4.0+ (for the containerised stack)
- **Git**
- **Expo CLI** or an Expo Application Services (EAS) account (for mobile builds)

Recommended client-device specs: ≥ 3 GB RAM, ≥ 150 MB free storage, stable internet (Wi-Fi or mobile data).

---

## Database setup

Two options are supported.

### Option 1 — PostgreSQL in Docker (local dev)

The database is started automatically with the full stack (see [Full stack](#full-stack-docker) below).  
To start it standalone:

```sh
docker compose up postgres -d
```

Local connection string:

```
postgresql://athlo:athlo@localhost:5432/athlo
```

> Set `DATABASE_SSL=false` in `apps/api/.env` when connecting to the local container.

### Option 2 — Supabase (production)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the connection string from **Project Settings → Database**.
3. Set it as `DATABASE_URL` and set `DATABASE_SSL=true`.

---

## Server setup

### Option 1 — Docker (recommended for local dev) <a id="full-stack-docker"></a>

Starts both the database and the API in one command.

```sh
git clone <repository-url> athlo
cd athlo

# create .env (set JWT_SECRET at minimum)
cp apps/api/.env.example apps/api/.env   # or create it manually

docker compose up --build -d
```

Swagger UI is available at **http://localhost:4000/api/docs** once the containers are healthy.

```sh
# stop
docker compose down

# stop and wipe data volumes
docker compose down --volumes
```

### Option 2 — Render (production)

1. Create a **Web Service** on [render.com](https://render.com) and connect your GitHub repo.
2. Set **Root directory** → `apps/api`, **Build command** → `npm install && npm run build`, **Start command** → `npm run start:prod`.
3. Add environment variables:
   - `DATABASE_URL` — connection string (e.g. from Supabase)
   - `JWT_SECRET`
   - `DATABASE_SSL=true`
4. Click **Deploy**. Every subsequent push to the main branch triggers auto-deploy.

---

## Mobile app setup

Update `apps/mobile/api/config.ts` → `PRODUCTION_API_URL` with your deployed server address before creating a release build.

### Option 1 — EAS (distribution builds)

```sh
npm install -g eas-cli
eas login

cd apps/mobile

# Android preview APK
eas build --profile preview --platform android

# iOS preview (TestFlight)
eas build --profile preview --platform ios

# Production
eas build --profile production --platform android
eas build --profile production --platform ios
```

Download the APK (Android) or use TestFlight (iOS) to install the artifact.

### Option 2 — Local native build (development)

**Android**

1. Install Android Studio and configure Android SDK (minimum API 26).
2. Connect a device with Developer Mode enabled, or create an Android Virtual Device.
3. From `apps/mobile`:

```sh
npx expo run:android
```

**iOS** (macOS only)

1. Install Xcode 15+.
2. From `apps/mobile`:

```sh
npx expo run:ios
```

---

## Data seeding (ETL)

The `apps/api/etl/` scripts populate the database with exercises and foods from public APIs. See [apps/api/etl/README.md](apps/api/etl/README.md) for full documentation.

```sh
# seed everything
node apps/api/etl/index.js --all

# exercises only
node apps/api/etl/index.js --source=wger --limit=850

# foods only
node apps/api/etl/index.js --source=off --limit=500
```

---

## Features

- **Authentication** — sign up / sign in with JWT tokens (7-day expiry).
- **Workouts** — start an empty session or pick a saved template; log sets with weight, reps, or time.
- **Exercise catalogue** — searchable library seeded with 800+ exercises, muscle diagrams, and GIF animations.
- **Templates** — create reusable workout plans; set visibility (private / friends / public); save others' templates.
- **Nutrition tracking** — log meals, search the food database, auto-calculate macros.
- **Water tracking** — daily water intake counter with quick-add buttons.
- **Statistics** — progress charts, workout history, bodyweight trends, achievements.
- **Social** — find users, send friend requests, browse friends' templates.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| First request takes 30–60 s after a long pause | Render free tier suspends the container after 15 min of inactivity (cold start) | Wait for the screen to load; upgrade to a paid tier or set up a periodic ping for critical use |
| SSL error when running migrations against local Docker | TypeORM defaults to SSL; local container does not use SSL | Add `DATABASE_SSL=false` to `apps/api/.env` and re-run migrations |
| User is automatically signed out after several days | JWT token expires after 7 days; the 401 interceptor removes it from storage | Sign in again on the **Sign In** screen to receive a fresh token |
| `npm ERESOLVE` error on install | Expo SDK 55 has a peer dependency conflict with `react-dom` | Always run `npm install` from the **repo root**, never from `apps/mobile`. The root `.npmrc` sets `legacy-peer-deps=true` to resolve the conflict automatically |
| Metro bundler error: `Cannot find module 'babel-preset-expo'` | Running Metro outside of the monorepo root | Run `npx expo start` from `apps/mobile`; the Metro config uses `watchFolders` to resolve packages from the monorepo root |

---

## Development commands

Run from the repo root (dependencies are hoisted):

```sh
# install all dependencies (always run from repo root)
npm install

# start API in watch mode
cd apps/api && npm run start:dev

# start Expo dev server
cd apps/mobile && npx expo start

# build all packages
turbo build

# run all tests
turbo test
```
