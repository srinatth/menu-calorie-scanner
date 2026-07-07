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
npm run web           # expo start --web — Metro's web bundler (Expo SDK 57), used for local dev/testing of non-camera screens
npm run test:e2e      # playwright test — runs mobile/e2e/*.spec.ts against the web build; auto-boots/tears down the dev server (needs the API server running separately on :4000 for real search results)
npx expo-doctor       # validates Expo config/native module compatibility
npx expo export --platform android   # compiles the JS bundle without a device — cheapest way to catch import/bundling errors
```
The `react-native-vision-camera` config plugin in `mobile/app.json` gives the whole project a custom native runtime fingerprint — Expo Go cannot open **any** screen of this project, not just camera ones (it fails with `redirect middleware: Unable to determine redirect location for runtime 'custom'`). A dev-client build is required: `cd mobile && npx eas-cli login && npx eas-cli build:configure && npx eas-cli build --profile development --platform android` (cloud build; no local Android SDK is assumed), install the resulting APK on-device, then run `npx expo start --dev-client`. After any dev-client rebuild or entry-point change, start with `-c` (`npx expo start --dev-client -c`) to clear Metro's bundler cache — a stale cache is a common cause of `Unable to resolve "../../App" from "node_modules/expo/AppEntry.js"`.

Database: local Postgres, database name `menu_calorie_scanner`, connection string in `DATABASE_URL` in `server/.env` (copy from `server/.env.example`). Migrations require the `pg_trgm` and `pgcrypto` extensions (created by migration `001`).

Mobile talks to the API via `EXPO_PUBLIC_API_BASE_URL` (`mobile/.env`, read in `mobile/src/api/client.ts`), defaulting to `http://localhost:4000`. That default only resolves correctly when client and server share a device (web/simulator) — on a physical phone, `localhost` means the phone itself, so requests just hang/time out. Set `EXPO_PUBLIC_API_BASE_URL` to the dev machine's LAN IP (e.g. `http://192.168.x.x:4000`) in `mobile/.env` when testing on-device, and restart Metro afterward (env vars are baked in at bundler start, not read live).

## Architecture

### Backend adapter pattern (the core design decision)

Every external AI/OCR/storage capability is defined as a TypeScript interface with a **stub** implementation (deterministic, seed-data-driven, no API keys) and a **real** implementation (scaffolded, throws "not configured" until filled in). A factory in each adapter's `index.ts` picks the implementation via an env var:

- `server/src/adapters/ocr/` — `OCR_PROVIDER=stub|google-vision`
- `server/src/adapters/ai/` — `AI_PROVIDER=stub|claude|openrouter` (menu dish-name detection)
- `server/src/adapters/nutrition/` — `NUTRITION_PROVIDER=stub|claude|openrouter`
- `server/src/adapters/storage/` — `STORAGE_PROVIDER=local-disk|s3`

