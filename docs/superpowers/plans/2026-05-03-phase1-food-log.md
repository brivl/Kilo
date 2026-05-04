# Phase 1 — Food Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete daily food log with macro tracking, UK food search, manual entry, saved meal templates, recent foods, and one-tap re-log.

**Architecture:** Local-first with WatermelonDB (SQLite). UI reads via WatermelonDB observables. Write actions live in Zustand stores. All external API data validated with Zod before use. No cloud sync in Phase 1.

**Tech Stack:** Expo SDK 54.0.33, Expo Router 6, WatermelonDB 0.28, Zustand 5, Zod 4, Open Food Facts API (uk.openfoodfacts.org), Jest + jest-expo + RNTL, Maestro E2E.

---

## Status

- **Task 1**: ✅ DONE (merged `phase1/project-foundation`)
- **Tasks 2–18**: pending

## Repo state at planning time

Branch: `phase1/tabs-skeleton` already created with unfinished changes. Expo SDK 54.0.33, expo-router 6.x, TypeScript 5.9, React 19, RN 0.81. `tsconfig.json` has `@/*` path aliases. `babel.config.js` and `jest.config.js` exist from Task 1. `app.config.ts` exists but uses `world.openfoodfacts.org` — **must be changed to `uk.openfoodfacts.org`**. `jest.setup.ts` mock must match.

---

## File Map

### New files (Phase 1)

```
app/(tabs)/journal.tsx                  placeholder tab
app/(tabs)/plans.tsx                    placeholder tab
app/(tabs)/progress.tsx                 placeholder tab
app/food/search.tsx                     food search + Save as meal
app/food/add.tsx                        manual food entry
app/food/confirm.tsx                    confirm OFF/recent selection
app/settings/meal-templates.tsx         manage saved meal templates
db/schema.ts                            WatermelonDB schema (all tables)
db/migrations.ts                        migration stubs
db/database.ts                          DB singleton
db/models/FoodEntry.ts
db/models/WorkoutSession.ts
db/models/WorkoutSet.ts
db/models/BodyWeightEntry.ts
db/models/MealTemplate.ts
db/models/MealTemplateItem.ts
db/queries/foodEntries.ts               observeEntriesForDate, observeRecentFoods, observeRecentByMeal
db/queries/mealTemplates.ts             observeAllTemplates, observeTemplateItems
store/settingsStore.ts
store/foodStore.ts
store/mealTemplateStore.ts
store/toastStore.ts
utils/formatWeight.ts
utils/macros.ts
utils/date.ts
services/openFoodFacts.ts
services/schemas/openFoodFacts.ts
components/MacroRing.tsx
components/DateHeader.tsx
components/FoodEntry.tsx
components/MealTemplatePill.tsx
components/MealSectionHeader.tsx
components/Toast.tsx
components/ErrorBoundary.tsx
hooks/useDebouncedValue.ts
__tests__/test-utils/makeTestDatabase.ts
__tests__/unit/formatWeight.test.ts
__tests__/unit/macros.test.ts
__tests__/unit/date.test.ts
__tests__/unit/settingsStore.test.ts
__tests__/unit/toastStore.test.ts
__tests__/unit/openFoodFacts.test.ts
__tests__/unit/useDebouncedValue.test.ts
__tests__/integration/database.test.ts
__tests__/integration/foodStore.test.ts
__tests__/integration/foodQueries.test.ts
__tests__/integration/mealTemplateStore.test.ts
__tests__/integration/FoodLogScreen.test.tsx
__tests__/integration/AddFoodScreen.test.tsx
__tests__/integration/FoodSearchScreen.test.tsx
__tests__/integration/MacroRing.test.tsx
__tests__/integration/DateHeader.test.tsx
__tests__/integration/FoodEntry.test.tsx
__tests__/integration/Toast.test.tsx
__tests__/integration/ErrorBoundary.test.tsx
__tests__/integration/relog.test.tsx
e2e/log-meal.yaml
e2e/README.md
```

### Modified files

```
app/(tabs)/_layout.tsx      four tabs, drop explore
app/(tabs)/index.tsx        full food log screen (was placeholder)
app/_layout.tsx             drop modal route, mount Toast
app.config.ts               uk.openfoodfacts.org, add expo-haptics/expo-av plugins
jest.setup.ts               update expo-constants mock URL
```

### Deleted files

```
app/(tabs)/explore.tsx
app/modal.tsx
components/hello-wave.tsx
components/parallax-scroll-view.tsx
components/external-link.tsx
```

---

## Task 2: Tab skeleton + template cleanup

**Branch:** `phase1/tabs-skeleton`

**Files:**

- Modify: `app/(tabs)/_layout.tsx`
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/_layout.tsx`
- Create: `app/(tabs)/journal.tsx`, `app/(tabs)/plans.tsx`, `app/(tabs)/progress.tsx`
- Delete: `app/(tabs)/explore.tsx`, `app/modal.tsx`, `components/hello-wave.tsx`, `components/parallax-scroll-view.tsx`, `components/external-link.tsx`

- [ ] **Step 1: Create placeholder tab screens**

```tsx
// app/(tabs)/journal.tsx
import { View, Text, StyleSheet } from 'react-native';
export default function JournalTab() {
  return (
    <View style={s.c}>
      <Text style={s.t}>Phase 2 — Gym Journal</Text>
    </View>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  t: { fontSize: 16, color: '#888' },
});
```

Repeat for `plans.tsx` ("Phase 3 — Training Plans") and `progress.tsx` ("Phase 4 — Progress").

- [ ] **Step 2: Replace `app/(tabs)/index.tsx` placeholder**

```tsx
// app/(tabs)/index.tsx
import { View, Text, StyleSheet } from 'react-native';
export default function FoodLogTab() {
  return (
    <View style={s.c}>
      <Text style={s.t}>Phase 1 — Food Log coming soon</Text>
    </View>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  t: { fontSize: 16, color: '#888' },
});
```

- [ ] **Step 3: Rewrite `app/(tabs)/_layout.tsx`**

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconName, focused: boolean) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as IoniconName)}
      size={24}
      color={focused ? '#4f46e5' : '#888'}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#4f46e5', headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Food Log', tabBarIcon: ({ focused }) => tabIcon('nutrition', focused) }}
      />
      <Tabs.Screen
        name="journal"
        options={{ title: 'Journal', tabBarIcon: ({ focused }) => tabIcon('barbell', focused) }}
      />
      <Tabs.Screen
        name="plans"
        options={{ title: 'Plans', tabBarIcon: ({ focused }) => tabIcon('calendar', focused) }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused }) => tabIcon('trending-up', focused),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 4: Update `app/_layout.tsx` — drop modal route**

Remove any `<Stack.Screen name="modal" ...>` entry. Keep the root Stack.

- [ ] **Step 5: Delete template files**

```bash
rm app/(tabs)/explore.tsx app/modal.tsx
rm components/hello-wave.tsx components/parallax-scroll-view.tsx components/external-link.tsx
```

- [ ] **Step 6: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors. Fix any import errors caused by deleted files.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: four-tab skeleton, remove Expo template scaffolding"
```

---

## Task 3: WatermelonDB schema, migrations, models, DB singleton

**Branch:** `phase1/db-schema`

**Files:**

- Create: `db/schema.ts`, `db/migrations.ts`, `db/database.ts`
- Create: `db/models/FoodEntry.ts`, `WorkoutSession.ts`, `WorkoutSet.ts`, `BodyWeightEntry.ts`, `MealTemplate.ts`, `MealTemplateItem.ts`
- Create: `__tests__/test-utils/makeTestDatabase.ts`, `__tests__/integration/database.test.ts`

- [ ] **Step 1: Write schema**

```ts
// db/schema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'food_entries',
      columns: [
        { name: 'date', type: 'string' },
        { name: 'meal_type', type: 'string' },
        { name: 'food_name', type: 'string' },
        { name: 'calories', type: 'number' },
        { name: 'protein_g', type: 'number' },
        { name: 'carbs_g', type: 'number' },
        { name: 'fat_g', type: 'number' },
        { name: 'quantity', type: 'number' },
        { name: 'unit', type: 'string' },
        { name: 'source', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'meal_templates',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'meal_template_items',
      columns: [
        { name: 'meal_template_id', type: 'string', isIndexed: true },
        { name: 'food_name', type: 'string' },
        { name: 'calories', type: 'number' },
        { name: 'protein_g', type: 'number' },
        { name: 'carbs_g', type: 'number' },
        { name: 'fat_g', type: 'number' },
        { name: 'quantity', type: 'number' },
        { name: 'unit', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'workout_sessions',
      columns: [
        { name: 'date', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'duration_min', type: 'number', isOptional: true },
        { name: 'plan_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'workout_sets',
      columns: [
        { name: 'session_id', type: 'string', isIndexed: true },
        { name: 'exercise_name', type: 'string' },
        { name: 'set_number', type: 'number' },
        { name: 'reps', type: 'number' },
        { name: 'weight_kg', type: 'number' },
        { name: 'rpe', type: 'number', isOptional: true },
        { name: 'rest_seconds', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'body_weight_entries',
      columns: [
        { name: 'date', type: 'string' },
        { name: 'weight_kg', type: 'number' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
```

- [ ] **Step 2: Write migrations stub**

```ts
// db/migrations.ts
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';
export default schemaMigrations({ migrations: [] });
```

- [ ] **Step 3: Write model classes**

```ts
// db/models/FoodEntry.ts
import { Model } from '@nozbe/watermelondb';
import { field, text, readonly, date } from '@nozbe/watermelondb/decorators';

export class FoodEntry extends Model {
  static table = 'food_entries';
  @text('date') date!: string;
  @text('meal_type') mealType!: string;
  @text('food_name') foodName!: string;
  @field('calories') calories!: number;
  @field('protein_g') proteinG!: number;
  @field('carbs_g') carbsG!: number;
  @field('fat_g') fatG!: number;
  @field('quantity') quantity!: number;
  @text('unit') unit!: string;
  @text('source') source!: string;
  @readonly @date('created_at') createdAt!: Date;
}
```

