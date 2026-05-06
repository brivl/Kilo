# Kilo — Developer Guide & Project Plan

## Communication style

- No preamble, short summaries, short recaps of what was just done.
- No "I'll now...", "Let me...", "Here's what I did..." — just do it.
- No emoji, no encouragement, no filler.
- Drop articles, conjunctions, filler words where meaning is clear without them. "Created FoodEntry model" not "I have created the FoodEntry model". "Missing keyExtractor on FlatList" not "It looks like the keyExtractor prop is missing on the FlatList component".
- When reporting results: file paths and outcomes only.
- When asking for input: one sentence max.
- When explaining an error: error message, cause, fix. Nothing else.
- Commit messages: prefix + description under 50 chars. No body.
- If something worked, say nothing. Move to the next task.

---

## Commands

```bash
npx expo start         # Start dev server
npm run lint           # ESLint
npm run lint:fix       # ESLint with auto-fix
npm run format         # Prettier write
npm run format:check   # Prettier check only
npm run typecheck      # npx tsc --noEmit
npm test -- --no-watchman --forceExit   # Run Jest (always use these flags in sandbox)
```

## Pre-commit order

`format → lint → typecheck` — run all three before committing.

---

## Task tracking

**Source of truth:** `tasks.md` — lists all completed and pending work organized by phase.

---

## Config files

| File               | Purpose                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| `tsconfig.json`    | Strict TS + `noUncheckedIndexedAccess`, path alias `@/*`                      |
| `eslint.config.js` | expo + prettier, `no-explicit-any` error                                      |
| `.prettierrc`      | semicolons disabled, single quotes, trailing commas                           |
| `jest.config.js`   | jest-expo preset, transformIgnorePatterns for native pkgs                     |
| `jest.setup.ts`    | Global mocks: reanimated, Skia, victory-native, async-storage, expo-constants |

---

## What this is

A personal mobile app for calorie/macro tracking, gym journaling, training plan building, and body weight + progress tracking. Local-first with cloud sync and auth planned. UX reference: MyFitnessPal.

---

## Tech stack

| Concern                | Choice                  | Reason                                                                              |
| ---------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| Framework              | Expo (React Native)     | Managed workflow, OTA updates, no native toolchain pain                             |
| Navigation             | Expo Router             | File-based, typed routes                                                            |
| Local database         | WatermelonDB            | Offline-first, sync-ready, built for RN                                             |
| Cloud backend          | Supabase                | Auth + Postgres + row-level security; compatible with WatermelonDB sync protocol    |
| State                  | Zustand                 | Minimal boilerplate, works alongside WatermelonDB                                   |
| Charts                 | Victory Native          | Native RN charts, no WebView                                                        |
| Food data              | Open Food Facts API     | Free, 3M+ products, barcode support, no API key                                     |
| Language               | TypeScript throughout   |                                                                                     |
| Unit/integration tests | Jest + jest-expo + RNTL | Vitest is not reliably compatible with React Native Testing Library — do not use it |
| E2E tests              | Maestro                 | CLI-driven, no code required, runs on simulator                                     |

---

## Build phases

### Phase 1 — Food log ✅ COMPLETE

- Daily food log screen with meal sections: Breakfast / Lunch / Dinner / Snacks
- Macro ring at top showing daily protein / carbs / fat progress with values
- Food search via Open Food Facts API (world.openfoodfacts.org)
- Manual food entry (name, calories, macros, quantity, unit)
- Recent foods list (last 10 logged items shown before API results)
- One-tap re-log from history
- Daily calorie and macro totals

### Phase 2 — Gym journal ✅ COMPLETE

- Log workout sessions (name, date, notes, duration)
- Log sets per exercise (exercise name, set number, reps, weight in kg)
- Exercise chips for quick re-selection within a session
- Session history list filtered by selected date

### Phase 3 — Training plans ✅ COMPLETE

- Create reusable plan templates
- Assign exercises to days (Mon–Sun) with target sets/reps/weight
- Launch a live session from a plan (sets auto-populate from plan)
- Link completed sessions back to the plan they came from

### Phase 4 — Progress & body weight ✅ COMPLETE

- Daily body weight log with notes
- Body weight chart (Victory Native line chart, last 60 entries)
- Entry history list with delete

### Phase 5 — Auth (next)

- Sign-up screen (email + password)
- Log-in screen with forgot password
- Auth token persisted via `expo-secure-store`
- All tabs gated behind auth; unauthenticated users see the auth stack
- Backend: Supabase Auth
- Add Google and Apple sign-in after email auth is working

