# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Restaurant Menu Calorie Scanner — an AI-assisted nutrition estimator for Indian restaurant dishes. Users search a dish by name, scan/upload a menu (image or PDF), or scan a QR menu, and get estimated calories, macros, ingredients, allergens, a health score, and healthier alternatives. All nutrition values are estimates, never medical/lab-grade.

npm workspaces monorepo: `server/` (Express + Postgres API), `mobile/` (Expo/React Native app), `packages/shared/` (TypeScript types shared by both, no runtime code — `import type`-only consumption, no build step).

## Commands

Run from the repo root unless noted.

```bash
npm install                 # installs all three workspaces
npm run dev:server          # tsx watch server/src/index.ts (port 4000)
npm run migrate             # applies server/src/db/migrations/*.sql in order
npm run seed                # loads server/src/db/seed/data/indian-dishes-seed.json
npm run dev:mobile          # expo start (mobile/)
```

Server workspace (`cd server`):
```bash
npm run dev        # tsx watch, local dev
npm run build      # tsc -p tsconfig.json -> dist/server/src/index.js (note the nested path — see Gotchas)
npm run start      # node dist/server/src/index.js (run build first)
npm run typecheck  # tsc --noEmit
```
No test runner is configured yet.

Mobile workspace (`cd mobile`):
```bash
npm run start        # expo start
npm run android       # expo start --android
npm run ios           # expo start --ios (macOS only)
npm run typecheck     # tsc --noEmit
npx expo-doctor       # validates Expo config/native module compatibility
npx expo export --platform android   # compiles the JS bundle without a device — cheapest way to catch import/bundling errors
```
`react-native-vision-camera` requires a dev-client build (`expo-dev-client`), not plain Expo Go — screens that don't touch the camera (Home, Search, DishDetail) can still run in Expo Go.

Database: local Postgres, `DATABASE_URL` in `server/.env` (copy from `server/.env.example`). Migrations require the `pg_trgm` and `pgcrypto` extensions (created by migration `001`).

## Architecture

### Backend adapter pattern (the core design decision)

Every external AI/OCR/storage capability is defined as a TypeScript interface with a **stub** implementation (deterministic, seed-data-driven, no API keys) and a **real** implementation (scaffolded, throws "not configured" until filled in). A factory in each adapter's `index.ts` picks the implementation via an env var:

- `server/src/adapters/ocr/` — `OCR_PROVIDER=stub|google-vision`
- `server/src/adapters/ai/` — `AI_PROVIDER=stub|claude` (menu dish-name detection)
- `server/src/adapters/nutrition/` — `NUTRITION_PROVIDER=stub|claude`
- `server/src/adapters/storage/` — `STORAGE_PROVIDER=local-disk|s3`

Services depend only on the interface (via `get*Adapter()`), never on a concrete class, so switching a provider is an env var change plus filling in the real adapter's method body — no call-site changes in `services/`, `controllers/`, or `routes/`. When adding a new AI-backed capability, follow this same interface/stub/factory shape rather than calling a provider SDK directly from a service.

The stub nutrition/OCR/AI adapters are not decorative — they're what makes the app usable end-to-end today. `StubOcrAdapter` returns canned (but realistic, noisy) menu text; `StubMenuUnderstandingAdapter` applies rule-based heuristics to extract dish-name candidates; `StubNutritionEstimatorAdapter` resolves candidates against the real seed dataset via fuzzy match. Don't treat stub adapters as throwaway test fixtures — they're production code for V1.

### Search & dish resolution

`server/src/utils/fuzzyMatch.ts` implements typo/partial-word-tolerant dish lookup using Postgres `pg_trgm`'s `word_similarity()` (not plain `similarity()` — word_similarity matches a short query word against the best-matching substring of a longer multi-word dish name, which plain similarity handles poorly). Threshold is tuned to `0.4` in that file — this is a deliberate balance point (see the file for the reasoning: lower thresholds catch real typos but also produce cross-dish false positives from shared words like "chicken"). This single function backs **both** `search.service.ts` (user search) and `stubNutritionEstimator.adapter.ts` (resolving detected menu dishes), so both paths behave identically.

