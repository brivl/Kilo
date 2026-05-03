# Calorie & Gym Tracker — Project Plan

## What this is

A personal mobile app for calorie/macro tracking, gym journaling, training plan building, and body weight + progress tracking. Local-first, cloud sync later. UX reference: MyFitnessPal.

---

## Tech stack

| Concern                | Choice                  | Reason                                                                              |
| ---------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| Framework              | Expo (React Native)     | Managed workflow, OTA updates, no native toolchain pain                             |
| Navigation             | Expo Router             | File-based, typed routes                                                            |
| Local database         | WatermelonDB            | Offline-first, sync-ready for later, built for RN                                   |
| State                  | Zustand                 | Minimal boilerplate, works alongside WatermelonDB                                   |
| Charts                 | Victory Native          | Native RN charts, no WebView                                                        |
| Food data              | Open Food Facts API     | Free, 3M+ products, barcode support, no API key                                     |
| Language               | TypeScript throughout   |                                                                                     |
| Unit/integration tests | Jest + jest-expo + RNTL | Vitest is not reliably compatible with React Native Testing Library — do not use it |
| E2E tests              | Maestro                 | CLI-driven, no code required, runs on simulator                                     |

---

## Build phases

### Phase 1 — Food log (build this first)

- Daily food log screen with meal sections: Breakfast / Lunch / Dinner / Snacks
- Macro ring at top showing daily protein / carbs / fat progress
- Food search via Open Food Facts API
- Manual food entry (name, calories, macros, quantity, unit)
- Recent foods list (last 10 logged items shown before API results)
- One-tap re-log from history
- Daily calorie and macro totals

### Phase 2 — Gym journal

- Log workout sessions (name, date, notes, duration)
- Log sets per exercise (exercise name, set number, reps, weight in kg)
- Exercise history per movement
- Session history list

### Phase 3 — Training plans

- Create reusable plan templates
- Assign exercises to days
- Launch a live session from a plan (sets auto-populate)
- Link completed sessions back to the plan they came from

### Phase 4 — Progress & body weight

- Daily body weight log
- Progress charts: body weight over time, weekly volume per exercise, daily macros over time
- Use Victory Native for all charts

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
exercise_name string   plain string in v1, normalise later
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

> `exercise_name` is intentionally a plain string in v1. Do not create an `exercises` table yet — wait until Phase 3 when you have enough real data to know what attributes it needs.

---

## UX patterns to follow (from MFP)

- Quick add: default quantity to last used amount for that food item
- Meal sections visible on one daily screen, not tabbed
- Macro ring (protein / carbs / fat) at top of food log
- Recent foods first in search before API results
- One-tap re-log from yesterday's entries

---

## Build pipeline

**Decision: EAS Build (cloud) + development build, iOS first.**

- Use EAS Build for all device builds. Do not build locally with Xcode.
- Target iOS only in v1. Android in v2 once the iOS build is stable.
- Development build required from day one — WatermelonDB uses native modules and will not run in Expo Go.
- `eas.json` profiles: `development` (simulator + device), `preview` (internal TestFlight), `production` (App Store — future).

