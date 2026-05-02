# Phase 1 — Food Log: Session-Sized Task Breakdown

Each task below is scoped to fit in a single Claude Code session. Tasks are ordered so each one builds on the previous. Every task must satisfy the project-wide **Definition of Done** from `CLAUDE.md`:

1. `npx tsc --noEmit` reports zero errors
2. Unit tests written and passing (`npm test`, which wraps `jest --no-watchman`)
3. Integration test written and passing for any new screen
4. Feature runs correctly on iOS simulator (or noted N/A if simulator unavailable)
5. Changes committed to the feature branch with a descriptive commit message

> **Repo state at planning time (2026-05-03):** Expo SDK 54.0.33, expo-router 6.x, TypeScript 5.9, React 19, RN 0.81. `tsconfig.json` already declares `@/*` path aliases. `app.json` does not exist (good — `app.config.ts` will be the single config). `babel.config.js` does not exist (Expo's default is being used implicitly). Existing template files in `components/` (`themed-text.tsx`, `parallax-scroll-view.tsx`, `hello-wave.tsx`, `external-link.tsx`, `haptic-tab.tsx`, `ui/`) and `app/(tabs)/{explore.tsx,_layout.tsx}` plus `app/modal.tsx` are starter scaffolding that needs to be replaced or removed.

---

## 1. Project foundation: dependencies, config, Babel, Jest

- **Branch:** `phase1/project-foundation`
- **Before:** Expo SDK 54 scaffolding from `create-expo-app` is in place. `tsconfig.json` already has `@/*` aliases (do not re-add). No WatermelonDB / Zustand / Zod / Victory Native / Jest / AsyncStorage / datetimepicker / `app.config.ts` / `babel.config.js`.
- **After:**
  - All Phase 1 deps installed via `npx expo install` where it matters: `@nozbe/watermelondb`, `zustand`, `zod`, `victory-native`, `react-native-svg` (for MacroRing fallback), `@react-native-async-storage/async-storage`, `@react-native-community/datetimepicker`, `expo-build-properties`.
  - Dev deps: `jest`, `jest-expo`, `@testing-library/react-native`, `@types/jest`, `@babel/plugin-proposal-decorators`.
  - `app.config.ts` created with `extra.openFoodFactsBaseUrl = "https://world.openfoodfacts.org"` and bundle identifier placeholder `com.yourname.gymtracker`. SDK pinned (record exact version inline in this file: `expo: 54.0.33`).
  - `babel.config.js` created with `@babel/plugin-proposal-decorators` (legacy: true) — required for WatermelonDB model decorators — plus `react-native-reanimated/plugin` last in the list.
  - `jest.config.js` and `jest.setup.ts` created. Jest preset is `jest-expo`. `jest.setup.ts` mocks `react-native-reanimated`, `expo-constants` (returns the same `extra` shape as `app.config.ts`), and `@react-native-async-storage/async-storage`.
  - `package.json` scripts: `"test": "jest --no-watchman"`, `"test:ci": "jest --no-watchman --ci"`. Existing `typecheck`/`lint`/`format` scripts kept.
- **Files created:**
  - `app.config.ts`
  - `babel.config.js`
  - `jest.config.js`
  - `jest.setup.ts`
- **Files modified:**
  - `package.json` (deps + `test`/`test:ci` scripts)
- **Files deleted:** none in this task (template cleanup is Task 2).
- **DoD:** TS clean; `npm test` runs and reports "no tests" cleanly; `npx expo start --ios` boots the existing template app on simulator (a development build is not yet required since no native modules are imported in app code yet — that gate trips in Task 3).

---

## 2. Tab skeleton + template cleanup

- **Branch:** `phase1/tabs-skeleton`
- **Before:** `app/(tabs)/_layout.tsx` and `app/(tabs)/{index.tsx,explore.tsx}` are the Expo template. `app/modal.tsx` and template-only components (`hello-wave.tsx`, `parallax-scroll-view.tsx`, `external-link.tsx`) are unused by Phase 1.
- **After:**
  - `(tabs)/_layout.tsx` declares the four Phase 1 tabs from `CLAUDE.md`: `index` (Food Log), `journal`, `plans`, `progress`. Icons via `@expo/vector-icons` or `expo-symbols`.
  - `app/(tabs)/index.tsx` is a placeholder food-log screen ("Phase 1 — Food Log coming soon").
  - `app/(tabs)/journal.tsx`, `app/(tabs)/plans.tsx`, `app/(tabs)/progress.tsx` are placeholder screens that simply render a centered text label. They exist so the tab bar renders correctly; they will be filled in in later phases.
  - Deleted: `app/(tabs)/explore.tsx`, `app/modal.tsx`, `components/hello-wave.tsx`, `components/parallax-scroll-view.tsx`, `components/external-link.tsx`. Theme components (`themed-text.tsx`, `themed-view.tsx`, `haptic-tab.tsx`, `components/ui/`) are kept — Phase 1 screens may reuse them.
  - `app/_layout.tsx` is updated to drop the modal route entry.
- **Files created:**
  - `app/(tabs)/journal.tsx`
  - `app/(tabs)/plans.tsx`
  - `app/(tabs)/progress.tsx`
- **Files modified:**
  - `app/(tabs)/_layout.tsx`
  - `app/(tabs)/index.tsx`
  - `app/_layout.tsx`
- **Files deleted:** as listed above.
- **DoD:** TS clean; tab bar shows four tabs on simulator; tapping each tab renders without error; committed.

---

## 3. WatermelonDB schema, migrations, models, and database singleton

- **Branch:** `phase1/db-schema`
- **Before:** `db/` does not exist. WatermelonDB is installed (Task 1) but unused. After this task the app gains its first native module dependency, so a development build (not Expo Go) is required to run the app.
- **After:**
  - `db/schema.ts` defines all four Phase 1 tables (`food_entries`, `workout_sessions`, `workout_sets`, `body_weight_entries`) with the exact columns listed in `CLAUDE.md`. Schema `version: 1`.
  - `db/migrations.ts` exports `schemaMigrations({ migrations: [] })` — empty but in place from day one per `CLAUDE.md` policy.
  - `db/database.ts` exports a singleton `database` built from `SQLiteAdapter` with `schema`, `migrations`, model classes registered, `dbName: "gymtracker"`, and `jsi: true` on iOS.
  - Model classes in `db/models/` — `FoodEntry`, `WorkoutSession`, `WorkoutSet`, `BodyWeightEntry` — declare decorated fields (`@field`, `@date`, `@text`, `@nochange` where appropriate) and `@readonly @date('created_at') createdAt`.
  - Test setup: `__tests__/test-utils/makeTestDatabase.ts` builds a fresh in-memory adapter (`@nozbe/watermelondb/adapters/lokijs`) plus the same schema/migrations/models for use by all integration tests.
  - DB smoke test: `__tests__/integration/database.test.ts` creates one record per table via `database.write(...)` against the in-memory adapter and asserts they are queryable. (Pure shape assertions are not useful — exercising the adapter is.)
- **Files created:** `db/schema.ts`, `db/migrations.ts`, `db/database.ts`, `db/models/{FoodEntry,WorkoutSession,WorkoutSet,BodyWeightEntry}.ts`, `__tests__/test-utils/makeTestDatabase.ts`, `__tests__/integration/database.test.ts`.
- **DoD:** TS clean; smoke test passes; running `npx expo prebuild --platform ios` followed by `npx expo run:ios` (or `eas build --profile development --platform ios`) produces a dev build that boots; committed. Note in commit body: dev build required from here onward.

---

## 4. Settings store with AsyncStorage persistence

- **Branch:** `phase1/settings-store`
- **Before:** No `store/` folder. Zustand and AsyncStorage are installed.
- **After:** `store/settingsStore.ts` exports a Zustand store with the exact `SettingsState` shape from `CLAUDE.md` (`weightUnit`, `selectedDate`, `calorieGoal`, `proteinGoal`, `carbsGoal`, `fatGoal`) and actions (`setSelectedDate(dateISO: string)`, `setWeightUnit('kg' | 'lbs')`, `setCalorieGoal(n: number)`, `setMacroGoals({proteinG, carbsG, fatG})`, `resetToToday()`). Persisted via `zustand/middleware/persist` using `createJSONStorage(() => AsyncStorage)`. Defaults match `CLAUDE.md` (`kg`, today's date as `YYYY-MM-DD` from `utils/date.ts` once Task 5 lands — for now inline a small ISO helper here and refactor in Task 5, OR build the date helper first by reordering with Task 5; the plan keeps the current order and accepts a one-line internal ISO formatter that gets replaced in Task 5).
- **Files created:** `store/settingsStore.ts`, `__tests__/unit/settingsStore.test.ts`.
- **DoD:** TS clean; unit tests cover defaults + each action + persistence rehydrate (using the AsyncStorage mock from `jest.setup.ts`); committed.

---

## 5. Weight, macro, and date utilities (pure functions)

- **Branch:** `phase1/utils-weight-macros`
- **Before:** No `utils/` folder. Settings store has a temporary inline ISO helper that should be replaced.
- **After:**
  - `utils/formatWeight.ts` exports `formatWeight(kg, unit)` exactly as specified in `CLAUDE.md`.
  - `utils/macros.ts` exports `caloriesFromMacros({proteinG, carbsG, fatG})` (4/4/9 kcal/g), `scaleNutrient(perBaseValue, baseQty, actualQty)` for per-100g normalisation, `sumMacros(entries)` returning `{calories, proteinG, carbsG, fatG}`.
  - `utils/date.ts` exports `todayISO()` and `addDaysISO(dateISO, n)` and `parseISO(dateISO) → Date` and `toISO(d: Date) → string`. All inputs/outputs are `YYYY-MM-DD` strings — no `Date` objects cross the API boundary.
  - `store/settingsStore.ts` updated to import `todayISO` from `utils/date`.
- **Files created:** `utils/formatWeight.ts`, `utils/macros.ts`, `utils/date.ts`, `__tests__/unit/formatWeight.test.ts`, `__tests__/unit/macros.test.ts`, `__tests__/unit/date.test.ts`.
- **Files modified:** `store/settingsStore.ts`.
- **DoD:** TS clean; unit tests cover happy path + edges (zero macros, lbs conversion, date arithmetic across DST in May–November and the year boundary); committed.

---

## 6. Toast store, Toast component, and per-tab ErrorBoundary

- **Branch:** `phase1/toast-error-boundary`
- **Before:** No user-facing error UI. `Alert.alert` is banned per `CLAUDE.md`. `app/_layout.tsx` exists but mounts no global UI yet.
- **After:**
  - `store/toastStore.ts` is a small Zustand store (`message: string | null`, `kind: 'info' | 'error'`, `showToast(message, kind?)`, `dismissToast()`). Auto-dismiss after 3500ms via `setTimeout` inside the action.
  - `components/Toast.tsx` renders a banner at the bottom of the screen reading from `toastStore`. Uses `react-native-safe-area-context` so it sits above the home indicator. `accessibilityRole="alert"`.
  - `components/ErrorBoundary.tsx` is a class component with a fallback UI ("Something went wrong" + Retry button that resets state). Per `CLAUDE.md`, applied **per tab screen** — it wraps each child of `(tabs)/_layout.tsx`, not the root layout (the root only mounts the toast).
  - `app/_layout.tsx` mounts `<Toast />` as a sibling of `<Stack />`.
  - `app/(tabs)/_layout.tsx` wraps each tab's screen content in `<ErrorBoundary>` via a small `tabScreenOptions` helper or by composing inside the tab screen files directly — pick one approach and document it inline.
- **Files created:** `store/toastStore.ts`, `components/Toast.tsx`, `components/ErrorBoundary.tsx`, `__tests__/unit/toastStore.test.ts`, `__tests__/integration/Toast.test.tsx`, `__tests__/integration/ErrorBoundary.test.tsx`.
- **Files modified:** `app/_layout.tsx`, `app/(tabs)/_layout.tsx` (or the four tab screen files).
- **DoD:** TS clean; toast appears on simulator when `showToast()` is fired from a debug button (remove the debug button before commit); ErrorBoundary catches a thrown error in a tab and shows the fallback; tests pass; committed.

---

## 7. Open Food Facts client + Zod schema

- **Branch:** `phase1/off-client`
- **Before:** No external API code. `app.config.ts.extra.openFoodFactsBaseUrl` exists from Task 1. Barcode scanning is **out of scope for v1** per `CLAUDE.md`, so the client only exposes search.
- **After:**
  - `services/schemas/openFoodFacts.ts` declares Zod schemas for the OFF v2 search response. Pay attention to OFF's hyphenated nutriment field names: `nutriments['energy-kcal_100g']`, `nutriments['proteins_100g']`, `nutriments['carbohydrates_100g']`, `nutriments['fat_100g']`. Schema is permissive on missing fields and coerces numbers.
  - `services/openFoodFacts.ts` exports `searchFoods(query: string, signal?: AbortSignal): Promise<OffFood[]>`. Uses the URL from `expo-constants.expoConfig.extra.openFoodFactsBaseUrl`, hits `/cgi/search.pl?search_terms={q}&search_simple=1&action=process&json=1&page_size=20`, sends a `User-Agent: GymTracker/0.1 (contact: <user-email>)` header (required by OFF's terms of use), and returns a normalised array `{ id, name, brand?, imageUrl?, kcalPer100g, proteinPer100g, carbsPer100g, fatPer100g }`. Invalid responses return `[]` and log a warning. Network or abort errors throw a tagged `OffNetworkError` so the caller can show a toast.
- **Files created:** `services/openFoodFacts.ts`, `services/schemas/openFoodFacts.ts`, `__tests__/unit/openFoodFacts.test.ts`.
- **Test approach:** Mock `global.fetch` directly in the test file. Cover happy path, malformed payload (Zod fails → `[]`), HTTP 500 (throws `OffNetworkError`), and `AbortController.abort()` mid-request.
- **DoD:** TS clean; unit tests pass; no real network calls; committed.

---

## 8. Food data layer: Zustand actions + WatermelonDB observables

- **Branch:** `phase1/food-data-layer`
- **Before:** Schema and DB singleton exist (Task 3). No food data layer.
- **After:**
  - `store/foodStore.ts` is a Zustand store of **actions only** — no entry data is held in Zustand state. Actions: `addEntry(input)`, `deleteEntry(id)`, `updateEntry(id, patch)`, `relogEntry(sourceEntryId, targetDate, mealType)`. Each wraps `database.write(...)`. Errors are caught at the store layer, logged with context, and surfaced to the user via `toastStore.showToast(...)`.
  - Reads happen via WatermelonDB observables, not Zustand:
    - `db/queries/foodEntries.ts` exports `observeEntriesForDate(dateISO)` returning `Observable<FoodEntry[]>` from `database.collections.get('food_entries').query(Q.where('date', dateISO), Q.sortBy('created_at', Q.asc)).observe()`.
    - `observeRecentFoods(limit = 10)` returns the last `limit` *distinct* food names ordered by most-recent `created_at`. WatermelonDB has no DISTINCT operator, so this implementation queries the last ~50 entries and dedupes by `food_name` in JS, preserving recency. Acceptable v1 trade-off; revisit if recents lag.
  - `__tests__/integration/foodStore.test.ts` builds an in-memory database (Task 3 helper), exercises every action, and asserts observable output via `firstValueFrom(...)` from `rxjs`.
  - `__tests__/integration/foodQueries.test.ts` covers `observeEntriesForDate` (date filtering + ordering) and `observeRecentFoods` (dedup + recency).
- **Files created:** `store/foodStore.ts`, `db/queries/foodEntries.ts`, the two test files above.
- **DoD:** TS clean; integration tests pass against a real in-memory adapter (no mocks); committed.

---

## 9. MacroRing component

- **Branch:** `phase1/macro-ring`
- **Before:** Victory Native and `react-native-svg` installed (Task 1). No chart components.
- **After:** `components/MacroRing.tsx` renders three concentric rings (protein, carbs, fat) with the calorie total in the centre. Built with `react-native-svg` directly (Victory Native is overkill for a static ring; reserve it for Phase 4 charts). Reads goals via `useSettingsStore`, accepts `totals: {proteinG, carbsG, fatG, calories}` as props. `accessibilityLabel` summarises progress in one sentence (e.g. `"Calories 1450 of 2000. Protein 80 of 150 grams. Carbs 120 of 250 grams. Fat 40 of 65 grams."`).
- **Files created:** `components/MacroRing.tsx`, `__tests__/integration/MacroRing.test.tsx` (asserts the accessibility label is computed correctly for several goal/total combinations).
- **DoD:** TS clean; integration test passes; ring renders correctly on simulator with mocked totals; committed.

---

## 10. DateHeader component

- **Branch:** `phase1/date-header`
- **Before:** `selectedDate` lives in `settingsStore` as `YYYY-MM-DD` (Task 4). `@react-native-community/datetimepicker` installed.
- **After:** `components/DateHeader.tsx` shows the current `selectedDate` formatted as `Mon, May 3` (use `Intl.DateTimeFormat`), a left/right arrow stepping ±1 day via `addDaysISO(...)`, a tappable date label that opens the system date picker (iOS displays inline, Android shows modal — handle both), and a "Today" button visible only when `selectedDate !== todayISO()`. All taps have `accessibilityLabel` and a `minHeight: 44, minWidth: 44` style. The DateTimePicker callback receives a `Date`; convert via `toISO(...)` from `utils/date` before writing back to the store.
- **Files created:** `components/DateHeader.tsx`, `__tests__/integration/DateHeader.test.tsx`.
- **Test approach:** Mock the datetimepicker module to render a button that fires the change handler with a known `Date`. Assert the store update.
- **DoD:** TS clean; tests cover arrows, picker change, and Today button; committed.

---

## 11. FoodEntry row component

- **Branch:** `phase1/food-entry-row`
- **Before:** No row component for displayed entries.
- **After:** `components/FoodEntry.tsx` renders one logged food entry: name (truncates at 1 line), `quantity + unit` line, calories on the right, macro line ("P 24g · C 30g · F 12g") below. Trailing button or long-press triggers `onDelete(id)` (passed in via prop). Fixed height (e.g. 72) so the parent list can use `getItemLayout`. Accessibility label combines name + calories ("Chicken breast, 200 grams, 330 calories").
- **Files created:** `components/FoodEntry.tsx`, `__tests__/integration/FoodEntry.test.tsx`.
- **DoD:** TS clean; integration test covers render output and delete callback; committed.

---

## 12. Food log screen (`app/(tabs)/index.tsx`)

- **Branch:** `phase1/food-log-screen`
- **Before:** Tab placeholder from Task 2. `MacroRing`, `DateHeader`, `FoodEntry`, `foodStore`, `settingsStore`, and `observeEntriesForDate` all exist.
- **After:** Food log screen renders, in order: `<DateHeader />`, `<MacroRing totals={totalsForToday} />`, then a `<SectionList>` with four sections (Breakfast / Lunch / Dinner / Snacks). Use `SectionList` rather than four separate `FlatList`s — nesting `FlatList` inside a `ScrollView` breaks virtualization in RN, and `SectionList` is the supported pattern for this exact UX. Empty state per section reads "No items — + Log food". Each section header includes a "+ Log food" button that navigates to `/food/search?mealType={meal}`. Entries come from `observeEntriesForDate(selectedDate)` via `withObservables` HOC or `useDatabase` hook. Totals derived in-component via `sumMacros(entries)`. Wrapped per-tab with `<ErrorBoundary />` from Task 6.
- **Files created:** `app/(tabs)/index.tsx` (rewrite), `components/MealSectionHeader.tsx`, `__tests__/integration/FoodLogScreen.test.tsx`.
- **Test approach:** Use the in-memory database test util. Seed entries for two dates, render the screen with `selectedDate` set to one of them, assert only that date's entries appear and that totals match `sumMacros`. Add an entry via `foodStore.addEntry`, assert observable updates the UI.
- **DoD:** TS clean; integration test passes; screen renders correctly on simulator with seeded data and survives a date arrow tap; committed.

---

## 13. Manual food entry screen (`app/food/add.tsx`)

- **Branch:** `phase1/manual-food-add`
- **Before:** `app/food/` routes do not exist. The food log screen links to `/food/add` from Task 12 (or via the search screen in Task 14).
- **After:** Form with inputs for `name`, `calories`, `proteinG`, `carbsG`, `fatG`, `quantity`, `unit` (`g | ml | oz | serving` segmented control). Form state validated via Zod (`z.object({...}).refine(...)`) — `calories ≥ 0`, `quantity > 0`, macros `≥ 0`, name non-empty. On submit, `foodStore.addEntry({...input, source: 'manual', mealType, date: selectedDate})` runs. Success → `router.back()`; failure → toast surfaced from the store. The screen reads `mealType` from the route params (defaults to `snack` if missing).
- **Files created:** `app/food/add.tsx`, `__tests__/integration/AddFoodScreen.test.tsx`.
- **DoD:** TS clean; integration test covers happy path and at least two validation errors; simulator round-trip (open from food log → submit → entry visible) works; committed.

---

## 14. Food search screen (`app/food/search.tsx`)

- **Branch:** `phase1/food-search`
- **Before:** OFF client (Task 7), `observeRecentFoods` (Task 8), and the manual add screen (Task 13) exist.
- **After:** Search screen reads `mealType` from route params, shows a search input, and below it: a "Recent" section (top 10 from `observeRecentFoods`) shown when query is empty, replaced by a "Results" section while a search is active. Search runs debounced at 300ms via a small custom hook (`useDebouncedValue`); abort the in-flight request on every new keystroke via `AbortController`. Tapping any item routes to `app/food/confirm.tsx?source={off|recent}&payload=...` with quantity/unit inputs and a Save button that calls `foodStore.addEntry` (`source: 'open_food_facts'` for OFF picks, `source: 'manual'` for re-logged recents — the distinction matters for analytics later). A "Manual entry" button at the bottom routes to `app/food/add.tsx` carrying the same `mealType`. Both lists use `FlatList` with `keyExtractor`, `initialNumToRender={15}`, `maxToRenderPerBatch={10}`, and `getItemLayout` (rows are fixed height).
- **Files created:** `app/food/search.tsx`, `app/food/confirm.tsx`, `components/FoodSearchResultRow.tsx`, `hooks/useDebouncedValue.ts`, `__tests__/integration/FoodSearchScreen.test.tsx`, `__tests__/unit/useDebouncedValue.test.ts`.
- **Test approach:** Mock `services/openFoodFacts.searchFoods`. Seed recent entries via the in-memory DB. Type a query, advance fake timers past 300ms, assert results appear. Tap one, advance to confirm screen, save, assert food log includes it.
- **DoD:** TS clean; integration test passes; manual + API flows both end with the entry visible on the food log; committed.

---

## 15. One-tap re-log from history

- **Branch:** `phase1/quick-relog`
- **Before:** `foodStore.relogEntry` already exists from Task 8 but is unused. Recent foods are reachable only via the search screen.
- **After:** The food log screen's empty-state row in each meal section grows a "Recent" affordance — when a meal has no entries, tap-to-relog buttons show the last 3 distinct foods logged in that meal across any date. Tapping one calls `foodStore.relogEntry(sourceId, selectedDate, mealType)` which copies name + macros + quantity + unit and inserts a new row for `selectedDate` (per MFP UX: defaults to last-used quantity for that food). Toast confirms ("Logged Chicken breast").
- **Files modified:** `app/(tabs)/index.tsx`, `components/MealSectionHeader.tsx`, `db/queries/foodEntries.ts` (add `observeRecentByMeal(mealType, limit)`).
- **Files created:** `__tests__/integration/relog.test.tsx`.
- **DoD:** TS clean; integration test seeds prior entries, taps a recent button, asserts a new entry exists for `selectedDate`; simulator one-tap works; committed.

---

## 16. Maestro E2E: log a meal end-to-end

- **Branch:** `phase1/maestro-log-meal`
- **Before:** Food log + search + add flows all working from earlier tasks. No `e2e/` folder.
- **After:** `e2e/log-meal.yaml` covers: launch app → land on Food Log → tap "+ Log food" on Breakfast → tap "Manual entry" → fill the form → Save → assert "Chicken breast" appears under Breakfast with calories visible. `e2e/README.md` documents how to run Maestro locally on the simulator (`brew install maestro`, `maestro test e2e/log-meal.yaml`). The flow uses `accessibilityLabel`s for selectors — verify they were added in Tasks 9–13.
- **Files created:** `e2e/log-meal.yaml`, `e2e/README.md`.
- **DoD:** TS clean (no code change risk); Maestro flow runs green on simulator (executed manually outside the sandbox — Maestro does not run inside it); committed.

---

## Phase 1 exit criteria

Phase 1 is shippable when:

- All 16 tasks above are committed to feature branches and merged into `main`.
- A clean install on a fresh simulator can: navigate dates, search a food, log it, edit/delete entries, see totals on the macro ring, and have all data survive an app restart.
- `npm run typecheck` and `npm test` both pass from `main`.
- `e2e/log-meal.yaml` runs green on the iOS simulator.

Only then start Phase 2.