`dish_synonyms` table stores abbreviations/misspellings/regional names per dish; exact synonym matches are always ranked above fuzzy matches (`matchType: 'exact_synonym' | 'fuzzy'`).

### Menu scan pipeline (async job pattern)

`POST /api/v1/menu-scans` (or `/qr-menu/resolve`) returns a `jobId` immediately; the actual OCR→clean→detect→resolve pipeline runs asynchronously (fire-and-forget from the controller) and the client polls `GET /api/v1/menu-scans/:jobId` until `status` is `completed`/`failed`. This was chosen over holding the HTTP connection open (OCR+AI can take 5-10s) — see `menuParsing.service.ts` for the pipeline stages and `job.service.ts` for job/detected-dish persistence.

Both the direct file-upload path (`processMenuScanFile`) and the QR path (`processMenuScanText`, which skips OCR since HTML is already text) converge on the same `resolveAndSaveDishes()` function, which now routes dish-name resolution through `nutritionEstimation.service.ts` (cache-aside over `ai_estimation_cache`, keyed by normalized dish name) rather than calling the fuzzy matcher directly — this means repeated dish names across a menu (or across scans) hit the cache instead of re-resolving, and this is also the seam where a real AI provider would plug in per-dish.

### Data flow: DB row → API → mobile

Postgres rows use snake_case; `server/src/utils/mappers.ts::mapDishRow()` is the single place that converts a `dishes` row into the shared camelCase `Dish` type (from `packages/shared`). Numeric Postgres columns (`NUMERIC`, e.g. `health_score`, `protein_g`) come back from `pg` as strings — mapper functions must `Number()`-coerce them; this has already caused one bug (health_score was originally `INT` but seed data has decimals like `6.5`, migration `002` uses `NUMERIC(3,1)`).

Mobile screens never call `fetch` directly — always go through `mobile/src/api/*.api.ts` (typed wrappers around `mobile/src/api/client.ts`) and the React Query hooks in `mobile/src/hooks/queries/`. `useMenuScanJob` polls via React Query's `refetchInterval`, stopping once status is terminal — this is the client side of the async job pattern above.

### Shared types

`packages/shared/src/types/*.ts` are the DTO contracts between server and mobile (`Dish`, `DishDetail`, `SearchResponse`, `MenuScanJob`, `DetectedDish`, etc.). Both `server/tsconfig.json` and `mobile/tsconfig.json` alias `@menu-scanner/shared` straight to `packages/shared/src/index.ts` (no build step for the shared package) — when changing a shared type, both workspaces pick it up immediately, but also update `mapDishRow` / controller response shapes if the `dishes` table schema changed.

## Gotchas

- **`server/tsconfig.json` has no `rootDir`** — it was removed because setting `rootDir: "src"` conflicts with importing `packages/shared/src` from outside that directory. This means `npm run build` emits to `dist/server/src/index.js`, not `dist/index.js` (the `start` script already accounts for this). Don't "fix" this by re-adding `rootDir` without also changing how `@menu-scanner/shared` is consumed.
- **`react-native-vision-camera` is pinned to `^4.7.3`, not the latest `5.x`.** v5 is a from-scratch Nitro-Modules rewrite with a different API (no `useCodeScanner` export in the same form, `Camera` type/value confusion, different props). Don't bump this major version without re-verifying the camera/QR screens compile and actually re-testing on a real device/emulator.
- No Android/iOS emulator is available in this dev environment historically — mobile changes have been verified via `tsc --noEmit`, `expo-doctor`, and `expo export` (bundle compiles), not by actually running the app on a screen. Treat mobile UI changes as unverified-on-device until confirmed otherwise.
- Seed dataset (`server/src/db/seed/data/indian-dishes-seed.json`) must stay in sync with anything the stub OCR adapter's canned menu text (`stubOcr.adapter.ts`) references — if you add a canned menu line, add the corresponding dish to the seed set, or it will resolve as a low-confidence/wrong match.