Setup commands (run once):

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform ios
```

App identifiers (fill in before first build):

- Bundle ID: `com.yourname.gymtracker`
- App name: `GymTracker` (placeholder — rename before TestFlight)

App icon and splash screen: generate via `npx expo-image-splatter` or Expo's asset generator. Place outputs in `assets/`. Do not ship with default Expo assets.

---

## Environment config

**Decision: `app.config.ts` with `expo-constants`. No `.env` files.**

All environment values flow through `app.config.ts` → `Constants.expoConfig.extra`. Never hardcode URLs or keys in source files.

```ts
// app.config.ts
export default {
  expo: {
    extra: {
      openFoodFactsBaseUrl: 'https://world.openfoodfacts.org',
    },
  },
};
```

Access in code:

```ts
import Constants from 'expo-constants';
const BASE_URL = Constants.expoConfig?.extra?.openFoodFactsBaseUrl;
```

Add `app.config.ts` values here as they're introduced. Never add secret keys — this app has none in v1.

---

## Error handling

**Decision: Zod for external data, try/catch at the store layer, toast for user-facing errors.**

Rules:

- All Open Food Facts API responses validated with Zod before use. Invalid responses are logged and treated as empty results — never crash.
- All DB writes wrapped in try/catch inside the store. Errors logged to console in dev.
- User-facing errors shown via a minimal toast/banner component (`components/Toast.tsx`). No `Alert.alert()` calls.
- Network errors show "Couldn't reach server. Check your connection." No raw error messages exposed to the user.
- Silent failures are banned. Every catch block either surfaces to UI or explicitly logs why it's safe to ignore.

Error boundary: wrap each tab screen in a React error boundary (`components/ErrorBoundary.tsx`). Fallback renders a "Something went wrong" screen with a retry button.

---

## Database migrations

**Decision: migrations.ts file created alongside schema.ts from day one.**

WatermelonDB requires explicit migrations. Schema changes without a migration wipe existing data on device.

Structure:

```ts
// db/migrations.ts
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    // Add new migrations here as schema evolves
    // { toVersion: 2, steps: [...] }
  ],
});
```

Rules:

- Every schema change requires a migration entry. No exceptions.
- Never modify an existing migration. Only add new ones.
- Bump `schema version` in `schema.ts` to match the latest migration version.
- migrations.ts is created in Phase 1 even if empty, so the pattern exists before it's needed.

---

## ID strategy

**Decision: WatermelonDB-generated IDs only.**

- Never use `uuid`, `nanoid`, or any external ID library.
- Never manually assign `id` when creating records.
- WatermelonDB assigns IDs automatically via `.create()`. Rely on this entirely.
- This ensures future sync compatibility with WatermelonDB's sync protocol.

---

## Accessibility

**Decision: minimum viable a11y, enforced from the start.**

Rules:

- Every `TouchableOpacity`, `Pressable`, and `Button` must have an `accessibilityLabel`.
- All tappable areas minimum 44×44pt. Use `minHeight: 44, minWidth: 44` in styles.
- Images and icons that convey meaning must have `accessibilityHint`.
- Form inputs must have `accessibilityLabel` matching their visible label.
- No other a11y work required in v1 beyond these four rules.

---

## Performance rules for lists

**Decision: FlatList everywhere, no ScrollView + map().**

Rules:

- Any list that can grow beyond ~20 items uses `FlatList`. This covers: food log entries, food search results, workout sets, session history, exercise history.
- Every `FlatList` must have `keyExtractor`, `initialNumToRender={15}`, and `maxToRenderPerBatch={10}`.
- Add `getItemLayout` when list items have fixed height (e.g. SetRow, FoodEntry). This eliminates scroll jank entirely.
- Never use `ScrollView` wrapping a `.map()` for data-driven lists. Only use `ScrollView` for static content (forms, settings screens).

---

## Git workflow

**Decision: feature branches, never commit directly to main.**

Rules:

- Branch naming: `phase1/food-log-screen`, `phase2/workout-journal`, `fix/macro-calculation`.
- One branch per feature or screen. Claude Code always works on a feature branch.
- Commit after each working unit: model created, screen renders, tests pass.
- Commit messages: `feat:`, `fix:`, `test:`, `chore:` prefixes. No other formats.
- Before starting a new Claude Code session: create a new branch. Before ending: commit everything that works, even if incomplete.
- `main` is always runnable. Never merge a broken branch.

---

## Explicitly out of scope for v1

- Cloud sync
- Barcode scanner
- AI food parsing (natural language → macros)
- Social / sharing features
- Push notifications
- Custom macro goals per user

---

## Folder structure (Expo Router)

```
app/
  (tabs)/
    index.tsx          # Food log (today)
    journal.tsx        # Gym journal
    plans.tsx          # Training plans
    progress.tsx       # Charts + body weight
  food/
    search.tsx
    add.tsx
  session/
    [id].tsx
components/
  MacroRing.tsx
  FoodEntry.tsx
  SetRow.tsx
  Toast.tsx            # User-facing error display
  ErrorBoundary.tsx    # Per-tab error boundary
db/
  schema.ts            # WatermelonDB schema
  migrations.ts        # WatermelonDB migrations — created Phase 1, updated with every schema change
  models/              # WatermelonDB model classes
store/
  settingsStore.ts     # weightUnit, selectedDate, calorieGoal, macroGoals — persisted to AsyncStorage
  foodStore.ts
  workoutStore.ts