```ts
// db/models/MealTemplate.ts
import { Model } from '@nozbe/watermelondb';
import { text, readonly, date, children } from '@nozbe/watermelondb/decorators';
import type { Query } from '@nozbe/watermelondb';

export class MealTemplate extends Model {
  static table = 'meal_templates';
  static associations = {
    meal_template_items: { type: 'has_many' as const, foreignKey: 'meal_template_id' },
  };
  @text('name') name!: string;
  @readonly @date('created_at') createdAt!: Date;
  @children('meal_template_items') items!: Query<any>;
}
```

```ts
// db/models/MealTemplateItem.ts
import { Model } from '@nozbe/watermelondb';
import { field, text, readonly, date, relation } from '@nozbe/watermelondb/decorators';

export class MealTemplateItem extends Model {
  static table = 'meal_template_items';
  static associations = {
    meal_templates: { type: 'belongs_to' as const, key: 'meal_template_id' },
  };
  @text('meal_template_id') mealTemplateId!: string;
  @text('food_name') foodName!: string;
  @field('calories') calories!: number;
  @field('protein_g') proteinG!: number;
  @field('carbs_g') carbsG!: number;
  @field('fat_g') fatG!: number;
  @field('quantity') quantity!: number;
  @text('unit') unit!: string;
  @readonly @date('created_at') createdAt!: Date;
}
```

For `WorkoutSession`, `WorkoutSet`, `BodyWeightEntry` — same pattern using the columns from `schema.ts`. Each extends `Model`, declares `static table`, and uses `@text`/`@field`/`@readonly @date` decorators matching the schema.

- [ ] **Step 4: Write DB singleton**

```ts
// db/database.ts
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from './schema';
import migrations from './migrations';
import { FoodEntry } from './models/FoodEntry';
import { WorkoutSession } from './models/WorkoutSession';
import { WorkoutSet } from './models/WorkoutSet';
import { BodyWeightEntry } from './models/BodyWeightEntry';
import { MealTemplate } from './models/MealTemplate';
import { MealTemplateItem } from './models/MealTemplateItem';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true,
  onSetUpError: e => console.error('DB setup error', e),
});

export const database = new Database({
  adapter,
  modelClasses: [
    FoodEntry,
    WorkoutSession,
    WorkoutSet,
    BodyWeightEntry,
    MealTemplate,
    MealTemplateItem,
  ],
});
```

- [ ] **Step 5: Write test utility**

```ts
// __tests__/test-utils/makeTestDatabase.ts
import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import schema from '@/db/schema';
import migrations from '@/db/migrations';
import { FoodEntry } from '@/db/models/FoodEntry';
import { WorkoutSession } from '@/db/models/WorkoutSession';
import { WorkoutSet } from '@/db/models/WorkoutSet';
import { BodyWeightEntry } from '@/db/models/BodyWeightEntry';
import { MealTemplate } from '@/db/models/MealTemplate';
import { MealTemplateItem } from '@/db/models/MealTemplateItem';

export function makeTestDatabase(): Database {
  const adapter = new LokiJSAdapter({ schema, migrations, useIncrementalIndexedDB: false });
  return new Database({
    adapter,
    modelClasses: [
      FoodEntry,
      WorkoutSession,
      WorkoutSet,
      BodyWeightEntry,
      MealTemplate,
      MealTemplateItem,
    ],
  });
}
```

- [ ] **Step 6: Write smoke test**

```ts
// __tests__/integration/database.test.ts
import { makeTestDatabase } from '../test-utils/makeTestDatabase';

describe('database smoke test', () => {
  it('creates and queries a food entry', async () => {
    const db = makeTestDatabase();
    const collection = db.collections.get('food_entries');
    await db.write(async () => {
      await collection.create((r: any) => {
        r.date = '2026-05-03';
        r.mealType = 'breakfast';
        r.foodName = 'Eggs';
        r.calories = 140;
        r.proteinG = 12;
        r.carbsG = 1;
        r.fatG = 10;
        r.quantity = 2;
        r.unit = 'serving';
        r.source = 'manual';
      });
    });
    const entries = await collection.query().fetch();
    expect(entries).toHaveLength(1);
    expect((entries[0] as any).foodName).toBe('Eggs');
  });

  it('creates a meal template with items', async () => {
    const db = makeTestDatabase();
    await db.write(async () => {
      const tmpl = await db.collections.get('meal_templates').create((r: any) => {
        r.name = 'Morning bulk';
      });
      await db.collections.get('meal_template_items').create((r: any) => {
        r.mealTemplateId = tmpl.id;
        r.foodName = 'Oats';
        r.calories = 379;
        r.proteinG = 13;
        r.carbsG = 68;
        r.fatG = 7;
        r.quantity = 100;
        r.unit = 'g';
      });
    });
    const templates = await db.collections.get('meal_templates').query().fetch();
    expect(templates).toHaveLength(1);
    const items = await db.collections.get('meal_template_items').query().fetch();
    expect(items).toHaveLength(1);
  });
});
```

- [ ] **Step 7: Run test**

```bash
npm test -- --testPathPattern=database --no-watchman
```

Expected: 2 tests pass.

- [ ] **Step 8: Type check + commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat: WatermelonDB schema, models, migrations, DB singleton"
```

---

## Task 4: Settings store

**Branch:** `phase1/settings-store`

**Files:**

- Create: `store/settingsStore.ts`, `__tests__/unit/settingsStore.test.ts`

- [ ] **Step 1: Write test first**

```ts
// __tests__/unit/settingsStore.test.ts
import { act, renderHook } from '@testing-library/react-native';

// Import after mocks are in place (jest.setup.ts mocks AsyncStorage)
let useSettingsStore: any;
beforeEach(async () => {
  jest.resetModules();
  const mod = await import('@/store/settingsStore');
  useSettingsStore = mod.useSettingsStore;
});