### Phase 6 — Onboarding wizard

- Shown once after first sign-up (skippable)
- Step 1: Primary goal — lose weight / gain muscle / maintain / body recomp
- Step 2: Basic stats — current weight, height, age, sex (used for TDEE via Mifflin-St Jeor)
- Step 3: Activity level multiplier
- Step 4: Auto-calculated calorie + macro targets shown for confirmation, editable before saving
- Saves to `settingsStore` (calorieGoal, proteinGoal, carbsGoal, fatGoal)
- Flag in AsyncStorage so wizard never shows again after completion
- Progress indicator at top (step X of Y)

### Phase 7 — Cloud sync

- Mirror all WatermelonDB tables in Supabase Postgres with `user_id` column
- Supabase Edge Function implementing WatermelonDB sync protocol (pull + push)
- Row-level security: users can only read/write their own rows
- Conflict resolution: last-write-wins for v1
- Unlocks multi-device and is prerequisite for Phase 8

### Phase 8 — AI analyser (post-launch, paid — Pro tier)

- Analyses daily macro gap, progress trends, and stated goal
- Returns 3 personalised meal/ingredient suggestions + a short coaching insight
- Calls Claude API server-side via a Supabase Edge Function — API key never on the client
- Free users see a blurred preview card with an "Upgrade to Pro" prompt
- Gate via RevenueCat entitlement check (`entitlements.active['pro']`)
- Requires Phases 5 (auth), 7 (cloud sync), and RevenueCat setup

---

## Data model

### `food_entries`

```
id            string   PK
date          string   YYYY-MM-DD
meal_type     string   breakfast | lunch | dinner | snack
food_name     string
calories      number
protein_g     number
carbs_g       number
fat_g         number
quantity      number
unit          string   g | ml | oz | serving
source        string   manual | open_food_facts
created_at    number   timestamp
```

### `workout_sessions`

```
id            string   PK
date          string   YYYY-MM-DD
name          string
notes         string   nullable
duration_min  number   nullable
plan_id       string   nullable FK → training_plans
created_at    number   timestamp
```

### `workout_sets`

```
id            string   PK
session_id    string   FK → workout_sessions
exercise_name string
set_number    number
reps          number
weight_kg     number
rpe           number   nullable (1–10)
created_at    number   timestamp
```

### `body_weight_entries`

```
id            string   PK
date          string   YYYY-MM-DD
weight_kg     number
notes         string   nullable
created_at    number   timestamp
```

### `training_plans`

```
id            string   PK
name          string
created_at    number   timestamp
```

### `training_plan_exercises`

```
id               string   PK
plan_id          string   FK → training_plans
day              string   Monday | Tuesday | … | Sunday
exercise_name    string
target_sets      number
target_reps      number
target_weight_kg number
order_index      number
created_at       number   timestamp
```

> `exercise_name` is a plain string in v1. Do not create an `exercises` table yet.

---

## Architectural decisions

### Error handling

- All Open Food Facts API responses validated with Zod. Invalid responses → empty results, never crash.
- All DB writes wrapped in try/catch inside the store layer. No silent failures.
- User-facing errors via `components/Toast.tsx`. No `Alert.alert()` calls.
- Network errors: "Couldn't reach server. Check your connection." — no raw messages exposed.
- Every tab wrapped in `components/ErrorBoundary.tsx`.

### Database migrations

- Every schema change requires a migration entry in `db/migrations.ts` + version bump in `db/schema.ts`.
- Never modify an existing migration. Only add new ones.
- Current schema version: **2** (added training_plans + training_plan_exercises).

### Auth (Phase 5)

- `@supabase/supabase-js` client in `lib/supabase.ts`.
- Auth state in Zustand `authStore` (not WatermelonDB).
- On app start: check stored session → tabs if valid, auth stack if not.
- Token stored via `expo-secure-store`. Never store the password.
- Auth stack: `app/(auth)/welcome.tsx`, `sign-up.tsx`, `sign-in.tsx`.

### Onboarding (Phase 6) — Mifflin-St Jeor TDEE

```
BMR (male)   = 10 × weight_kg + 6.25 × height_cm − 5 × age + 5
BMR (female) = 10 × weight_kg + 6.25 × height_cm − 5 × age − 161

Activity multipliers: Sedentary 1.2 / Light 1.375 / Moderate 1.55 / Very 1.725 / Extreme 1.9

Goal adjustments: Lose −500 kcal / Gain +300 kcal / Maintain ±0 / Recomp ±0

Macro splits:
  Lose weight:  protein 40% / carbs 30% / fat 30%
  Gain muscle:  protein 30% / carbs 50% / fat 20%
  Maintain:     protein 30% / carbs 45% / fat 25%
  Recomp:       protein 40% / carbs 35% / fat 25%
```