The `openrouter` provider for both AI capabilities calls OpenRouter's OpenAI-compatible chat endpoint via the shared `server/src/utils/openrouter.ts` client (bearer `OPENROUTER_API_KEY`, model from `OPENROUTER_MODEL`, default in that file). It's a real (non-stub) implementation, but note free-tier OpenRouter models are frequently rate-limited upstream (429) — the detection adapter throws on failure (fails the scan), while the nutrition adapter degrades to `unresolved` per-dish so one 429 never kills a whole scan. Detection and estimation prompts ask for a compact JSON payload but parse defensively (free models don't reliably honor strict JSON) — e.g. the detector extracts every integer token rather than requiring a `[...]` array.

Services depend only on the interface (via `get*Adapter()`), never on a concrete class, so switching a provider is an env var change plus filling in the real adapter's method body — no call-site changes in `services/`, `controllers/`, or `routes/`. When adding a new AI-backed capability, follow this same interface/stub/factory shape rather than calling a provider SDK directly from a service.

The stub nutrition/OCR/AI adapters are not decorative — they're what makes the app usable end-to-end today. `StubOcrAdapter` returns canned (but realistic, noisy) menu text; `StubMenuUnderstandingAdapter` applies rule-based heuristics to extract dish-name candidates; `StubNutritionEstimatorAdapter` resolves candidates against the real seed dataset via fuzzy match. Don't treat stub adapters as throwaway test fixtures — they're production code for V1.

### Search & dish resolution

`server/src/utils/fuzzyMatch.ts` implements typo/partial-word-tolerant dish lookup using Postgres `pg_trgm`'s `word_similarity()` (not plain `similarity()` — word_similarity matches a short query word against the best-matching substring of a longer multi-word dish name, which plain similarity handles poorly). Threshold is tuned to `0.4` in that file — this is a deliberate balance point (see the file for the reasoning: lower thresholds catch real typos but also produce cross-dish false positives from shared words like "chicken"). This single function backs **both** `search.service.ts` (user search) and `stubNutritionEstimator.adapter.ts` (resolving detected menu dishes), so both paths behave identically.

`dish_synonyms` table stores abbreviations/misspellings/regional names per dish; exact synonym matches are always ranked above fuzzy matches (`matchType: 'exact_synonym' | 'fuzzy'`).

### Menu scan pipeline (async job pattern)

`POST /api/v1/menu-scans` (or `/qr-menu/resolve`) returns a `jobId` immediately; the actual OCR→clean→detect→resolve pipeline runs asynchronously (fire-and-forget from the controller) and the client polls `GET /api/v1/menu-scans/:jobId` until `status` is `completed`/`failed`. This was chosen over holding the HTTP connection open (OCR+AI can take 5-10s) — see `menuParsing.service.ts` for the pipeline stages and `job.service.ts` for job/detected-dish persistence.

Both the direct file-upload path (`processMenuScanFile`) and the QR path (`processMenuScanText`, which skips OCR since HTML is already text) converge on the same `resolveAndSaveDishes()` function, which now routes dish-name resolution through `nutritionEstimation.service.ts` (cache-aside over `ai_estimation_cache`, keyed by normalized dish name) rather than calling the fuzzy matcher directly — this means repeated dish names across a menu (or across scans) hit the cache instead of re-resolving, and this is also the seam where a real AI provider plugs in per-dish. Only `resolved` results are cached (an `unresolved` can be a transient LLM 429; caching it would pin the failure). **Because of this cache, changing resolution logic isn't enough to see new behavior on a re-scan — stale entries in `ai_estimation_cache` keep serving old matches until cleared** (`DELETE FROM ai_estimation_cache`, or a reseed which truncates it).

### Nutrition resolution: seed-first, then AI estimate

`server/src/adapters/nutrition/seedResolution.ts` is the shared seed-first resolver used by both the stub and openrouter estimators: it fuzzy-matches against the seed `dishes` table and only treats a hit as confident at `CONFIDENT_MATCH_THRESHOLD = 0.8`. This is deliberately high: `word_similarity` rewards partial overlap, so distinct dishes that share or contain a word score deceptively high ("Avakai Paneer Tikka" → "Paneer Tikka" ≈ 0.65, "French Fries" → "Idli Fries" ≈ 0.55), which on real menus caused wrong matches **and duplicates** (several menu items collapsing onto one seed dish). Measured on a real 30-dish menu, genuine matches scored 0.85-1.0 and every false collapse ≤0.79, so 0.8 cleanly separates them. It can be this aggressive only because a rejected match is no longer "wrong" — under `NUTRITION_PROVIDER=openrouter` it falls through to a per-dish LLM estimate (its own correct entry). Under `NUTRITION_PROVIDER=stub` a rejected match becomes an honest "unresolved" instead. Under `NUTRITION_PROVIDER=openrouter`, a seed miss falls through to an LLM estimate which is **persisted as a real `dishes` row** (so it satisfies the `detected_dishes.matched_dish_id` FK, dedupes by slug, and works everywhere a seed dish does). These runtime rows use `source='ai_estimate'` and `is_seed_data=false` — **distinct from the seed-curated `source='llm_estimate'` rows** (`is_seed_data=true`), which are estimated-but-hand-added dishes in the seed JSON. Don't conflate them: a cleanup like `DELETE FROM dishes WHERE source='llm_estimate'` will wipe curated seed dishes; target runtime estimates by `source='ai_estimate'` (or `is_seed_data=false`).

### Data flow: DB row → API → mobile

Postgres rows use snake_case; `server/src/utils/mappers.ts::mapDishRow()` is the single place that converts a `dishes` row into the shared camelCase `Dish` type (from `packages/shared`). Numeric Postgres columns (`NUMERIC`, e.g. `health_score`, `protein_g`) come back from `pg` as strings — mapper functions must `Number()`-coerce them; this has already caused one bug (health_score was originally `INT` but seed data has decimals like `6.5`, migration `002` uses `NUMERIC(3,1)`).

Mobile screens never call `fetch` directly — always go through `mobile/src/api/*.api.ts` (typed wrappers around `mobile/src/api/client.ts`) and the React Query hooks in `mobile/src/hooks/queries/`. `useMenuScanJob` polls via React Query's `refetchInterval`, stopping once status is terminal — this is the client side of the async job pattern above.

### Shared types

`packages/shared/src/types/*.ts` are the DTO contracts between server and mobile (`Dish`, `DishDetail`, `SearchResponse`, `MenuScanJob`, `DetectedDish`, etc.). Both `server/tsconfig.json` and `mobile/tsconfig.json` alias `@menu-scanner/shared` straight to `packages/shared/src/index.ts` (no build step for the shared package) — when changing a shared type, both workspaces pick it up immediately, but also update `mapDishRow` / controller response shapes if the `dishes` table schema changed.

## Gotchas

- **`server/tsconfig.json` has no `rootDir`** — it was removed because setting `rootDir: "src"` conflicts with importing `packages/shared/src` from outside that directory. This means `npm run build` emits to `dist/server/src/index.js`, not `dist/index.js` (the `start` script already accounts for this). Don't "fix" this by re-adding `rootDir` without also changing how `@menu-scanner/shared` is consumed.
- **`react-native-vision-camera` is pinned to `^4.7.3`, not the latest `5.x`.** v5 is a from-scratch Nitro-Modules rewrite with a different API (no `useCodeScanner` export in the same form, `Camera` type/value confusion, different props). Don't bump this major version without re-verifying the camera/QR screens compile and actually re-testing on a real device/emulator.
- No Android/iOS emulator is available in this dev environment historically — mobile changes have been verified via `tsc --noEmit`, `expo-doctor`, and `expo export` (bundle compiles), not by actually running the app on a screen. Treat mobile UI changes as unverified-on-device until confirmed otherwise.
- Seed dataset (`server/src/db/seed/data/indian-dishes-seed.json`) must stay in sync with anything the stub OCR adapter's canned menu text (`stubOcr.adapter.ts`) references — if you add a canned menu line, add the corresponding dish to the seed set, or it will resolve as a low-confidence/wrong match. Currently 66 dishes; entries added without a real nutrition-database lookup (e.g. estimated from typical recipes rather than ICMR-NIN/USDA) are labeled `source: "llm_estimate"` (vs. `icmr_nin`/`usda` for the original curated set) so provenance stays honest — `npm run seed` does a full `TRUNCATE ... CASCADE`, which also wipes any existing `menu_scan_jobs`/`detected_dishes`/`ai_estimation_cache` history.
- **`textCleaning.ts` must not strip a trailing *two*-digit number** — "65" is a whole class of Indian dish names (Gobi 65, Paneer 65, Idli 65, Chicken 65), not a price. The bare-number price rule only strips 3-4 digit trailing numbers; currency-prefixed (`₹65`) and `50/-`-style prices are still stripped at any length. It also peels trailing OCR misreads of the veg/spicy icons that sit next to dish names (`Paneer Fry*`, `Chinta Chiguru Paneer ✔`, `Idli Fries 1:`) — a lone trailing single digit and stray symbols, but never a 2-digit suffix. Getting this wrong corrupts the detected dish name and cascades into wrong fuzzy matches (`Paneer 65` → `Paneer` → `Paneer Butter Masala`).
- **`StubOcrAdapter` returns fixed canned text regardless of the actual photographed image** — scanning a *real* menu with `OCR_PROVIDER=stub` will therefore produce wrong/unrelated detected dishes; that's expected stub behavior, not a resolution bug. Wiring up `OCR_PROVIDER=google-vision` and `AI_PROVIDER=claude` is required before menu-scan accuracy against arbitrary real-world photos is meaningful.
- **Don't build multipart file uploads with `FormData` + a plain `{ uri, name, type }` object cast as `Blob`** (the classic RN pattern, still common in tutorials) — this project's mandatory New Architecture rejects it at runtime with `Unsupported FormDataPart implementation`. Use `expo-file-system`'s native `File.upload()` (`UploadType.MULTIPART`) instead, as `mobile/src/api/menuScan.api.ts` does — it performs the multipart upload at the native layer, bypassing JS `FormData`/`fetch` entirely.
- **`mobile/package.json` pins Expo SDK 57 (`expo ~57.0.1`, `react 19.2.3`, `react-native 0.86.0`) — treat this as the source of truth.** A working-tree-only downgrade to SDK 46 previously went uncommitted and silently sat in the repo, causing a long debugging detour (SDK 46's legacy webpack 4 web bundler hitting OpenSSL and Babel-syntax incompatibilities that don't exist on SDK 57's Metro-based web bundler). If `npm install`, typecheck, or `expo start` suddenly break with dependency-resolution or bundler errors that don't match these docs, run `git diff mobile/package.json` before assuming the tooling itself is broken.
- **The captured menu photo is cropped to the preview's visible region before OCR (`cropToPreview` in `CameraCaptureView.tsx`).** The full-screen preview renders in vision-camera's default "cover" mode — it centre-crops the sensor frame to fill the tall screen, so the user only sees a centred slice, but `takePhoto()` saves the *whole* frame. Without cropping, OCR picks up dishes just above/below what was on screen (a real bug report: a soup section above the framed "Appetizers" got scanned). No sensor format matches a phone's ~20:9 screen, so `useCameraFormat` aspect-matching can't fix this — the fix is to centre-crop the saved photo (via `expo-image-manipulator`) back down to the screen's aspect ratio. If this ever crops the *wrong* region (e.g. sides instead of top/bottom), suspect a photo-orientation mismatch: the crop assumes the manipulator loads the image upright (portrait), matching the portrait-locked app.
- **Camera-dependent screens (`MenuScanScreen`, `QRScanScreen`) must be registered in `RootNavigator.tsx` via `getComponent`, not `component`.** `react-native-vision-camera` throws at module-load time on web (`VisionCamera currently does not work on web`); a static `import` + `component={...}` reference evaluates that module eagerly at app startup, which crashes the *entire* app (blank white page) as soon as it's opened on web — not just the camera screens. `getComponent={() => require('../screens/MenuScanScreen').MenuScanScreen}` defers the `require()` until the screen is actually navigated to.