utils/
  formatWeight.ts      # formatWeight(kg, unit) — single source of truth for all weight display
  macros.ts            # calorie and macro calculation helpers
__tests__/
  unit/                # Pure logic — helpers, stores, schemas
  integration/         # RNTL component tests with real WatermelonDB in-memory adapter
e2e/
  log-meal.yaml        # Maestro flows — run manually on simulator
  log-workout.yaml
  log-body-weight.yaml
```

---

## Testing strategy

### Stack

- **Runner**: Jest with `jest-expo` preset
- **Component tests**: `@testing-library/react-native` (RNTL)
- **E2E**: Maestro — flows live in `e2e/` as `.yaml` files, run on simulator

Do not use Vitest. It is not reliably compatible with RNTL.
Always run Jest with `--no-watchman` (watchman is incompatible with the Claude Code sandbox).

### What to test and when

**Unit tests** — write alongside every new utility, store function, or data transformation. These are fast and should cover pure logic with no mocks beyond what's necessary.

Target:

- Macro calculation helpers (e.g. calories from macros, per-100g normalisation)
- Zustand store actions and selectors
- Zod validation schemas for Open Food Facts responses
- Date helpers

**Integration tests** — write when wiring a screen to the DB or store. Use RNTL to render the component with a real (in-memory) WatermelonDB instance. No mocking of DB logic.

Target:

- Food log screen: renders entries for today, adds a new entry, totals update
- Workout session screen: adds sets, persists correctly
- Body weight log: entry saves and appears in list

**E2E (Maestro)** — write one flow per major user journey after the integration tests for that phase pass. These run on simulator, not in Claude Code's sandbox — you execute them manually.

Target flows:

- Log a meal end-to-end (search → select → confirm → see in daily log)
- Log a workout session (create session → add sets → complete)
- Log body weight and see it appear on progress screen

### File placement

```
__tests__/
  unit/
    macroHelpers.test.ts
    foodStore.test.ts
    openFoodFactsSchema.test.ts
  integration/
    FoodLogScreen.test.tsx
    WorkoutSessionScreen.test.tsx
e2e/
  log-meal.yaml
  log-workout.yaml
  log-body-weight.yaml
```

### Rules

- Every utility function gets a unit test before or alongside implementation — no exceptions.
- Integration tests use a real WatermelonDB in-memory adapter, not mocks.
- Never mock the DB layer in integration tests. Only mock network calls (Open Food Facts API).
- A screen is not complete until it has an integration test covering the happy path.
- Maestro flows cover only happy paths in v1. Edge cases stay in unit/integration tests.
- Do not write snapshot tests. They break constantly and add no value here.

---

## First launch and onboarding

**Decision: no onboarding wizard. Drop straight into the food log tab.**

- On first launch, WatermelonDB initialises and migrations run silently.
- User lands on the food log tab showing today's date and an empty state with a single "+ Log food" button.
- No account creation, no goal-setting wizard, no walkthrough. Goals use defaults (see Settings store below) and can be changed later in a settings screen (Phase 4).
- `app/(tabs)/index.tsx` is always the entry point. No redirect logic on first launch.

---

## Settings store

**Decision: Zustand store persisted to AsyncStorage via `zustand/middleware/persist`.**

Settings are not WatermelonDB data — they don't need sync or relational queries.

```ts
// store/settingsStore.ts
interface SettingsState {
  weightUnit: 'kg' | 'lbs';
  selectedDate: string; // YYYY-MM-DD, defaults to today
  calorieGoal: number; // default 2000
  proteinGoal: number; // default 150g
  carbsGoal: number; // default 250g
  fatGoal: number; // default 65g
}
```

- `selectedDate` is the single source of truth for which day all tabs are displaying. Every tab reads from `settingsStore.selectedDate`, never from local component state.
- Weight unit defaults to `kg`. User can change in settings screen.
- Macro goals default to 2000 kcal / 150g protein / 250g carbs / 65g fat. These are the values the macro ring renders against.
- Persisted via AsyncStorage so settings survive app restarts.

---

## Weight display

**Decision: all display goes through `utils/formatWeight.ts`. Internal storage always kg.**

```ts
// utils/formatWeight.ts
export function formatWeight(kg: number, unit: 'kg' | 'lbs'): string {
  if (unit === 'lbs') return `${(kg * 2.20462).toFixed(1)} lbs`;
  return `${kg} kg`;
}
```

- Never do unit conversion inline in a component.
- Never store lbs in the database.
- Read `weightUnit` from `settingsStore`, pass to `formatWeight`. That's the entire pattern.

---

## Date navigation

**Decision: shared date header component, `selectedDate` in settingsStore.**

- A `DateHeader` component renders at the top of the food log and gym journal tabs.
- It shows the selected date with left/right arrow buttons to move one day at a time. Tapping the date opens a date picker (use `@react-native-community/datetimepicker`).
- "Today" button resets `selectedDate` to the current date.
- `selectedDate` lives in `settingsStore`, not in component state, so navigating to a different tab preserves the selected date.
- Progress tab ignores `selectedDate` — it always shows a range, not a single day.

---

## Project setup steps (run once before Phase 1)

In this order:

```bash
# 1. Create project
npx create-expo-app gymtracker --template blank-typescript
cd gymtracker

