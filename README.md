# Menu Calorie Scanner

An AI-assisted nutrition estimator for Indian restaurant dishes. Search a dish by name, scan or upload a restaurant menu (photo or PDF), or scan a QR-code menu, and get estimated calories, macros, ingredients, allergens, a health score, and healthier alternatives.

> All nutrition values are estimates for general awareness — never medical or lab-grade data.

## Features

- **Dish search** — typo-tolerant fuzzy search over a curated Indian dish dataset, with synonym matching (e.g. "chicken 65" → "Chicken 65")
- **Menu scanning** — photograph or upload a restaurant menu; OCR + AI extract dish names and resolve each one to nutrition data
- **QR menu scanning** — scan a restaurant's QR-code menu and resolve dishes directly from the linked page
- **Dish detail** — calories, macros, ingredients, allergens, a 1–10 health score with reasoning, and suggested healthier alternatives
- **Recent & popular dishes** — quick access from the home screen

## Tech stack

| Layer | Stack |
|---|---|
| Backend | Node.js, Express, TypeScript, PostgreSQL (`pg_trgm` fuzzy search) |
| Mobile | Expo / React Native (SDK 57), React Query, React Navigation |
| Shared | TypeScript types shared between backend and mobile, no build step |
| Testing | Playwright (mobile web E2E) |

## Project structure

```
server/            Express + Postgres API
  src/adapters/     OCR / AI / nutrition / storage — interface + stub + real implementation per provider
  src/services/     Business logic (search, menu parsing, nutrition estimation, jobs)
  src/db/           Migrations and seed data
mobile/             Expo / React Native app
  src/screens/       App screens (Home, Search, Dish Detail, Menu Scan, QR Scan, ...)
  src/api/           Typed API client wrappers
  src/hooks/queries/ React Query hooks
  e2e/               Playwright tests
packages/shared/    TypeScript DTOs shared by server and mobile (no runtime code)
```

### Backend adapter pattern

Every external AI/OCR/storage capability (`server/src/adapters/{ocr,ai,nutrition,storage}/`) is defined as an interface with a **stub** implementation (deterministic, seed-data-driven, no API keys required) and a **real** implementation, selected via an environment variable. The app is fully usable end-to-end on stub adapters alone — no external API keys are required to run it locally.

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL (local instance, with a database created for this project)
- [Expo CLI](https://docs.expo.dev/) tooling (`npx expo ...` — no global install needed)
- An Android/iOS device or emulator for the mobile app (camera features require a custom dev-client build — see below)

## Getting started

```bash
git clone <this-repo-url>
cd menu-calorie-scanner
npm install                 # installs server, mobile, and shared workspaces
```

### 1. Database

Create a local Postgres database, then configure the connection:

```bash
cp server/.env.example server/.env
# edit server/.env and set DATABASE_URL to your local Postgres connection string
```

```bash
npm run migrate             # applies server/src/db/migrations/*.sql
npm run seed                # loads the curated dish dataset (server/src/db/seed/data/indian-dishes-seed.json)
```

### 2. Backend API

```bash
npm run dev:server          # tsx watch server/src/index.ts — runs on http://localhost:4000
```

By default all AI/OCR/storage adapters run in **stub mode** (`server/.env.example`), so the app works fully offline with no API keys. To wire up a real provider (e.g. Google Vision OCR, Anthropic Claude), set the corresponding `*_PROVIDER` variable and API key in `server/.env`.

### 3. Mobile app

```bash
cd mobile
cp .env.example .env         # if present; otherwise create .env with EXPO_PUBLIC_API_BASE_URL
npm run web                  # fastest way to try it — runs in a browser via Metro's web bundler
```

For the full native app (including camera-based menu/QR scanning), `react-native-vision-camera` requires a custom dev-client build — Expo Go **cannot** run this project:

```bash
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --profile development --platform android   # cloud build, no local Android SDK needed
# install the resulting APK on-device, then:
npx expo start --dev-client
```

If testing on a physical device (not an emulator/web), set `EXPO_PUBLIC_API_BASE_URL` in `mobile/.env` to your development machine's LAN IP (e.g. `http://192.168.x.x:4000`) — `localhost` on a physical phone refers to the phone itself, not your dev machine.

## Testing

```bash
cd server && npm run typecheck
cd mobile && npm run typecheck
cd mobile && npm run test:e2e     # Playwright E2E tests against the mobile web build (needs the API server running on :4000)
```

## Scripts reference

Run from the repo root unless noted.

```bash
npm run dev:server          # start the backend API
npm run migrate             # apply database migrations
npm run seed                # (re)load the seed dish dataset — resets menu-scan history
npm run dev:mobile          # expo start (mobile/)
```

## Disclaimer

Nutrition values in this app are estimates intended for general dietary awareness. They are not a substitute for professional nutritional or medical advice.