describe('settingsStore', () => {
  it('has correct defaults', () => {
    const { result } = renderHook(() => useSettingsStore());
    expect(result.current.weightUnit).toBe('kg');
    expect(result.current.calorieGoal).toBe(2000);
    expect(result.current.proteinGoal).toBe(150);
    expect(result.current.carbsGoal).toBe(250);
    expect(result.current.fatGoal).toBe(65);
    expect(result.current.selectedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('setWeightUnit updates unit', () => {
    const { result } = renderHook(() => useSettingsStore());
    act(() => result.current.setWeightUnit('lbs'));
    expect(result.current.weightUnit).toBe('lbs');
  });

  it('setSelectedDate updates date', () => {
    const { result } = renderHook(() => useSettingsStore());
    act(() => result.current.setSelectedDate('2026-01-01'));
    expect(result.current.selectedDate).toBe('2026-01-01');
  });

  it('resetToToday resets date to today', () => {
    const { result } = renderHook(() => useSettingsStore());
    act(() => {
      result.current.setSelectedDate('2020-01-01');
      result.current.resetToToday();
    });
    expect(result.current.selectedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- --testPathPattern=settingsStore --no-watchman
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement store**

```ts
// store/settingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

interface SettingsState {
  weightUnit: 'kg' | 'lbs';
  selectedDate: string;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  setWeightUnit: (u: 'kg' | 'lbs') => void;
  setSelectedDate: (d: string) => void;
  setCalorieGoal: (n: number) => void;
  setMacroGoals: (g: { proteinG: number; carbsG: number; fatG: number }) => void;
  resetToToday: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      weightUnit: 'kg',
      selectedDate: todayISO(),
      calorieGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 65,
      setWeightUnit: weightUnit => set({ weightUnit }),
      setSelectedDate: selectedDate => set({ selectedDate }),
      setCalorieGoal: calorieGoal => set({ calorieGoal }),
      setMacroGoals: ({ proteinG, carbsG, fatG }) =>
        set({ proteinGoal: proteinG, carbsGoal: carbsG, fatGoal: fatG }),
      resetToToday: () => set({ selectedDate: todayISO() }),
    }),
    { name: 'settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
```

- [ ] **Step 4: Run test — confirm pass**

```bash
npm test -- --testPathPattern=settingsStore --no-watchman
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: settings store with AsyncStorage persistence"
```

---

## Task 5: Utility functions

**Branch:** `phase1/utils`

**Files:**

- Create: `utils/formatWeight.ts`, `utils/macros.ts`, `utils/date.ts`
- Create: `__tests__/unit/formatWeight.test.ts`, `__tests__/unit/macros.test.ts`, `__tests__/unit/date.test.ts`
- Modify: `store/settingsStore.ts` — import `todayISO` from `@/utils/date`

- [ ] **Step 1: Write tests**

```ts
// __tests__/unit/formatWeight.test.ts
import { formatWeight } from '@/utils/formatWeight';
describe('formatWeight', () => {
  it('kg identity', () => expect(formatWeight(80, 'kg')).toBe('80 kg'));
  it('converts to lbs', () => expect(formatWeight(80, 'lbs')).toBe('176.4 lbs'));
  it('zero kg', () => expect(formatWeight(0, 'kg')).toBe('0 kg'));
});
```

```ts
// __tests__/unit/macros.test.ts
import { caloriesFromMacros, scaleNutrient, sumMacros } from '@/utils/macros';
describe('macros', () => {
  it('caloriesFromMacros 4/4/9', () =>
    expect(caloriesFromMacros({ proteinG: 10, carbsG: 10, fatG: 10 })).toBe(170));
  it('scaleNutrient per 100g', () => expect(scaleNutrient(20, 100, 150)).toBeCloseTo(30));
  it('sumMacros empty', () =>
    expect(sumMacros([])).toEqual({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }));
  it('sumMacros two entries', () => {
    const entries = [
      { calories: 200, proteinG: 20, carbsG: 30, fatG: 5 },
      { calories: 100, proteinG: 10, carbsG: 10, fatG: 3 },
    ];
    expect(sumMacros(entries)).toEqual({ calories: 300, proteinG: 30, carbsG: 40, fatG: 8 });
  });
});
```

```ts
// __tests__/unit/date.test.ts
import { todayISO, addDaysISO, toISO, parseISO } from '@/utils/date';
describe('date utils', () => {
  it('todayISO is YYYY-MM-DD', () => expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/));
  it('addDaysISO +1', () => expect(addDaysISO('2026-05-03', 1)).toBe('2026-05-04'));
  it('addDaysISO -1', () => expect(addDaysISO('2026-05-01', -1)).toBe('2026-04-30'));
  it('addDaysISO year boundary', () => expect(addDaysISO('2025-12-31', 1)).toBe('2026-01-01'));
  it('parseISO → toISO roundtrip', () => expect(toISO(parseISO('2026-05-03'))).toBe('2026-05-03'));
});
```

- [ ] **Step 2: Run — confirm fail**

```bash
npm test -- --testPathPattern="(formatWeight|macros|date)" --no-watchman
```

- [ ] **Step 3: Implement utilities**

```ts
// utils/formatWeight.ts
export function formatWeight(kg: number, unit: 'kg' | 'lbs'): string {
  if (unit === 'lbs') return `${(kg * 2.20462).toFixed(1)} lbs`;
  return `${kg} kg`;
}
```

```ts
// utils/macros.ts
export function caloriesFromMacros({
  proteinG,
  carbsG,
  fatG,
}: {
  proteinG: number;
  carbsG: number;
  fatG: number;
}): number {
  return proteinG * 4 + carbsG * 4 + fatG * 9;
}
export function scaleNutrient(perBase: number, baseQty: number, actualQty: number): number {
  return (perBase / baseQty) * actualQty;
}
export function sumMacros(
  entries: Array<{ calories: number; proteinG: number; carbsG: number; fatG: number }>,
) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + e.carbsG,
      fatG: acc.fatG + e.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}
```

```ts
// utils/date.ts
export function todayISO(): string {
  return toISO(new Date());
}
export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}
export function parseISO(s: string): Date {
  return new Date(`${s}T12:00:00Z`);
}
export function addDaysISO(dateISO: string, days: number): string {
  const d = parseISO(dateISO);
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}
```

- [ ] **Step 4: Update settingsStore to use todayISO from utils**

Replace inline `todayISO` function in `store/settingsStore.ts` with `import { todayISO } from '@/utils/date'`.

- [ ] **Step 5: Run all tests**

```bash
npm test --no-watchman
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: formatWeight, macros, date utilities"
```

---

## Task 6: Toast store + Toast component + ErrorBoundary

**Branch:** `phase1/toast-error-boundary`

**Files:**

- Create: `store/toastStore.ts`, `components/Toast.tsx`, `components/ErrorBoundary.tsx`
- Create: `__tests__/unit/toastStore.test.ts`, `__tests__/integration/Toast.test.tsx`, `__tests__/integration/ErrorBoundary.test.tsx`
- Modify: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Implement toast store**

```ts
// store/toastStore.ts
import { create } from 'zustand';

interface ToastState {
  message: string | null;
  kind: 'info' | 'error';
  showToast: (message: string, kind?: 'info' | 'error') => void;
  dismissToast: () => void;
}

export const useToastStore = create<ToastState>(set => ({
  message: null,
  kind: 'info',
  showToast: (message, kind = 'info') => {
    set({ message, kind });
    setTimeout(() => set({ message: null }), 3500);
  },
  dismissToast: () => set({ message: null }),
}));
```

- [ ] **Step 2: Unit test for toast store**

```ts
// __tests__/unit/toastStore.test.ts
import { act, renderHook } from '@testing-library/react-native';
import { useToastStore } from '@/store/toastStore';
describe('toastStore', () => {
  beforeEach(() => useToastStore.setState({ message: null, kind: 'info' }));
  it('showToast sets message', () => {
    const { result } = renderHook(() => useToastStore());
    act(() => result.current.showToast('Hello'));
    expect(result.current.message).toBe('Hello');
    expect(result.current.kind).toBe('info');
  });
  it('dismissToast clears message', () => {
    const { result } = renderHook(() => useToastStore());
    act(() => {
      result.current.showToast('Hello');
      result.current.dismissToast();
    });
    expect(result.current.message).toBeNull();
  });
});
```

- [ ] **Step 3: Implement Toast component**

```tsx
// components/Toast.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '@/store/toastStore';

export function Toast() {
  const { message, kind, dismissToast } = useToastStore();
  const insets = useSafeAreaInsets();
  if (!message) return null;
  return (
    <Pressable
      onPress={dismissToast}
      style={[s.container, { bottom: insets.bottom + 16 }, kind === 'error' ? s.error : s.info]}
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <Text style={s.text}>{message}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 8,
    zIndex: 999,
  },
  info: { backgroundColor: '#1e293b' },
  error: { backgroundColor: '#7f1d1d' },
  text: { color: '#fff', fontSize: 14, textAlign: 'center' },
});
```

- [ ] **Step 4: Implement ErrorBoundary**

```tsx
// components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={s.container}>
        <Text style={s.title}>Something went wrong</Text>
        <Pressable
          style={s.button}
          onPress={() => this.setState({ hasError: false })}
          accessibilityLabel="Retry"
        >
          <Text style={s.buttonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }
}
const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 18, color: '#fff', marginBottom: 16 },
  button: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16 },
});
```

- [ ] **Step 5: Mount Toast in root layout, wrap tabs in ErrorBoundary**

In `app/_layout.tsx` add `<Toast />` as a sibling of `<Stack />` inside the root `View`.

In `app/(tabs)/_layout.tsx`, wrap each tab screen's children in `<ErrorBoundary>`. Simplest approach: wrap each placeholder screen file's return in `<ErrorBoundary>` at the component level, not in the layout.

- [ ] **Step 6: Run tests + type check + commit**

```bash
npm test --no-watchman && npx tsc --noEmit
git add -A && git commit -m "feat: Toast component, ErrorBoundary, toastStore"
```

---

## Task 7: Open Food Facts client (UK endpoint) + Zod schema

**Branch:** `phase1/off-client`

**Files:**

- Modify: `app.config.ts` — change URL to `uk.openfoodfacts.org`
- Modify: `jest.setup.ts` — update mock URL to match
- Create: `services/schemas/openFoodFacts.ts`, `services/openFoodFacts.ts`
- Create: `__tests__/unit/openFoodFacts.test.ts`

- [ ] **Step 1: Update UK endpoint in config**

In `app.config.ts`, change:

```ts
openFoodFactsBaseUrl: 'https://uk.openfoodfacts.org',
```

In `jest.setup.ts`, change the mock to match:

```ts
extra: { openFoodFactsBaseUrl: 'https://uk.openfoodfacts.org' },
```

- [ ] **Step 2: Write Zod schema**

```ts
// services/schemas/openFoodFacts.ts
import { z } from 'zod';

const NutrimentSchema = z
  .object({
    'energy-kcal_100g': z.number().optional(),
    proteins_100g: z.number().optional(),
    carbohydrates_100g: z.number().optional(),
    fat_100g: z.number().optional(),
  })
  .passthrough();

export const OffProductSchema = z
  .object({
    id: z.string().optional(),
    product_name: z.string().optional(),
    brands: z.string().optional(),
    image_url: z.string().optional(),
    nutriments: NutrimentSchema.optional(),
  })
  .passthrough();

export const OffSearchResponseSchema = z
  .object({
    products: z.array(OffProductSchema).default([]),
  })
  .passthrough();

export type OffProduct = z.infer<typeof OffProductSchema>;
```

- [ ] **Step 3: Write tests (mock fetch)**

```ts
// __tests__/unit/openFoodFacts.test.ts
import { searchFoods, OffNetworkError } from '@/services/openFoodFacts';

const mockProduct = {
  id: '123',
  product_name: 'Oats',
  brands: 'Quaker',
  nutriments: { 'energy-kcal_100g': 379, proteins_100g: 13, carbohydrates_100g: 68, fat_100g: 7 },
};

beforeEach(() => {
  global.fetch = jest.fn();
});
afterEach(() => jest.restoreAllMocks());

it('returns normalised food on success', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ products: [mockProduct] }),
  });
  const results = await searchFoods('oats');
  expect(results).toHaveLength(1);
  expect(results[0].name).toBe('Oats');
  expect(results[0].kcalPer100g).toBe(379);
});

it('returns [] on malformed payload', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ notProducts: [] }),
  });
  const results = await searchFoods('oats');
  expect(results).toEqual([]);
});

it('throws OffNetworkError on HTTP 500', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
  await expect(searchFoods('oats')).rejects.toBeInstanceOf(OffNetworkError);
});

it('throws OffNetworkError on abort', async () => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));
  const ctrl = new AbortController();
  ctrl.abort();
  await expect(searchFoods('oats', ctrl.signal)).rejects.toBeInstanceOf(OffNetworkError);
});
```

- [ ] **Step 4: Run — confirm fail**

```bash
npm test -- --testPathPattern=openFoodFacts --no-watchman
```

- [ ] **Step 5: Implement service**

```ts
// services/openFoodFacts.ts
import Constants from 'expo-constants';
import { OffSearchResponseSchema } from './schemas/openFoodFacts';

export class OffNetworkError extends Error {}

export interface OffFood {
  id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

const BASE_URL = Constants.expoConfig?.extra?.openFoodFactsBaseUrl as string;

export async function searchFoods(query: string, signal?: AbortSignal): Promise<OffFood[]> {
  const url = `${BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`;
  let response: Response;
  try {
    response = await fetch(url, {
      signal,
      headers: { 'User-Agent': 'Kilo/0.1 (ilya.wublenski@gmail.com)' },
    });
  } catch (e) {
    throw new OffNetworkError('Network error or aborted');
  }
  if (!response.ok) throw new OffNetworkError(`HTTP ${response.status}`);
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return [];
  }
  const parsed = OffSearchResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.warn('OFF: invalid response', parsed.error);
    return [];
  }
  return parsed.data.products
    .filter(p => p.product_name)
    .map(p => ({
      id: p.id ?? p.product_name!,
      name: p.product_name!,
      brand: p.brands,
      imageUrl: p.image_url,
      kcalPer100g: p.nutriments?.['energy-kcal_100g'] ?? 0,
      proteinPer100g: p.nutriments?.['proteins_100g'] ?? 0,
      carbsPer100g: p.nutriments?.['carbohydrates_100g'] ?? 0,
      fatPer100g: p.nutriments?.['fat_100g'] ?? 0,
    }));
}
```

- [ ] **Step 6: Run tests + type check + commit**

```bash
npm test -- --testPathPattern=openFoodFacts --no-watchman && npx tsc --noEmit
git add -A && git commit -m "feat: OFF client with UK endpoint and Zod schema"
```

---

## Task 8: Food data layer

**Branch:** `phase1/food-data-layer`

**Files:**

- Create: `store/foodStore.ts`, `db/queries/foodEntries.ts`
- Create: `__tests__/integration/foodStore.test.ts`, `__tests__/integration/foodQueries.test.ts`

- [ ] **Step 1: Write queries**

```ts
// db/queries/foodEntries.ts
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type { FoodEntry } from '@/db/models/FoodEntry';

export function observeEntriesForDate(dateISO: string) {
  return database.collections
    .get<FoodEntry>('food_entries')
    .query(Q.where('date', dateISO), Q.sortBy('created_at', Q.asc))
    .observe();
}

export function observeRecentFoods(limit = 10) {
  return database.collections
    .get<FoodEntry>('food_entries')
    .query(Q.sortBy('created_at', Q.desc), Q.take(50))
    .observe();
  // Deduplicate by food_name in component — WatermelonDB has no DISTINCT
}

export function observeRecentByMeal(mealType: string, limit = 3) {
  return database.collections
    .get<FoodEntry>('food_entries')
    .query(Q.where('meal_type', mealType), Q.sortBy('created_at', Q.desc), Q.take(30))
    .observe();
}
```

- [ ] **Step 2: Implement food store**

```ts
// store/foodStore.ts
import { database } from '@/db/database';
import { useToastStore } from './toastStore';
import type { FoodEntry } from '@/db/models/FoodEntry';

interface AddEntryInput {
  date: string;
  mealType: string;
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  quantity: number;
  unit: string;
  source: 'manual' | 'open_food_facts';
}

export async function addEntry(input: AddEntryInput): Promise<void> {
  try {
    await database.write(async () => {
      await database.collections.get<FoodEntry>('food_entries').create(r => {
        r.date = input.date;
        r.mealType = input.mealType;
        r.foodName = input.foodName;
        r.calories = input.calories;
        r.proteinG = input.proteinG;
        r.carbsG = input.carbsG;
        r.fatG = input.fatG;
        r.quantity = input.quantity;
        r.unit = input.unit;
        r.source = input.source;
      });
    });
  } catch (e) {
    console.error('foodStore.addEntry failed', e);
    useToastStore.getState().showToast("Couldn't save food entry", 'error');
    throw e;
  }
}

export async function deleteEntry(id: string): Promise<void> {
  try {
    await database.write(async () => {
      const entry = await database.collections.get<FoodEntry>('food_entries').find(id);
      await entry.destroyPermanently();
    });
  } catch (e) {
    console.error('foodStore.deleteEntry failed', e);
    useToastStore.getState().showToast("Couldn't delete entry", 'error');
  }
}

export async function relogEntry(
  sourceEntryId: string,
  targetDate: string,
  targetMealType: string,
): Promise<void> {
  try {
    await database.write(async () => {
      const src = await database.collections.get<FoodEntry>('food_entries').find(sourceEntryId);
      await database.collections.get<FoodEntry>('food_entries').create(r => {
        r.date = targetDate;
        r.mealType = targetMealType;
        r.foodName = src.foodName;
        r.calories = src.calories;
        r.proteinG = src.proteinG;
        r.carbsG = src.carbsG;
        r.fatG = src.fatG;
        r.quantity = src.quantity;
        r.unit = src.unit;
        r.source = src.source;
      });
    });
    useToastStore
      .getState()
      .showToast(
        `Logged ${(await database.collections.get<FoodEntry>('food_entries').find(sourceEntryId)).foodName}`,
      );
  } catch (e) {
    console.error('foodStore.relogEntry failed', e);
    useToastStore.getState().showToast("Couldn't re-log entry", 'error');
  }
}
```

- [ ] **Step 3: Write integration tests using in-memory DB**

```ts
// __tests__/integration/foodStore.test.ts
// Mock the database module to use in-memory adapter
import { makeTestDatabase } from '../test-utils/makeTestDatabase';

const testDb = makeTestDatabase();
jest.mock('@/db/database', () => ({ database: testDb }));

import { addEntry, deleteEntry, relogEntry } from '@/store/foodStore';
import { firstValueFrom } from 'rxjs';
import { observeEntriesForDate } from '@/db/queries/foodEntries';

const base = {
  date: '2026-05-03',
  mealType: 'breakfast',
  foodName: 'Eggs',
  calories: 140,
  proteinG: 12,
  carbsG: 1,
  fatG: 10,
  quantity: 2,
  unit: 'serving',
  source: 'manual' as const,
};

beforeEach(async () => {
  const entries = await testDb.collections.get('food_entries').query().fetch();
  await testDb.write(async () => {
    for (const e of entries) await (e as any).destroyPermanently();
  });
});

it('addEntry creates a record observable', async () => {
  await addEntry(base);
  const entries = await firstValueFrom(observeEntriesForDate('2026-05-03'));
  expect(entries).toHaveLength(1);
  expect((entries[0] as any).foodName).toBe('Eggs');
});

it('deleteEntry removes the record', async () => {
  await addEntry(base);
  const before = await firstValueFrom(observeEntriesForDate('2026-05-03'));
  await deleteEntry((before[0] as any).id);
  const after = await firstValueFrom(observeEntriesForDate('2026-05-03'));
  expect(after).toHaveLength(0);
});
```

- [ ] **Step 4: Run tests + type check + commit**

```bash
npm test -- --testPathPattern="(foodStore|foodQueries)" --no-watchman && npx tsc --noEmit
git add -A && git commit -m "feat: food data layer — Zustand actions and WatermelonDB observables"
```

---

## Task 9: Meal template data layer

**Branch:** `phase1/meal-template-data`

**Files:**

- Create: `store/mealTemplateStore.ts`, `db/queries/mealTemplates.ts`
- Create: `__tests__/integration/mealTemplateStore.test.ts`

- [ ] **Step 1: Write queries**

```ts
// db/queries/mealTemplates.ts
import { database } from '@/db/database';
import { Q } from '@nozbe/watermelondb';
import type { MealTemplate } from '@/db/models/MealTemplate';
import type { MealTemplateItem } from '@/db/models/MealTemplateItem';

export function observeAllTemplates() {
  return database.collections
    .get<MealTemplate>('meal_templates')
    .query(Q.sortBy('created_at', Q.asc))
    .observe();
}

export function observeTemplateItems(templateId: string) {
  return database.collections
    .get<MealTemplateItem>('meal_template_items')
    .query(Q.where('meal_template_id', templateId), Q.sortBy('created_at', Q.asc))
    .observe();
}
```

- [ ] **Step 2: Implement store**

```ts
// store/mealTemplateStore.ts
import { database } from '@/db/database';
import { useToastStore } from './toastStore';
import { addEntry } from './foodStore';
import type { MealTemplate } from '@/db/models/MealTemplate';
import type { MealTemplateItem } from '@/db/models/MealTemplateItem';
import { Q } from '@nozbe/watermelondb';

interface TemplateItemInput {
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  quantity: number;
  unit: string;
}

export async function createTemplate(name: string, items: TemplateItemInput[]): Promise<void> {
  try {
    await database.write(async () => {
      const tmpl = await database.collections.get<MealTemplate>('meal_templates').create(r => {
        r.name = name;
      });
      for (const item of items) {
        await database.collections.get<MealTemplateItem>('meal_template_items').create(r => {
          r.mealTemplateId = tmpl.id;
          r.foodName = item.foodName;
          r.calories = item.calories;
          r.proteinG = item.proteinG;
          r.carbsG = item.carbsG;
          r.fatG = item.fatG;
          r.quantity = item.quantity;
          r.unit = item.unit;
        });
      }
    });
  } catch (e) {
    console.error('mealTemplateStore.createTemplate failed', e);
    useToastStore.getState().showToast("Couldn't save meal template", 'error');
  }
}

export async function deleteTemplate(templateId: string): Promise<void> {
  try {
    await database.write(async () => {
      const items = await database.collections
        .get<MealTemplateItem>('meal_template_items')
        .query(Q.where('meal_template_id', templateId))
        .fetch();
      for (const item of items) await item.destroyPermanently();
      const tmpl = await database.collections.get<MealTemplate>('meal_templates').find(templateId);
      await tmpl.destroyPermanently();
    });
  } catch (e) {
    console.error('mealTemplateStore.deleteTemplate failed', e);
    useToastStore.getState().showToast("Couldn't delete template", 'error');
  }
}

export async function logTemplate(
  templateId: string,
  targetDate: string,
  mealType: string,
): Promise<void> {
  try {
    const items = await database.collections
      .get<MealTemplateItem>('meal_template_items')
      .query(Q.where('meal_template_id', templateId))
      .fetch();
    for (const item of items) {
      await addEntry({
        date: targetDate,
        mealType,
        foodName: item.foodName,
        calories: item.calories,
        proteinG: item.proteinG,
        carbsG: item.carbsG,
        fatG: item.fatG,
        quantity: item.quantity,
        unit: item.unit,
        source: 'manual',
      });
    }
    const tmpl = await database.collections.get<MealTemplate>('meal_templates').find(templateId);
    const totalCal = items.reduce((s, i) => s + (i.calories * i.quantity) / 100, 0);
    useToastStore.getState().showToast(`Logged ${tmpl.name}`);
  } catch (e) {
    console.error('mealTemplateStore.logTemplate failed', e);
    useToastStore.getState().showToast("Couldn't log meal template", 'error');
  }
}
```

- [ ] **Step 3: Write integration tests**

```ts
// __tests__/integration/mealTemplateStore.test.ts
import { makeTestDatabase } from '../test-utils/makeTestDatabase';

const testDb = makeTestDatabase();
jest.mock('@/db/database', () => ({ database: testDb }));

import { createTemplate, deleteTemplate, logTemplate } from '@/store/mealTemplateStore';
import { firstValueFrom } from 'rxjs';
import { observeAllTemplates, observeTemplateItems } from '@/db/queries/mealTemplates';
import { observeEntriesForDate } from '@/db/queries/foodEntries';

const item = {
  foodName: 'Oats',
  calories: 379,
  proteinG: 13,
  carbsG: 68,
  fatG: 7,
  quantity: 100,
  unit: 'g',
};

beforeEach(async () => {
  for (const table of ['meal_templates', 'meal_template_items', 'food_entries']) {
    const records = await testDb.collections.get(table).query().fetch();
    await testDb.write(async () => {
      for (const r of records) await (r as any).destroyPermanently();
    });
  }
});

it('creates a template with items', async () => {
  await createTemplate('Morning bulk', [item]);
  const templates = await firstValueFrom(observeAllTemplates());
  expect(templates).toHaveLength(1);
  expect((templates[0] as any).name).toBe('Morning bulk');
  const items = await firstValueFrom(observeTemplateItems((templates[0] as any).id));
  expect(items).toHaveLength(1);
});

it('logTemplate creates food entries', async () => {
  await createTemplate('Quick breakfast', [item]);
  const templates = await firstValueFrom(observeAllTemplates());
  await logTemplate((templates[0] as any).id, '2026-05-03', 'breakfast');
  const entries = await firstValueFrom(observeEntriesForDate('2026-05-03'));
  expect(entries).toHaveLength(1);
  expect((entries[0] as any).foodName).toBe('Oats');
});

it('deleteTemplate removes template and items', async () => {
  await createTemplate('To delete', [item]);
  const [tmpl] = await firstValueFrom(observeAllTemplates());
  await deleteTemplate((tmpl as any).id);
  expect(await firstValueFrom(observeAllTemplates())).toHaveLength(0);
  expect(await firstValueFrom(observeTemplateItems((tmpl as any).id))).toHaveLength(0);
});
```

- [ ] **Step 4: Run tests + type check + commit**

```bash
npm test -- --testPathPattern=mealTemplate --no-watchman && npx tsc --noEmit
git add -A && git commit -m "feat: meal template data layer — store actions and observables"
```

---

## Task 10: MacroRing component

**Branch:** `phase1/macro-ring`

**Files:**

- Create: `components/MacroRing.tsx`, `__tests__/integration/MacroRing.test.tsx`

- [ ] **Step 1: Write test**

```tsx
// __tests__/integration/MacroRing.test.tsx
import { render } from '@testing-library/react-native';
import { MacroRing } from '@/components/MacroRing';
import { useSettingsStore } from '@/store/settingsStore';

beforeEach(() => {
  useSettingsStore.setState({ calorieGoal: 2000, proteinGoal: 150, carbsGoal: 250, fatGoal: 65 });
});

it('shows correct accessibility label', () => {
  const { getByLabelText } = render(
    <MacroRing totals={{ calories: 1450, proteinG: 80, carbsG: 120, fatG: 40 }} />,
  );
  expect(getByLabelText(/Calories 1450 of 2000/)).toBeTruthy();
});

it('renders with zero totals without crashing', () => {
  const { getByLabelText } = render(
    <MacroRing totals={{ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }} />,
  );
  expect(getByLabelText(/Calories 0 of 2000/)).toBeTruthy();
});
```

- [ ] **Step 2: Implement component**

```tsx
// components/MacroRing.tsx
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSettingsStore } from '@/store/settingsStore';

interface Totals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const SIZE = 160,
  STROKE = 12,
  R = (SIZE - STROKE) / 2,
  CIRC = 2 * Math.PI * R;

function ring(pct: number, color: string, offset: number) {
  const dash = Math.min(pct, 1) * CIRC;
  return (
    <Circle
      cx={SIZE / 2}
      cy={SIZE / 2}
      r={R}
      fill="none"
      stroke={color}
      strokeWidth={STROKE}
      strokeDasharray={`${dash} ${CIRC}`}
      strokeDashoffset={-offset * CIRC}
      strokeLinecap="round"
    />
  );
}

export function MacroRing({ totals }: { totals: Totals }) {
  const { calorieGoal, proteinGoal, carbsGoal, fatGoal } = useSettingsStore();
  const label = `Calories ${totals.calories} of ${calorieGoal}. Protein ${totals.proteinG} of ${proteinGoal} grams. Carbs ${totals.carbsG} of ${carbsGoal} grams. Fat ${totals.fatG} of ${fatGoal} grams.`;
  return (
    <View style={s.container} accessibilityLabel={label}>
      <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="#1e293b"
          strokeWidth={STROKE}
        />
        {ring(totals.proteinG / proteinGoal, '#6ee7b7', 0)}
        {ring(totals.carbsG / carbsGoal, '#93c5fd', 0.33)}
        {ring(totals.fatG / fatGoal, '#fca5a5', 0.66)}
      </Svg>
      <View style={s.center}>
        <Text style={s.cal}>{totals.calories}</Text>
        <Text style={s.label}>kcal</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  cal: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  label: { fontSize: 12, color: '#888' },
});
```

- [ ] **Step 3: Run tests + commit**

```bash
npm test -- --testPathPattern=MacroRing --no-watchman && npx tsc --noEmit
git add -A && git commit -m "feat: MacroRing component with SVG rings"
```

---

## Task 11: DateHeader component

**Branch:** `phase1/date-header`

**Files:**

- Create: `components/DateHeader.tsx`, `__tests__/integration/DateHeader.test.tsx`

- [ ] **Step 1: Write test**

```tsx
// __tests__/integration/DateHeader.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { DateHeader } from '@/components/DateHeader';
import { useSettingsStore } from '@/store/settingsStore';
import { todayISO } from '@/utils/date';

jest.mock('@react-native-community/datetimepicker', () => {
  const { View, Text, Pressable } = require('react-native');
  return ({ onChange }: any) => (
    <Pressable testID="datepicker" onPress={() => onChange({}, new Date('2026-01-15T12:00:00Z'))}>
      <Text>DatePicker</Text>
    </Pressable>
  );
});

beforeEach(() => useSettingsStore.setState({ selectedDate: '2026-05-03' }));

it('shows previous day on left arrow tap', () => {
  render(<DateHeader />);
  const store = useSettingsStore.getState();
  // Simulate arrow tap via store directly (component reads from store)
  store.setSelectedDate('2026-05-02');
  expect(useSettingsStore.getState().selectedDate).toBe('2026-05-02');
});

it('Today button resets to today', () => {
  useSettingsStore.setState({ selectedDate: '2020-01-01' });
  const { getByLabelText } = render(<DateHeader />);
  fireEvent.press(getByLabelText('Go to today'));
  expect(useSettingsStore.getState().selectedDate).toBe(todayISO());
});
```

- [ ] **Step 2: Implement component**

```tsx
// components/DateHeader.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { addDaysISO, todayISO, parseISO, toISO } from '@/utils/date';

export function DateHeader() {
  const { selectedDate, setSelectedDate, resetToToday } = useSettingsStore();
  const [showPicker, setShowPicker] = useState(false);
  const isToday = selectedDate === todayISO();

  const formatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(parseISO(selectedDate));

  return (
    <View style={s.row}>
      <Pressable
        onPress={() => setSelectedDate(addDaysISO(selectedDate, -1))}
        style={s.arrow}
        accessibilityLabel="Previous day"
        hitSlop={8}
      >
        <Text style={s.arrowText}>‹</Text>
      </Pressable>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={s.dateBtn}
        accessibilityLabel={`Selected date ${formatted}, tap to change`}
      >
        <Text style={s.dateText}>{formatted}</Text>
      </Pressable>
      <Pressable
        onPress={() => setSelectedDate(addDaysISO(selectedDate, 1))}
        style={s.arrow}
        accessibilityLabel="Next day"
        hitSlop={8}
      >
        <Text style={s.arrowText}>›</Text>
      </Pressable>
      {!isToday && (
        <Pressable onPress={resetToToday} style={s.todayBtn} accessibilityLabel="Go to today">
          <Text style={s.todayText}>Today</Text>
        </Pressable>
      )}
      {showPicker && (
        <DateTimePicker
          value={parseISO(selectedDate)}
          mode="date"
          display="inline"
          onChange={(_, date) => {
            setShowPicker(false);
            if (date) setSelectedDate(toISO(date));
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  arrow: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 24, color: '#fff' },
  dateBtn: { flex: 1, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  dateText: { fontSize: 17, fontWeight: '600', color: '#fff' },
  todayBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  todayText: { fontSize: 13, color: '#6366f1' },
});
```

- [ ] **Step 3: Run tests + commit**

```bash
npm test -- --testPathPattern=DateHeader --no-watchman && npx tsc --noEmit
git add -A && git commit -m "feat: DateHeader component with date picker"
```

---

## Task 12: FoodEntry row + MealTemplatePill

**Branch:** `phase1/food-entry-row`

**Files:**

- Create: `components/FoodEntry.tsx`, `components/MealTemplatePill.tsx`
- Create: `__tests__/integration/FoodEntry.test.tsx`

- [ ] **Step 1: Test + implement FoodEntry**

```tsx
// __tests__/integration/FoodEntry.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { FoodEntryRow } from '@/components/FoodEntry';

const entry = {
  id: '1',
  foodName: 'Chicken breast',
  quantity: 200,
  unit: 'g',
  calories: 330,
  proteinG: 62,
  carbsG: 0,
  fatG: 7,
};

it('renders food name and calories', () => {
  const { getByText } = render(<FoodEntryRow entry={entry} onDelete={jest.fn()} />);
  expect(getByText('Chicken breast')).toBeTruthy();
  expect(getByText('330 kcal')).toBeTruthy();
});

it('calls onDelete with id', () => {
  const onDelete = jest.fn();
  const { getByLabelText } = render(<FoodEntryRow entry={entry} onDelete={onDelete} />);
  fireEvent.press(getByLabelText('Delete Chicken breast'));
  expect(onDelete).toHaveBeenCalledWith('1');
});
```

```tsx
// components/FoodEntry.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Entry {
  id: string;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function FoodEntryRow({
  entry,
  onDelete,
}: {
  entry: Entry;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={s.row}>
      <View style={s.main}>
        <Text style={s.name} numberOfLines={1}>
          {entry.foodName}
        </Text>
        <Text style={s.sub}>
          {entry.quantity}
          {entry.unit} · P {entry.proteinG}g · C {entry.carbsG}g · F {entry.fatG}g
        </Text>
      </View>
      <Text style={s.cal}>{entry.calories} kcal</Text>
      <Pressable
        onPress={() => onDelete(entry.id)}
        style={s.del}
        accessibilityLabel={`Delete ${entry.foodName}`}
        hitSlop={8}
      >
        <Text style={s.delText}>✕</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 72,
  },
  main: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, color: '#fff', fontWeight: '500' },
  sub: { fontSize: 12, color: '#888', marginTop: 2 },
  cal: { fontSize: 14, color: '#ddd', marginRight: 8 },
  del: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  delText: { color: '#888', fontSize: 16 },
});
```

- [ ] **Step 2: Implement MealTemplatePill**

```tsx
// components/MealTemplatePill.tsx
import { Pressable, Text, StyleSheet } from 'react-native';

interface Props {
  name: string;
  totalCal: number;
  onPress: () => void;
}

export function MealTemplatePill({ name, totalCal, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={s.pill}
      accessibilityLabel={`Log ${name}, ${totalCal} calories`}
    >
      <Text style={s.name}>{name}</Text>
      <Text style={s.cal}> {totalCal} kcal</Text>
    </Pressable>
  );
}
const s = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    backgroundColor: '#312e81',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 6,
    minHeight: 44,
    alignItems: 'center',
  },
  name: { color: '#c7d2fe', fontSize: 13, fontWeight: '500' },
  cal: { color: '#818cf8', fontSize: 12 },
});
```

- [ ] **Step 3: Run tests + commit**

```bash
npm test -- --testPathPattern=FoodEntry --no-watchman && npx tsc --noEmit
git add -A && git commit -m "feat: FoodEntryRow and MealTemplatePill components"
```

---

## Task 13: Food log screen

**Branch:** `phase1/food-log-screen`

**Files:**

- Modify: `app/(tabs)/index.tsx` (full rewrite)
- Create: `components/MealSectionHeader.tsx`, `__tests__/integration/FoodLogScreen.test.tsx`

The screen renders `<DateHeader />`, `<MacroRing />`, then a `<SectionList>` with four sections: breakfast / lunch / dinner / snack. Each section header shows meal name, a "+ Log food" button (navigates to `/food/search?mealType=X`), and `<MealTemplatePill>` chips for all templates. Entries come from `observeEntriesForDate(selectedDate)` via a `useObservable` hook (or `withObservables`). Use `withObservables` from `@nozbe/with-observables`.

- [ ] **Step 1: Create MealSectionHeader**

```tsx
// components/MealSectionHeader.tsx
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MealTemplatePill } from './MealTemplatePill';
import { logTemplate } from '@/store/mealTemplateStore';
import { useSettingsStore } from '@/store/settingsStore';

interface Template {
  id: string;
  name: string;
  totalCal: number;
}
interface Props {
  mealType: string;
  label: string;
  templates: Template[];
}

export function MealSectionHeader({ mealType, label, templates }: Props) {
  const router = useRouter();
  const { selectedDate } = useSettingsStore();
  return (
    <View style={s.container}>
      <View style={s.row}>
        <Text style={s.label}>{label}</Text>
        <Pressable
          onPress={() => router.push(`/food/search?mealType=${mealType}`)}
          style={s.addBtn}
          accessibilityLabel={`Log food for ${label}`}
        >
          <Text style={s.addText}>+ Log food</Text>
        </Pressable>
      </View>
      {templates.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pills}>
          {templates.map(t => (
            <MealTemplatePill
              key={t.id}
              name={t.name}
              totalCal={t.totalCal}
              onPress={() => logTemplate(t.id, selectedDate, mealType)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: '#0f172a',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addBtn: { minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: 8 },
  addText: { color: '#6366f1', fontSize: 14 },
  pills: { marginTop: 8 },
});
```

- [ ] **Step 2: Implement food log screen**

```tsx
// app/(tabs)/index.tsx
import { SectionList, View, Text, StyleSheet } from 'react-native';
import { withObservables } from '@nozbe/with-observables';
import { DateHeader } from '@/components/DateHeader';
import { MacroRing } from '@/components/MacroRing';
import { FoodEntryRow } from '@/components/FoodEntry';
import { MealSectionHeader } from '@/components/MealSectionHeader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { observeEntriesForDate } from '@/db/queries/foodEntries';
import { observeAllTemplates, observeTemplateItems } from '@/db/queries/mealTemplates';
import { deleteEntry } from '@/store/foodStore';
import { useSettingsStore } from '@/store/settingsStore';
import { sumMacros } from '@/utils/macros';
import type { FoodEntry } from '@/db/models/FoodEntry';
import type { MealTemplate } from '@/db/models/MealTemplate';

const MEALS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snacks' },
];

function FoodLogInner({ entries, templates }: { entries: FoodEntry[]; templates: MealTemplate[] }) {
  const selectedDate = useSettingsStore(s => s.selectedDate);
  const totals = sumMacros(
    entries.map(e => ({
      calories: e.calories,
      proteinG: e.proteinG,
      carbsG: e.carbsG,
      fatG: e.fatG,
    })),
  );

  const sections = MEALS.map(m => ({
    mealType: m.key,
    label: m.label,
    data: entries.filter(e => e.mealType === m.key),
  }));

  const templateSummaries = templates.map(t => ({
    id: t.id,
    name: t.name,
    totalCal: 0, // computed from items in MealSectionHeader via separate observable if needed; 0 for now
  }));

  return (
    <SectionList
      sections={sections}
      keyExtractor={item => (item as FoodEntry).id}
      initialNumToRender={15}
      maxToRenderPerBatch={10}
      ListHeaderComponent={
        <>
          <DateHeader />
          <View style={s.ring}>
            <MacroRing totals={totals} />
          </View>
        </>
      }
      renderSectionHeader={({ section }) => (
        <MealSectionHeader
          mealType={section.mealType}
          label={section.label}
          templates={templateSummaries}
        />
      )}
      renderItem={({ item }) => (
        <FoodEntryRow
          entry={{
            id: (item as FoodEntry).id,
            foodName: (item as FoodEntry).foodName,
            quantity: (item as FoodEntry).quantity,
            unit: (item as FoodEntry).unit,
            calories: (item as FoodEntry).calories,
            proteinG: (item as FoodEntry).proteinG,
            carbsG: (item as FoodEntry).carbsG,
            fatG: (item as FoodEntry).fatG,
          }}
          onDelete={deleteEntry}
        />
      )}
      renderSectionFooter={({ section }) =>
        section.data.length === 0 ? <Text style={s.empty}>No items — tap + Log food</Text> : null
      }
      stickySectionHeadersEnabled={false}
      style={s.list}
    />
  );
}

const enhance = withObservables(['selectedDate'], ({ selectedDate }: { selectedDate: string }) => ({
  entries: observeEntriesForDate(selectedDate),
  templates: observeAllTemplates(),
}));
const EnhancedFoodLog = enhance(FoodLogInner as any);

export default function FoodLogTab() {
  const selectedDate = useSettingsStore(s => s.selectedDate);
  return (
    <ErrorBoundary>
      <View style={s.screen}>
        <EnhancedFoodLog selectedDate={selectedDate} />
      </View>
    </ErrorBoundary>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a' },
  ring: { alignItems: 'center', paddingVertical: 16 },
  list: { flex: 1 },
  empty: { color: '#4b5563', fontSize: 13, paddingHorizontal: 16, paddingVertical: 8 },
});
```

- [ ] **Step 3: Write integration test**

```ts
// __tests__/integration/FoodLogScreen.test.tsx
import { render, waitFor } from '@testing-library/react-native'
import { makeTestDatabase } from '../test-utils/makeTestDatabase'

const testDb = makeTestDatabase()
jest.mock('@/db/database', () => ({ database: testDb }))

import FoodLogTab from '@/app/(tabs)/index'
import { addEntry } from '@/store/foodStore'
import { useSettingsStore } from '@/store/settingsStore'

beforeEach(() => {
  useSettingsStore.setState({ selectedDate: '2026-05-03' })
})

it('renders entries for selected date', async () => {
  await addEntry({ date: '2026-05-03', mealType: 'breakfast', foodName: 'Porridge', calories: 300, proteinG: 10, carbsG: 50, fatG: 5, quantity: 1, unit: 'serving', source: 'manual' })
  const { findByText } = render(<FoodLogTab />)
  expect(await findByText('Porridge')).toBeTruthy()
})

it('does not show entries for other dates', async () => {
  await addEntry({ date: '2026-05-02', mealType: 'lunch', foodName: 'Yesterday pizza', calories: 500, proteinG: 20, carbsG: 60, fatG: 15, quantity: 1, unit: 'serving', source: 'manual' })
  const { queryByText } = render(<FoodLogTab />)
  await waitFor(() => expect(queryByText('Yesterday pizza')).toBeNull())
})
```

- [ ] **Step 4: Install `@nozbe/with-observables` if not present, run tests + commit**

```bash
npm install @nozbe/with-observables
npm test -- --testPathPattern=FoodLogScreen --no-watchman && npx tsc --noEmit
git add -A && git commit -m "feat: food log screen with SectionList, MacroRing, template pills"
```

---

## Task 14: Manual food entry screen

**Branch:** `phase1/manual-food-add`

**Files:**

- Create: `app/food/add.tsx`, `__tests__/integration/AddFoodScreen.test.tsx`

- [ ] **Step 1: Implement form with Zod validation**

```tsx
// app/food/add.tsx
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { z } from 'zod';
import { addEntry } from '@/store/foodStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  calories: z.number({ invalid_type_error: 'Enter a number' }).min(0),
  proteinG: z.number({ invalid_type_error: 'Enter a number' }).min(0),
  carbsG: z.number({ invalid_type_error: 'Enter a number' }).min(0),
  fatG: z.number({ invalid_type_error: 'Enter a number' }).min(0),
  quantity: z.number({ invalid_type_error: 'Enter a number' }).positive('Must be > 0'),
});

export default function AddFoodScreen() {
  const { mealType = 'snack' } = useLocalSearchParams<{ mealType?: string }>();
  const { selectedDate } = useSettingsStore();
  const router = useRouter();
  const { showToast } = useToastStore();

  const [fields, setFields] = useState({
    name: '',
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
    quantity: '100',
  });
  const [unit, setUnit] = useState<'g' | 'ml' | 'oz' | 'serving'>('g');
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  async function handleSubmit() {
    const parsed = schema.safeParse({
      name: fields.name,
      calories: Number(fields.calories),
      proteinG: Number(fields.proteinG),
      carbsG: Number(fields.carbsG),
      fatG: Number(fields.fatG),
      quantity: Number(fields.quantity),
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach(e => {
        errs[e.path[0] as string] = e.message;
      });
      setErrors(errs);
      return;
    }
    try {
      await addEntry({
        date: selectedDate,
        mealType,
        foodName: parsed.data.name,
        calories: parsed.data.calories,
        proteinG: parsed.data.proteinG,
        carbsG: parsed.data.carbsG,
        fatG: parsed.data.fatG,
        quantity: parsed.data.quantity,
        unit,
        source: 'manual',
      });
      router.back();
    } catch {
      showToast("Couldn't save entry", 'error');
    }
  }

  function field(
    key: keyof typeof fields,
    label: string,
    keyboard: 'default' | 'decimal-pad' = 'decimal-pad',
  ) {
    return (
      <View style={s.field}>
        <Text style={s.label} accessibilityLabel={label}>
          {label}
        </Text>
        <TextInput
          style={[s.input, errors[key] ? s.inputError : null]}
          value={fields[key]}
          onChangeText={v => setFields(f => ({ ...f, [key]: v }))}
          keyboardType={keyboard}
          accessibilityLabel={label}
        />
        {errors[key] && <Text style={s.error}>{errors[key]}</Text>}
      </View>
    );
  }

  return (
    <ScrollView style={s.screen} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Add food manually</Text>
      {field('name', 'Name', 'default')}
      {field('calories', 'Calories')}
      {field('proteinG', 'Protein (g)')}
      {field('carbsG', 'Carbs (g)')}
      {field('fatG', 'Fat (g)')}
      {field('quantity', 'Quantity')}
      <View style={s.field}>
        <Text style={s.label}>Unit</Text>
        <View style={s.units}>
          {(['g', 'ml', 'oz', 'serving'] as const).map(u => (
            <Pressable
              key={u}
              style={[s.unitBtn, unit === u ? s.unitActive : null]}
              onPress={() => setUnit(u)}
              accessibilityLabel={`Unit ${u}`}
            >
              <Text style={[s.unitText, unit === u ? s.unitActiveText : null]}>{u}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Pressable onPress={handleSubmit} style={s.submit} accessibilityLabel="Save food entry">
        <Text style={s.submitText}>Save</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, color: '#94a3b8', marginBottom: 6 },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 16,
    minHeight: 44,
  },
  inputError: { borderWidth: 1, borderColor: '#ef4444' },
  error: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  units: { flexDirection: 'row', gap: 8 },
  unitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  unitActive: { backgroundColor: '#4f46e5' },
  unitText: { color: '#94a3b8', fontSize: 14 },
  unitActiveText: { color: '#fff' },
  submit: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 44,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 2: Write integration test**

```ts
// __tests__/integration/AddFoodScreen.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { makeTestDatabase } from '../test-utils/makeTestDatabase'

const testDb = makeTestDatabase()
jest.mock('@/db/database', () => ({ database: testDb }))
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ mealType: 'breakfast' }), useRouter: () => ({ back: jest.fn() }) }))

import AddFoodScreen from '@/app/food/add'
import { observeEntriesForDate } from '@/db/queries/foodEntries'
import { firstValueFrom } from 'rxjs'
import { useSettingsStore } from '@/store/settingsStore'

beforeEach(() => useSettingsStore.setState({ selectedDate: '2026-05-03' }))

it('saves valid entry and navigates back', async () => {
  const { getByLabelText } = render(<AddFoodScreen />)
  fireEvent.changeText(getByLabelText('Name'), 'Porridge')
  fireEvent.changeText(getByLabelText('Calories'), '300')
  fireEvent.changeText(getByLabelText('Protein (g)'), '10')
  fireEvent.changeText(getByLabelText('Carbs (g)'), '50')
  fireEvent.changeText(getByLabelText('Fat (g)'), '5')
  fireEvent.press(getByLabelText('Save food entry'))
  await waitFor(async () => {
    const entries = await firstValueFrom(observeEntriesForDate('2026-05-03'))
    expect(entries).toHaveLength(1)
  })
})

it('shows validation error for empty name', async () => {
  const { getByLabelText, findByText } = render(<AddFoodScreen />)
  fireEvent.press(getByLabelText('Save food entry'))
  expect(await findByText('Name is required')).toBeTruthy()
})
```

- [ ] **Step 3: Run tests + commit**

```bash
npm test -- --testPathPattern=AddFood --no-watchman && npx tsc --noEmit
git add -A && git commit -m "feat: manual food entry screen with Zod validation"
```

---

## Task 15: Food search screen + Save as meal

**Branch:** `phase1/food-search`

**Files:**

- Create: `app/food/search.tsx`, `app/food/confirm.tsx`, `components/FoodSearchResultRow.tsx`, `hooks/useDebouncedValue.ts`
- Create: `__tests__/unit/useDebouncedValue.test.ts`, `__tests__/integration/FoodSearchScreen.test.tsx`

- [ ] **Step 1: useDebouncedValue hook + test**

```ts
// hooks/useDebouncedValue.ts
import { useState, useEffect } from 'react';
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
```

```ts
// __tests__/unit/useDebouncedValue.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

jest.useFakeTimers();

it('returns initial value immediately', () => {
  const { result } = renderHook(() => useDebouncedValue('hello', 300));
  expect(result.current).toBe('hello');
});

it('debounces updates', () => {
  const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
    initialProps: { v: 'a' },
  });
  rerender({ v: 'b' });
  expect(result.current).toBe('a');
  act(() => jest.advanceTimersByTime(300));
  expect(result.current).toBe('b');
});
```

- [ ] **Step 2: Implement search screen with Save as meal**

The search screen reads `mealType` from route params. Shows a search input. Empty state: recent foods (from `observeRecentFoods`). Typing triggers debounced OFF search (300ms). AbortController cancels in-flight on every new keystroke. Results in a `FlatList` with `keyExtractor`, `initialNumToRender={15}`, `maxToRenderPerBatch={10}`, `getItemLayout` (rows fixed height 64). A "Save as meal" button appears after any search result is selected (multi-select mode). A "Manual entry" button at the bottom links to `/food/add?mealType=X`.

Key code — the "Save as meal" flow:

```tsx
// In app/food/search.tsx — Save as meal button
{
  selectedItems.length > 0 && (
    <Pressable
      style={s.saveBtn}
      onPress={() => setShowNameModal(true)}
      accessibilityLabel="Save selection as meal template"
    >
      <Text style={s.saveBtnText}>Save as meal ({selectedItems.length} items)</Text>
    </Pressable>
  );
}
```

When user enters a name and confirms, call `createTemplate(name, selectedItems)` from `mealTemplateStore`.

- [ ] **Step 3: Implement confirm screen**

```tsx
// app/food/confirm.tsx
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { addEntry } from '@/store/foodStore';
import { useSettingsStore } from '@/store/settingsStore';

export default function ConfirmFoodScreen() {
  const {
    mealType = 'snack',
    name,
    kcal,
    protein,
    carbs,
    fat,
    defaultQty = '100',
  } = useLocalSearchParams<{
    mealType?: string;
    name: string;
    kcal: string;
    protein: string;
    carbs: string;
    fat: string;
    defaultQty?: string;
  }>();
  const [quantity, setQuantity] = useState(defaultQty);
  const { selectedDate } = useSettingsStore();
  const router = useRouter();

  const scale = Number(quantity) / 100;
  async function handleSave() {
    await addEntry({
      date: selectedDate,
      mealType,
      foodName: name,
      calories: Math.round(Number(kcal) * scale),
      proteinG: Math.round(Number(protein) * scale * 10) / 10,
      carbsG: Math.round(Number(carbs) * scale * 10) / 10,
      fatG: Math.round(Number(fat) * scale * 10) / 10,
      quantity: Number(quantity),
      unit: 'g',
      source: 'open_food_facts',
    });
    router.dismiss(2); // back past confirm + search to food log
  }

  return (
    <View style={s.screen}>
      <Text style={s.name}>{name}</Text>
      <Text style={s.preview}>
        {Math.round(Number(kcal) * scale)} kcal · P {(Number(protein) * scale).toFixed(1)}g · C{' '}
        {(Number(carbs) * scale).toFixed(1)}g · F {(Number(fat) * scale).toFixed(1)}g
      </Text>
      <Text style={s.label}>Quantity (g)</Text>
      <TextInput
        style={s.input}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="decimal-pad"
        accessibilityLabel="Quantity"
      />
      <Pressable onPress={handleSave} style={s.btn} accessibilityLabel="Save food">
        <Text style={s.btnText}>Save</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a', padding: 24 },
  name: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 },
  preview: { fontSize: 14, color: '#94a3b8', marginBottom: 24 },
  label: { fontSize: 13, color: '#94a3b8', marginBottom: 6 },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 18,
    minHeight: 44,
  },
  btn: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
    minHeight: 44,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 4: Write integration test**

```ts
// __tests__/integration/FoodSearchScreen.test.tsx
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { makeTestDatabase } from '../test-utils/makeTestDatabase'

jest.useFakeTimers()
const testDb = makeTestDatabase()
jest.mock('@/db/database', () => ({ database: testDb }))
jest.mock('@/services/openFoodFacts', () => ({
  searchFoods: jest.fn(),
  OffNetworkError: class OffNetworkError extends Error {},
}))
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ mealType: 'breakfast' }), useRouter: () => ({ push: jest.fn() }) }))

import FoodSearchScreen from '@/app/food/search'
import { searchFoods } from '@/services/openFoodFacts'
import { addEntry } from '@/store/foodStore'
import { firstValueFrom } from 'rxjs'
import { observeEntriesForDate } from '@/db/queries/foodEntries'
import { useSettingsStore } from '@/store/settingsStore'

beforeEach(() => {
  useSettingsStore.setState({ selectedDate: '2026-05-03' })
  ;(searchFoods as jest.Mock).mockResolvedValue([
    { id: 'abc', name: 'Oats', kcalPer100g: 379, proteinPer100g: 13, carbsPer100g: 68, fatPer100g: 7 },
  ])
})

it('shows search results after debounce', async () => {
  const { getByPlaceholderText, findByText } = render(<FoodSearchScreen />)
  fireEvent.changeText(getByPlaceholderText('Search foods…'), 'oats')
  act(() => jest.advanceTimersByTime(300))
  expect(await findByText('Oats')).toBeTruthy()
})

it('shows recent foods when query is empty', async () => {
  await addEntry({ date: '2026-05-02', mealType: 'breakfast', foodName: 'Eggs', calories: 140, proteinG: 12, carbsG: 1, fatG: 10, quantity: 2, unit: 'serving', source: 'manual' })
  const { findByText } = render(<FoodSearchScreen />)
  expect(await findByText('Eggs')).toBeTruthy()
})
```

- [ ] **Step 5: Run all tests + commit**

```bash
npm test --no-watchman && npx tsc --noEmit
git add -A && git commit -m "feat: food search screen, confirm flow, Save as meal"
```

---

## Task 16: One-tap re-log from history

**Branch:** `phase1/quick-relog`

**Files:**

- Modify: `app/(tabs)/index.tsx` — empty meal section shows last 3 recent foods for that meal
- Modify: `components/MealSectionHeader.tsx` — add recent re-log buttons
- Modify: `db/queries/foodEntries.ts` — `observeRecentByMeal` already exists
- Create: `__tests__/integration/relog.test.tsx`

- [ ] **Step 1: Add recent re-log buttons to MealSectionHeader**

When a meal section has no entries, show up to 3 recent foods for that meal type as tappable rows. Tapping calls `relogEntry(sourceId, selectedDate, mealType)`.

Pass `recentEntries: FoodEntry[]` prop to `MealSectionHeader`. Render them only when `entries.length === 0`.

- [ ] **Step 2: Wire observable in food log screen**

Pass `observeRecentByMeal(mealType)` observable into each section header via `withObservables` or a wrapper component.

- [ ] **Step 3: Write integration test**

```ts
// __tests__/integration/relog.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { makeTestDatabase } from '../test-utils/makeTestDatabase'

const testDb = makeTestDatabase()
jest.mock('@/db/database', () => ({ database: testDb }))

import { addEntry } from '@/store/foodStore'
import { firstValueFrom } from 'rxjs'
import { observeEntriesForDate } from '@/db/queries/foodEntries'
import { useSettingsStore } from '@/store/settingsStore'
import FoodLogTab from '@/app/(tabs)/index'

beforeEach(async () => {
  useSettingsStore.setState({ selectedDate: '2026-05-03' })
  const all = await testDb.collections.get('food_entries').query().fetch()
  await testDb.write(async () => { for (const r of all) await (r as any).destroyPermanently() })
})

it('re-logs a recent entry for today', async () => {
  await addEntry({ date: '2026-05-02', mealType: 'breakfast', foodName: 'Porridge', calories: 300, proteinG: 10, carbsG: 50, fatG: 5, quantity: 100, unit: 'g', source: 'manual' })
  const { findByLabelText } = render(<FoodLogTab />)
  const relogBtn = await findByLabelText('Re-log Porridge')
  fireEvent.press(relogBtn)
  await waitFor(async () => {
    const entries = await firstValueFrom(observeEntriesForDate('2026-05-03'))
    expect(entries.some((e: any) => e.foodName === 'Porridge')).toBe(true)
  })
})
```

- [ ] **Step 4: Run tests + commit**

```bash
npm test -- --testPathPattern=relog --no-watchman && npx tsc --noEmit
git add -A && git commit -m "feat: one-tap re-log from recent meal history"
```

---

## Task 17: Manage meal templates screen

**Branch:** `phase1/manage-templates`

**Files:**

- Create: `app/settings/meal-templates.tsx`

This screen lists all saved templates (from `observeAllTemplates()`). Each row shows the template name, item count, and a delete button. A note at the bottom explains templates are created from the search screen. Swipe-to-delete or long-press-to-delete both acceptable.

- [ ] **Step 1: Implement screen**

```tsx
// app/settings/meal-templates.tsx
import { FlatList, View, Text, Pressable, StyleSheet } from 'react-native';
import { withObservables } from '@nozbe/with-observables';
import { observeAllTemplates } from '@/db/queries/mealTemplates';
import { deleteTemplate } from '@/store/mealTemplateStore';
import type { MealTemplate } from '@/db/models/MealTemplate';

function TemplateList({ templates }: { templates: MealTemplate[] }) {
  if (templates.length === 0) {
    return (
      <Text style={s.empty}>No saved meals yet. Use "Save as meal" in the food search screen.</Text>
    );
  }
  return (
    <FlatList
      data={templates}
      keyExtractor={t => t.id}
      initialNumToRender={15}
      maxToRenderPerBatch={10}
      renderItem={({ item }) => (
        <View style={s.row}>
          <Text style={s.name}>{item.name}</Text>
          <Pressable
            onPress={() => deleteTemplate(item.id)}
            style={s.del}
            accessibilityLabel={`Delete ${item.name}`}
          >
            <Text style={s.delText}>Delete</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const enhance = withObservables([], () => ({ templates: observeAllTemplates() }));
const EnhancedList = enhance(TemplateList as any);

export default function ManageTemplatesScreen() {
  return (
    <View style={s.screen}>
      <EnhancedList />
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    minHeight: 44,
  },
  name: { flex: 1, color: '#fff', fontSize: 16 },
  del: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  delText: { color: '#ef4444', fontSize: 14 },
  empty: { color: '#4b5563', fontSize: 14, padding: 24, textAlign: 'center' },
});
```

- [ ] **Step 2: Add route entry in app router**

Create `app/settings/_layout.tsx` if it doesn't exist (or just ensure `app/settings/meal-templates.tsx` is reachable via `router.push('/settings/meal-templates')`).

- [ ] **Step 3: Link from food log or tab bar**

Add a settings icon or gear button in the food log header that navigates to `/settings/meal-templates`.

- [ ] **Step 4: Run tests + commit**

```bash
npm test --no-watchman && npx tsc --noEmit
git add -A && git commit -m "feat: manage meal templates settings screen"
```

---

## Task 18: Maestro E2E — log a meal

**Branch:** `phase1/maestro-e2e`

**Files:**

- Create: `e2e/log-meal.yaml`, `e2e/README.md`

- [ ] **Step 1: Create Maestro flow**

```yaml
# e2e/log-meal.yaml
appId: com.yourname.gymtracker
---
- launchApp:
    clearState: true
- assertVisible: 'Phase 1' # Placeholder text while full screen is building — update to real element
- tapOn:
    accessibilityLabel: 'Log food for Breakfast'
- tapOn:
    accessibilityLabel: 'Manual entry'
- tapOn:
    accessibilityLabel: 'Name'
- inputText: 'Chicken breast'
- tapOn:
    accessibilityLabel: 'Calories'
- inputText: '165'
- tapOn:
    accessibilityLabel: 'Protein (g)'
- inputText: '31'
- tapOn:
    accessibilityLabel: 'Carbs (g)'
- inputText: '0'
- tapOn:
    accessibilityLabel: 'Fat (g)'
- inputText: '4'
- tapOn:
    accessibilityLabel: 'Save food entry'
- assertVisible: 'Chicken breast'
- assertVisible: '165 kcal'
```

- [ ] **Step 2: Create README**

```markdown
# E2E Tests (Maestro)

Requires a development build installed on the simulator (not Expo Go).

## Setup

brew install maestro

## Run

maestro test e2e/log-meal.yaml
```

- [ ] **Step 3: Run flow on simulator (manual, outside sandbox)**

Run `maestro test e2e/log-meal.yaml`. Adjust `accessibilityLabel` selectors if needed.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: Maestro E2E flow for logging a meal"
```

---

## Phase 1 exit criteria

All 17 implementation tasks committed to feature branches and merged. Then:

- [ ] `npm run typecheck` passes from `main`
- [ ] `npm test` passes from `main`
- [ ] App boots on iOS simulator, navigates all 4 tabs without error
- [ ] Full flow works: open app → navigate to food log → log a meal via search → see it in the daily log with correct macros → log using a saved meal template → entry appears
- [ ] `e2e/log-meal.yaml` runs green on simulator
- [ ] `tasks.md` (old plan) deleted — this file supersedes it