# 2. Delete app.json, replace with app.config.ts
rm app.json

# 3. Install core dependencies
npx expo install expo-router expo-constants @nozbe/watermelondb zustand
npx expo install @react-native-async-storage/async-storage
npx expo install @react-native-community/datetimepicker
npm install zod victory-native

# 4. Install dev dependencies
npm install --save-dev jest jest-expo @testing-library/react-native @types/jest

# 5. Configure TypeScript path aliases in tsconfig.json
# Add: "paths": { "@/*": ["./*"] }

# 6. EAS setup
npm install -g eas-cli
eas login
eas build:configure

# 7. Init git
git init && git add . && git commit -m "chore: initial project setup"
```

Delete `app.json` and use only `app.config.ts`. Having both causes unpredictable merge behaviour from Expo.

---

## TypeScript path aliases

Add to `tsconfig.json` before writing any imports:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

All imports use `@/` prefix: `import { formatWeight } from '@/utils/formatWeight'`. Never use relative paths with `../`. Claude Code must follow this from the first file it creates.

---

## Expo SDK version

Pin the Expo SDK version in `package.json` before starting. Do not upgrade the Expo SDK mid-project. SDK upgrades require dedicated time to resolve breaking changes — they are not part of any feature branch.

Check current stable SDK version at project creation and record it here: `expo: X.X.X` (fill in on setup).

---

## Definition of done

A task is complete when all of the following are true:

1. Code is written and TypeScript reports zero errors (`npx tsc --noEmit`)
2. Unit tests written and passing (`jest --no-watchman`)
3. Integration test written and passing for any new screen
4. Feature runs correctly on iOS simulator
5. Changes committed to the feature branch with a descriptive commit message

Claude Code must not consider a task done until all five conditions are met. If the simulator cannot be used in a session, conditions 1–3 still apply.

---

## Session instructions for Claude Code

- Always work one phase at a time. Do not start Phase 2 until Phase 1 is shippable.
- Always work on a feature branch. Never commit to main.
- When adding a new screen: create branch → wire WatermelonDB model → build UI → write integration test → commit.
- Write unit tests for every utility or store function at the same time as the implementation.
- All imports use `@/` path aliases. Never use relative `../` imports.
- All weights stored in kg internally. All display goes through `formatWeight(kg, unit)` from `@/utils/formatWeight`.
- Dates stored as `YYYY-MM-DD` strings. `selectedDate` always read from `settingsStore`, never local state.
- Do not add cloud sync, auth, or backend logic — that is a future phase.
- Keep components small. If a component exceeds ~150 lines, split it.
- Run `jest --no-watchman` always. Never use `jest --watch` or plain `jest` in the sandbox.
- Every schema change requires a migration entry in `db/migrations.ts` and a version bump in `db/schema.ts`.
- Never assign IDs manually. Let WatermelonDB generate them via `.create()`.
- All lists use `FlatList`. Never `ScrollView` + `.map()` for data-driven lists.
- All tappable elements must have `accessibilityLabel` and minimum 44×44pt touch target.
- No silent catch blocks. Every error either surfaces to UI via Toast or is explicitly logged with a reason.
- Do not write snapshot tests.
- A task is only done when: zero TS errors + tests passing + runs on simulator + committed to branch.