Completion flag: `AsyncStorage.setItem('onboardingComplete', 'true')` — checked in `_layout.tsx`.

### Monetization

- **Free tier**: all core features (food log, gym journal, plans, progress).
- **Pro tier**: AI analyser only — RevenueCat subscription.
- Entitlement check: `Purchases.getCustomerInfo()` → `entitlements.active['pro']`.
- Free users see blurred preview + "Upgrade" CTA.
- Never use StoreKit directly — always go through RevenueCat.
- Claude API key lives only in a Supabase Edge Function, never on the client.
- Suggested pricing: ~$4.99/mo or ~$29.99/yr.

### ID strategy

WatermelonDB-generated IDs only. Never use `uuid`/`nanoid`. Never manually assign `id`.

### Weight display

All display through `utils/formatWeight.ts`. Internal storage always kg. Never convert inline.

### Date navigation

`selectedDate` in `settingsStore` is the single source of truth for all tabs. Never use local component state for the current date.

### Environment config

All values via `app.config.ts` → `Constants.expoConfig.extra`. Supabase anon key is safe to commit. Never commit a service role key.

---

## Folder structure

```
app/
  (auth)/
    welcome.tsx        # Landing: sign in or sign up
    sign-up.tsx
    sign-in.tsx
  (onboarding)/
    goal.tsx           # Step 1: goal selection
    stats.tsx          # Step 2: weight, height, age, sex
    activity.tsx       # Step 3: activity level
    targets.tsx        # Step 4: confirm + edit targets
  (tabs)/
    index.tsx          # Food log
    journal.tsx        # Gym journal
    plans.tsx          # Training plans
    progress.tsx       # Progress + body weight
  food/
    search.tsx
    add.tsx
  session/
    new.tsx
    [id].tsx
  plan/
    new.tsx
    [id].tsx
components/
  MacroRing.tsx
  FoodEntry.tsx
  Toast.tsx
  ErrorBoundary.tsx
db/
  schema.ts            # version 2
  migrations.ts
  models/
  queries/
lib/
  supabase.ts          # Phase 5
store/
  authStore.ts         # Phase 5
  settingsStore.ts
  foodStore.ts
  workoutStore.ts
  bodyWeightStore.ts
  trainingPlanStore.ts
utils/
  formatWeight.ts
  macros.ts            # TDEE helpers (Phase 6)
__tests__/
  unit/
  integration/ui/
e2e/
```

---

## Testing

**Stack:** Jest + jest-expo + RNTL v13. Never use Vitest. Always `--no-watchman --forceExit`.

**Mocking rules:**

- `@shopify/react-native-skia` + `victory-native` mocked globally in `jest.setup.ts`.
- `@/db/database` mocked per test file with lazy getter → `makeTestDatabase()` LokiJS instance.
- `expo-router` mocked per test file. Variables referenced inside mock factories must be `mock`-prefixed.
- `react-native-safe-area-context` mocked wherever `DateHeader` or `Toast` renders.

**Rules:**

- Every utility/store function gets a unit test alongside implementation.
- Every screen gets an integration test covering the happy path before it's considered done.
- Never mock the DB layer in integration tests. Only mock network (OFF API).
- No snapshot tests.

---

## Definition of done

1. `npx tsc --noEmit` — zero errors
2. `npm test -- --no-watchman --forceExit` — all passing
3. Integration test written for any new screen
4. Feature verified on iOS simulator
5. Committed to feature branch

---

## Session rules

- One phase at a time. Don't start Phase 6 until Phase 5 ships.
- Always on a feature branch. Never commit to main.
- New screen: branch → model/store → UI → integration test → commit.
- All imports use `@/`. Never `../`.
- All weights in kg internally. Display via `formatWeight()`.
- `noUncheckedIndexedAccess` is on — never use array index as non-null without a fallback.
- Every schema change: migration entry + version bump.
- Never assign IDs manually.
- All lists use `FlatList`. Never `ScrollView` + `.map()`.
- All tappable elements: `accessibilityLabel` + min 44×44pt.
- No silent catch blocks.
- `jest --no-watchman --forceExit` always. Never plain `jest`.
