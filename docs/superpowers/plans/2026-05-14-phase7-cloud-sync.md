# Phase 7 Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mirror all local WatermelonDB data to Supabase Postgres on every write (fire-and-forget) and restore on sign-in when the local DB is empty.

**Architecture:** Direct upsert from client to Supabase Postgres after each successful local write. Soft deletes via a `deleted_at` column so other devices can replay deletions. Restore fetches all rows for the authenticated user and re-creates them locally via `prepareCreateFromDirtyRaw`. Sync only fires when `session !== null` AND `syncEnabled === true`. Local WatermelonDB is the source of truth; cloud is durable backup.

**Tech Stack:** Supabase Postgres + RLS, `@supabase/supabase-js` client, WatermelonDB `prepareCreateFromDirtyRaw`, Zustand stores.

**Note on table count:** The original spec listed 6 tables but the live schema has 8 (also `meal_templates`, `meal_template_items`). This plan syncs all 8 since meal templates are also user data that should persist across reinstalls.

**Out of scope for this plan:** Account deletion via Supabase Edge Function. The settings screen has a "Coming soon" stub for the Delete account button; wiring it to a real Edge Function (writing the function in TypeScript, deploying it via `supabase functions deploy`, and clearing local data on confirmation) is a separate follow-up plan — App Store submission requires the button to exist (already done) but not that the deletion actually succeeds yet.

---

### Task 1: Supabase SQL schema + project setup docs

Creates the Postgres schema mirroring all 8 WatermelonDB tables, RLS policies, and a README documenting the manual project-setup steps the user has to perform once (creating the Supabase project, running the migration in the SQL editor, updating `app.config.ts`).

**Files:**

- Create: `supabase/migrations/0001_initial_schema.sql`
- Create: `supabase/README.md`

- [ ] **Step 1: Create the SQL migration file**

Create `supabase/migrations/0001_initial_schema.sql`:

```sql
-- Kilo cloud sync — initial schema
-- Mirrors WatermelonDB tables. Run this once in the Supabase SQL editor.

-- food_entries
create table public.food_entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  meal_type text not null,
  food_name text not null,
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  quantity numeric not null,
  unit text not null,
  source text not null,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index food_entries_user_id_idx on public.food_entries(user_id);

-- workout_sessions
create table public.workout_sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  name text not null,
  notes text,
  duration_min numeric,
  plan_id text,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index workout_sessions_user_id_idx on public.workout_sessions(user_id);

-- workout_sets
create table public.workout_sets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  exercise_name text not null,
  set_number numeric not null,
  reps numeric not null,
  weight_kg numeric not null,
  rpe numeric,
  rest_seconds numeric,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index workout_sets_user_id_idx on public.workout_sets(user_id);

-- body_weight_entries
create table public.body_weight_entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  weight_kg numeric not null,
  notes text,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index body_weight_entries_user_id_idx on public.body_weight_entries(user_id);

-- meal_templates
create table public.meal_templates (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index meal_templates_user_id_idx on public.meal_templates(user_id);

-- meal_template_items
create table public.meal_template_items (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_template_id text not null,
  food_name text not null,
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  quantity numeric not null,
  unit text not null,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index meal_template_items_user_id_idx on public.meal_template_items(user_id);

-- training_plans
create table public.training_plans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index training_plans_user_id_idx on public.training_plans(user_id);

-- training_plan_exercises
create table public.training_plan_exercises (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null,
  day text not null,
  exercise_name text not null,
  target_sets numeric not null,
  target_reps numeric not null,
  target_weight_kg numeric not null,
  order_index numeric not null,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index training_plan_exercises_user_id_idx on public.training_plan_exercises(user_id);

-- Row-level security: every table, every action gated on user_id = auth.uid()
alter table public.food_entries enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
alter table public.body_weight_entries enable row level security;
alter table public.meal_templates enable row level security;
alter table public.meal_template_items enable row level security;
alter table public.training_plans enable row level security;
alter table public.training_plan_exercises enable row level security;

create policy "users access own rows" on public.food_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users access own rows" on public.workout_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users access own rows" on public.workout_sets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users access own rows" on public.body_weight_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users access own rows" on public.meal_templates
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users access own rows" on public.meal_template_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users access own rows" on public.training_plans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users access own rows" on public.training_plan_exercises
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Trigger: bump updated_at on UPDATE
create or replace function public.bump_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger bump_updated_at before update on public.food_entries
  for each row execute function public.bump_updated_at();
create trigger bump_updated_at before update on public.workout_sessions
  for each row execute function public.bump_updated_at();
create trigger bump_updated_at before update on public.workout_sets
  for each row execute function public.bump_updated_at();
create trigger bump_updated_at before update on public.body_weight_entries
  for each row execute function public.bump_updated_at();
create trigger bump_updated_at before update on public.meal_templates
  for each row execute function public.bump_updated_at();
create trigger bump_updated_at before update on public.meal_template_items
  for each row execute function public.bump_updated_at();
create trigger bump_updated_at before update on public.training_plans
  for each row execute function public.bump_updated_at();
create trigger bump_updated_at before update on public.training_plan_exercises
  for each row execute function public.bump_updated_at();
```

- [ ] **Step 2: Create the setup README**

Create `supabase/README.md`:

````markdown
# Supabase setup

Manual one-time steps to enable cloud sync.

## 1. Create the project

1. Go to https://supabase.com and create a new project.
2. Wait for provisioning (~2 min).
3. Note the Project URL and the `anon` public key (Settings → API).

## 2. Run the schema migration

1. Open the SQL editor in the Supabase dashboard.
2. Copy the contents of `migrations/0001_initial_schema.sql` into a new query.
3. Run it. You should see 8 tables created with RLS enabled.

## 3. Update the app config

Edit `app.config.ts` `extra` block:

```ts
extra: {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',  // from Settings → API
  supabaseAnonKey: 'YOUR_ANON_KEY',                  // from Settings → API
  // ...
}
```

The anon key is safe to commit — it has no privileges beyond what RLS allows.

## 4. Verify

After running the app, sign up with a new account and create some data. In the Supabase dashboard, open the Table Editor — you should see your rows appearing.
````

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0001_initial_schema.sql supabase/README.md
git commit -m "feat: add supabase schema migration + setup docs"
```

---

### Task 2: Row serializers + tests

Pure functions converting WatermelonDB models into Supabase row payloads (model → snake_case row) and Supabase rows back into WatermelonDB raw records (row → raw with `_status: 'synced'`). One serializer + one deserializer per table.

**Files:**

- Create: `db/sync/serializers.ts`
- Create: `__tests__/unit/syncSerializers.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/unit/syncSerializers.test.ts`:

```typescript
import {
  bodyWeightEntryRowToRaw,
  foodEntryRowToRaw,
  serializeBodyWeightEntry,
  serializeFoodEntry,
  serializeWorkoutSession,
  workoutSessionRowToRaw,
} from '@/db/sync/serializers';

describe('serializeFoodEntry', () => {
  it('maps camelCase model fields to snake_case row', () => {
    const model = {
      id: 'fe1',
      date: '2026-05-14',
      mealType: 'breakfast',
      foodName: 'Oats',
      calories: 300,
      proteinG: 12,
      carbsG: 50,
      fatG: 6,
      quantity: 100,
      unit: 'g',
      source: 'manual',
      createdAt: new Date(1700000000000),
    };
    const row = serializeFoodEntry(model as never);
    expect(row).toEqual({
      id: 'fe1',
      date: '2026-05-14',
      meal_type: 'breakfast',
      food_name: 'Oats',
      calories: 300,
      protein_g: 12,
      carbs_g: 50,
      fat_g: 6,
      quantity: 100,
      unit: 'g',
      source: 'manual',
      created_at: 1700000000000,
    });
  });
});

describe('foodEntryRowToRaw', () => {
  it('strips cloud-only fields and marks status synced', () => {
    const row = {
      id: 'fe1',
      user_id: 'user-1',
      date: '2026-05-14',
      meal_type: 'breakfast',
      food_name: 'Oats',
      calories: 300,
      protein_g: 12,
      carbs_g: 50,
      fat_g: 6,
      quantity: 100,
      unit: 'g',
      source: 'manual',
      created_at: 1700000000000,
      updated_at: '2026-05-14T00:00:00Z',
      deleted_at: null,
    };
    expect(foodEntryRowToRaw(row)).toEqual({
      id: 'fe1',
      date: '2026-05-14',
      meal_type: 'breakfast',
      food_name: 'Oats',
      calories: 300,
      protein_g: 12,
      carbs_g: 50,
      fat_g: 6,
      quantity: 100,
      unit: 'g',
      source: 'manual',
      created_at: 1700000000000,
      _status: 'synced',
      _changed: '',
    });
  });
});

describe('serializeWorkoutSession', () => {
  it('preserves nullable fields', () => {
    const model = {
      id: 'ws1',
      date: '2026-05-14',
      name: 'Push day',
      notes: null,
      durationMin: null,
      planId: null,
      createdAt: new Date(1700000000000),
    };
    const row = serializeWorkoutSession(model as never);
    expect(row.notes).toBeNull();
    expect(row.duration_min).toBeNull();
    expect(row.plan_id).toBeNull();
  });
});

describe('workoutSessionRowToRaw', () => {
  it('handles null optional fields', () => {
    const row = {
      id: 'ws1',
      user_id: 'user-1',
      date: '2026-05-14',
      name: 'Push day',
      notes: null,
      duration_min: null,
      plan_id: null,
      created_at: 1700000000000,
      updated_at: '2026-05-14T00:00:00Z',
      deleted_at: null,
    };
    const raw = workoutSessionRowToRaw(row);
    expect(raw.notes).toBeNull();
    expect(raw.duration_min).toBeNull();
    expect(raw.plan_id).toBeNull();
    expect(raw._status).toBe('synced');
  });
});

describe('serializeBodyWeightEntry', () => {
  it('maps fields', () => {
    const model = {
      id: 'bw1',
      date: '2026-05-14',
      weightKg: 82.5,
      notes: 'feeling good',
      createdAt: new Date(1700000000000),
    };
    expect(serializeBodyWeightEntry(model as never)).toEqual({
      id: 'bw1',
      date: '2026-05-14',
      weight_kg: 82.5,
      notes: 'feeling good',
      created_at: 1700000000000,
    });
  });
});

describe('bodyWeightEntryRowToRaw', () => {
  it('produces raw with synced status', () => {
    const row = {
      id: 'bw1',
      user_id: 'user-1',
      date: '2026-05-14',
      weight_kg: 82.5,
      notes: null,
      created_at: 1700000000000,
      updated_at: '2026-05-14T00:00:00Z',
      deleted_at: null,
    };
    const raw = bodyWeightEntryRowToRaw(row);
    expect(raw.id).toBe('bw1');
    expect(raw.weight_kg).toBe(82.5);
    expect(raw._status).toBe('synced');
    expect(raw._changed).toBe('');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --no-watchman --forceExit __tests__/unit/syncSerializers.test.ts
```

Expected: FAIL — `Cannot find module '@/db/sync/serializers'`.

- [ ] **Step 3: Create the serializers**

Create `db/sync/serializers.ts`:

```typescript
import type { BodyWeightEntry } from '@/db/models/BodyWeightEntry';
import type { FoodEntry } from '@/db/models/FoodEntry';
import type { MealTemplate } from '@/db/models/MealTemplate';
import type { MealTemplateItem } from '@/db/models/MealTemplateItem';
import type { TrainingPlan } from '@/db/models/TrainingPlan';
import type { TrainingPlanExercise } from '@/db/models/TrainingPlanExercise';
import type { WorkoutSession } from '@/db/models/WorkoutSession';
import type { WorkoutSet } from '@/db/models/WorkoutSet';

type Raw = Record<string, unknown> & { _status: 'synced'; _changed: '' };
const SYNCED_RAW = { _status: 'synced' as const, _changed: '' as const };

// food_entries
export interface FoodEntryRow {
  id: string;
  date: string;
  meal_type: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  quantity: number;
  unit: string;
  source: string;
  created_at: number;
}

export function serializeFoodEntry(m: FoodEntry): FoodEntryRow {
  return {
    id: m.id,
    date: m.date,
    meal_type: m.mealType,
    food_name: m.foodName,
    calories: m.calories,
    protein_g: m.proteinG,
    carbs_g: m.carbsG,
    fat_g: m.fatG,
    quantity: m.quantity,
    unit: m.unit,
    source: m.source,
    created_at: m.createdAt.getTime(),
  };
}

export function foodEntryRowToRaw(row: Record<string, unknown>): Raw {
  return {
    id: row.id as string,
    date: row.date,
    meal_type: row.meal_type,
    food_name: row.food_name,
    calories: row.calories,
    protein_g: row.protein_g,
    carbs_g: row.carbs_g,
    fat_g: row.fat_g,
    quantity: row.quantity,
    unit: row.unit,
    source: row.source,
    created_at: row.created_at,
    ...SYNCED_RAW,
  };
}

// workout_sessions
export interface WorkoutSessionRow {
  id: string;
  date: string;
  name: string;
  notes: string | null;
  duration_min: number | null;
  plan_id: string | null;
  created_at: number;
}

export function serializeWorkoutSession(m: WorkoutSession): WorkoutSessionRow {
  return {
    id: m.id,
    date: m.date,
    name: m.name,
    notes: m.notes,
    duration_min: m.durationMin,
    plan_id: m.planId,
    created_at: m.createdAt.getTime(),
  };
}

export function workoutSessionRowToRaw(row: Record<string, unknown>): Raw {
  return {
    id: row.id as string,
    date: row.date,
    name: row.name,
    notes: row.notes,
    duration_min: row.duration_min,
    plan_id: row.plan_id,
    created_at: row.created_at,
    ...SYNCED_RAW,
  };
}

// workout_sets
export interface WorkoutSetRow {
  id: string;
  session_id: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  rpe: number | null;
  rest_seconds: number | null;
  created_at: number;
}

export function serializeWorkoutSet(m: WorkoutSet): WorkoutSetRow {
  return {
    id: m.id,
    session_id: m.sessionId,
    exercise_name: m.exerciseName,
    set_number: m.setNumber,
    reps: m.reps,
    weight_kg: m.weightKg,
    rpe: m.rpe,
    rest_seconds: m.restSeconds,
    created_at: m.createdAt.getTime(),
  };
}

export function workoutSetRowToRaw(row: Record<string, unknown>): Raw {
  return {
    id: row.id as string,
    session_id: row.session_id,
    exercise_name: row.exercise_name,
    set_number: row.set_number,
    reps: row.reps,
    weight_kg: row.weight_kg,
    rpe: row.rpe,
    rest_seconds: row.rest_seconds,
    created_at: row.created_at,
    ...SYNCED_RAW,
  };
}

// body_weight_entries
export interface BodyWeightEntryRow {
  id: string;
  date: string;
  weight_kg: number;
  notes: string | null;
  created_at: number;
}

export function serializeBodyWeightEntry(m: BodyWeightEntry): BodyWeightEntryRow {
  return {
    id: m.id,
    date: m.date,
    weight_kg: m.weightKg,
    notes: m.notes,
    created_at: m.createdAt.getTime(),
  };
}

export function bodyWeightEntryRowToRaw(row: Record<string, unknown>): Raw {
  return {
    id: row.id as string,
    date: row.date,
    weight_kg: row.weight_kg,
    notes: row.notes,
    created_at: row.created_at,
    ...SYNCED_RAW,
  };
}

// meal_templates
export interface MealTemplateRow {
  id: string;
  name: string;
  created_at: number;
}

export function serializeMealTemplate(m: MealTemplate): MealTemplateRow {
  return { id: m.id, name: m.name, created_at: m.createdAt.getTime() };
}

export function mealTemplateRowToRaw(row: Record<string, unknown>): Raw {
  return {
    id: row.id as string,
    name: row.name,
    created_at: row.created_at,
    ...SYNCED_RAW,
  };
}

// meal_template_items
export interface MealTemplateItemRow {
  id: string;
  meal_template_id: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  quantity: number;
  unit: string;
  created_at: number;
}

export function serializeMealTemplateItem(m: MealTemplateItem): MealTemplateItemRow {
  return {
    id: m.id,
    meal_template_id: m.mealTemplateId,
    food_name: m.foodName,
    calories: m.calories,
    protein_g: m.proteinG,
    carbs_g: m.carbsG,
    fat_g: m.fatG,
    quantity: m.quantity,
    unit: m.unit,
    created_at: m.createdAt.getTime(),
  };
}

export function mealTemplateItemRowToRaw(row: Record<string, unknown>): Raw {
  return {
    id: row.id as string,
    meal_template_id: row.meal_template_id,
    food_name: row.food_name,
    calories: row.calories,
    protein_g: row.protein_g,
    carbs_g: row.carbs_g,
    fat_g: row.fat_g,
    quantity: row.quantity,
    unit: row.unit,
    created_at: row.created_at,
    ...SYNCED_RAW,
  };
}

// training_plans
export interface TrainingPlanRow {
  id: string;
  name: string;
  created_at: number;
}

export function serializeTrainingPlan(m: TrainingPlan): TrainingPlanRow {
  return { id: m.id, name: m.name, created_at: m.createdAt.getTime() };
}

export function trainingPlanRowToRaw(row: Record<string, unknown>): Raw {
  return {
    id: row.id as string,
    name: row.name,
    created_at: row.created_at,
    ...SYNCED_RAW,
  };
}

// training_plan_exercises
export interface TrainingPlanExerciseRow {
  id: string;
  plan_id: string;
  day: string;
  exercise_name: string;
  target_sets: number;
  target_reps: number;
  target_weight_kg: number;
  order_index: number;
  created_at: number;
}

export function serializeTrainingPlanExercise(m: TrainingPlanExercise): TrainingPlanExerciseRow {
  return {
    id: m.id,
    plan_id: m.planId,
    day: m.day,
    exercise_name: m.exerciseName,
    target_sets: m.targetSets,
    target_reps: m.targetReps,
    target_weight_kg: m.targetWeightKg,
    order_index: m.orderIndex,
    created_at: m.createdAt.getTime(),
  };
}

export function trainingPlanExerciseRowToRaw(row: Record<string, unknown>): Raw {
  return {
    id: row.id as string,
    plan_id: row.plan_id,
    day: row.day,
    exercise_name: row.exercise_name,
    target_sets: row.target_sets,
    target_reps: row.target_reps,
    target_weight_kg: row.target_weight_kg,
    order_index: row.order_index,
    created_at: row.created_at,
    ...SYNCED_RAW,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --no-watchman --forceExit __tests__/unit/syncSerializers.test.ts
```

Expected: PASS — all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add db/sync/serializers.ts __tests__/unit/syncSerializers.test.ts
git commit -m "feat: add cloud sync row serializers"
```

---

### Task 3: Cloud sync lib + tests

Pure async wrappers around `supabase.from(...)` for upsert, soft-delete (sets `deleted_at`), and fetch-by-user (only non-deleted rows). Errors are returned, not thrown — the caller decides how to handle them.

**Files:**

- Create: `lib/cloudSync.ts`
- Create: `__tests__/unit/cloudSync.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/unit/cloudSync.test.ts`:

```typescript
import { fetchAllRows, softDeleteRow, upsertRow } from '@/lib/cloudSync';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const mockedFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;

beforeEach(() => {
  mockedFrom.mockReset();
});

describe('upsertRow', () => {
  it('calls supabase.from(table).upsert with user_id added', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedFrom.mockReturnValue({ upsert: mockUpsert } as any);

    await upsertRow('food_entries', { id: 'fe1', date: '2026-05-14' }, 'user-1');

    expect(mockedFrom).toHaveBeenCalledWith('food_entries');
    expect(mockUpsert).toHaveBeenCalledWith({
      id: 'fe1',
      date: '2026-05-14',
      user_id: 'user-1',
    });
  });
});

describe('softDeleteRow', () => {
  it('updates the row setting deleted_at, filtered by id', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn(() => ({ eq: mockEq }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedFrom.mockReturnValue({ update: mockUpdate } as any);

    await softDeleteRow('food_entries', 'fe1');

    expect(mockedFrom).toHaveBeenCalledWith('food_entries');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) }),
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'fe1');
  });
});

describe('fetchAllRows', () => {
  it('returns rows for user where deleted_at is null', async () => {
    const mockIs = jest.fn().mockResolvedValue({ data: [{ id: 'row1' }], error: null });
    const mockEq = jest.fn(() => ({ is: mockIs }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedFrom.mockReturnValue({ select: mockSelect } as any);

    const rows = await fetchAllRows('food_entries', 'user-1');

    expect(mockedFrom).toHaveBeenCalledWith('food_entries');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
    expect(rows).toEqual([{ id: 'row1' }]);
  });

  it('returns empty array on error', async () => {
    const mockIs = jest.fn().mockResolvedValue({ data: null, error: { message: 'boom' } });
    const mockEq = jest.fn(() => ({ is: mockIs }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedFrom.mockReturnValue({ select: mockSelect } as any);

    const rows = await fetchAllRows('food_entries', 'user-1');
    expect(rows).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --no-watchman --forceExit __tests__/unit/cloudSync.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/cloudSync'`.

- [ ] **Step 3: Implement cloudSync**

Create `lib/cloudSync.ts`:

```typescript
import { supabase } from '@/lib/supabase';

export async function upsertRow(
  table: string,
  row: Record<string, unknown>,
  userId: string,
): Promise<{ error: unknown }> {
  const { error } = await supabase.from(table).upsert({ ...row, user_id: userId });
  return { error };
}

export async function softDeleteRow(table: string, id: string): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  return { error };
}

export async function fetchAllRows(
  table: string,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null);
  if (error) return [];
  return (data as Record<string, unknown>[] | null) ?? [];
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --no-watchman --forceExit __tests__/unit/cloudSync.test.ts
```

Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/cloudSync.ts __tests__/unit/cloudSync.test.ts
git commit -m "feat: add cloud sync supabase wrappers"
```

---

### Task 4: Sync orchestrator (syncStore) + tests

Glue between stores and `cloudSync`. Reads `session` from `authStore` and `syncEnabled` from `settingsStore`; if either is missing, sync is a no-op. All calls are fire-and-forget: errors are caught and logged, never thrown. Also exposes `restoreAll()` for the restore flow.

**Files:**

- Create: `store/syncStore.ts`
- Create: `__tests__/unit/syncStore.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/unit/syncStore.test.ts`:

```typescript
import { fetchAllRows, softDeleteRow, upsertRow } from '@/lib/cloudSync';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { restoreAll, syncDelete, syncUpsert } from '@/store/syncStore';

jest.mock('@/lib/cloudSync', () => ({
  upsertRow: jest.fn().mockResolvedValue({ error: null }),
  softDeleteRow: jest.fn().mockResolvedValue({ error: null }),
  fetchAllRows: jest.fn().mockResolvedValue([]),
}));

const mockUpsert = upsertRow as jest.MockedFunction<typeof upsertRow>;
const mockSoftDelete = softDeleteRow as jest.MockedFunction<typeof softDeleteRow>;
const mockFetchAll = fetchAllRows as jest.MockedFunction<typeof fetchAllRows>;

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ session: null, isLoading: false });
  useSettingsStore.setState({ syncEnabled: true });
});

describe('syncUpsert', () => {
  it('is a no-op when there is no session', async () => {
    syncUpsert('food_entries', { id: 'fe1' });
    await new Promise(r => setImmediate(r));
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('is a no-op when syncEnabled is false', async () => {
    useAuthStore.setState({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session: { user: { id: 'user-1' } } as any,
      isLoading: false,
    });
    useSettingsStore.setState({ syncEnabled: false });
    syncUpsert('food_entries', { id: 'fe1' });
    await new Promise(r => setImmediate(r));
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('calls upsertRow with table, row, and userId when session+sync ok', async () => {
    useAuthStore.setState({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session: { user: { id: 'user-1' } } as any,
      isLoading: false,
    });
    syncUpsert('food_entries', { id: 'fe1', date: '2026-05-14' });
    await new Promise(r => setImmediate(r));
    expect(mockUpsert).toHaveBeenCalledWith(
      'food_entries',
      { id: 'fe1', date: '2026-05-14' },
      'user-1',
    );
  });

  it('swallows errors from upsertRow', async () => {
    useAuthStore.setState({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session: { user: { id: 'user-1' } } as any,
      isLoading: false,
    });
    mockUpsert.mockRejectedValueOnce(new Error('boom'));
    expect(() => syncUpsert('food_entries', { id: 'fe1' })).not.toThrow();
    await new Promise(r => setImmediate(r));
  });
});

describe('syncDelete', () => {
  it('calls softDeleteRow when session+sync ok', async () => {
    useAuthStore.setState({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session: { user: { id: 'user-1' } } as any,
      isLoading: false,
    });
    syncDelete('food_entries', 'fe1');
    await new Promise(r => setImmediate(r));
    expect(mockSoftDelete).toHaveBeenCalledWith('food_entries', 'fe1');
  });

  it('is a no-op when no session', async () => {
    syncDelete('food_entries', 'fe1');
    await new Promise(r => setImmediate(r));
    expect(mockSoftDelete).not.toHaveBeenCalled();
  });
});

describe('restoreAll', () => {
  it('returns 0 restoredCount when no session', async () => {
    const result = await restoreAll();
    expect(result.restoredCount).toBe(0);
    expect(mockFetchAll).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --no-watchman --forceExit __tests__/unit/syncStore.test.ts
```

Expected: FAIL — `Cannot find module '@/store/syncStore'`.

- [ ] **Step 3: Implement syncStore**

Create `store/syncStore.ts`:

```typescript
import { database } from '@/db/database';
import {
  bodyWeightEntryRowToRaw,
  foodEntryRowToRaw,
  mealTemplateItemRowToRaw,
  mealTemplateRowToRaw,
  trainingPlanExerciseRowToRaw,
  trainingPlanRowToRaw,
  workoutSessionRowToRaw,
  workoutSetRowToRaw,
} from '@/db/sync/serializers';
import { fetchAllRows, softDeleteRow, upsertRow } from '@/lib/cloudSync';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';

const ROW_TO_RAW: Record<string, (row: Record<string, unknown>) => Record<string, unknown>> = {
  food_entries: foodEntryRowToRaw,
  workout_sessions: workoutSessionRowToRaw,
  workout_sets: workoutSetRowToRaw,
  body_weight_entries: bodyWeightEntryRowToRaw,
  meal_templates: mealTemplateRowToRaw,
  meal_template_items: mealTemplateItemRowToRaw,
  training_plans: trainingPlanRowToRaw,
  training_plan_exercises: trainingPlanExerciseRowToRaw,
};

const SYNC_TABLES = Object.keys(ROW_TO_RAW);

function readyUserId(): string | null {
  const session = useAuthStore.getState().session;
  const syncEnabled = useSettingsStore.getState().syncEnabled;
  if (!session || !syncEnabled) return null;
  return session.user.id;
}

export function syncUpsert(table: string, row: Record<string, unknown>): void {
  const userId = readyUserId();
  if (!userId) return;
  upsertRow(table, row, userId).catch(e => {
    console.warn(`[sync] upsert ${table} failed`, e);
  });
}

export function syncDelete(table: string, id: string): void {
  const userId = readyUserId();
  if (!userId) return;
  softDeleteRow(table, id).catch(e => {
    console.warn(`[sync] delete ${table} failed`, e);
  });
}

export async function restoreAll(): Promise<{ restoredCount: number }> {
  const session = useAuthStore.getState().session;
  if (!session) return { restoredCount: 0 };
  const userId = session.user.id;

  let total = 0;
  await database.write(async () => {
    for (const table of SYNC_TABLES) {
      const rows = await fetchAllRows(table, userId);
      if (rows.length === 0) continue;
      const toRaw = ROW_TO_RAW[table];
      if (!toRaw) continue;
      const collection = database.collections.get(table);
      const records = rows.map(row =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (collection as any).prepareCreateFromDirtyRaw(toRaw(row)),
      );
      await database.batch(...records);
      total += records.length;
    }
  });
  return { restoredCount: total };
}

export async function isLocalDatabaseEmpty(): Promise<boolean> {
  for (const table of SYNC_TABLES) {
    const count = await database.collections.get(table).query().fetchCount();
    if (count > 0) return false;
  }
  return true;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --no-watchman --forceExit __tests__/unit/syncStore.test.ts
```

Expected: PASS — 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add store/syncStore.ts __tests__/unit/syncStore.test.ts
git commit -m "feat: add sync orchestrator (syncStore)"
```

---

### Task 5: Wire sync into foodStore + mealTemplateStore

After every successful local write, capture the model/id and call `syncUpsert` or `syncDelete`. Existing error handling stays untouched — sync is fire-and-forget after the local commit.

**Files:**

- Modify: `store/foodStore.ts`
- Modify: `store/mealTemplateStore.ts`

- [ ] **Step 1: Update foodStore.ts**

Replace `store/foodStore.ts` with:

```typescript
import { database } from '@/db/database';
import type { FoodEntry } from '@/db/models/FoodEntry';
import { serializeFoodEntry } from '@/db/sync/serializers';

import { syncDelete, syncUpsert } from './syncStore';
import { useToastStore } from './toastStore';

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
    let created: FoodEntry | undefined;
    await database.write(async () => {
      created = await database.collections.get<FoodEntry>('food_entries').create(r => {
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
    if (created) syncUpsert('food_entries', serializeFoodEntry(created));
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
    syncDelete('food_entries', id);
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
    let srcName: string;
    let created: FoodEntry | undefined;
    await database.write(async () => {
      const src = await database.collections.get<FoodEntry>('food_entries').find(sourceEntryId);
      srcName = src.foodName;
      created = await database.collections.get<FoodEntry>('food_entries').create(r => {
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
    if (created) syncUpsert('food_entries', serializeFoodEntry(created));
    useToastStore.getState().showToast(`Logged ${srcName!}`);
  } catch (e) {
    console.error('foodStore.relogEntry failed', e);
    useToastStore.getState().showToast("Couldn't re-log entry", 'error');
  }
}
```

- [ ] **Step 2: Update mealTemplateStore.ts**

Replace `store/mealTemplateStore.ts` with:

```typescript
import { Q } from '@nozbe/watermelondb';

import { database } from '@/db/database';
import type { MealTemplate } from '@/db/models/MealTemplate';
import type { MealTemplateItem } from '@/db/models/MealTemplateItem';
import { serializeMealTemplate, serializeMealTemplateItem } from '@/db/sync/serializers';

import { addEntry } from './foodStore';
import { syncDelete, syncUpsert } from './syncStore';
import { useToastStore } from './toastStore';

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
    let tmpl: MealTemplate | undefined;
    const createdItems: MealTemplateItem[] = [];
    await database.write(async () => {
      tmpl = await database.collections.get<MealTemplate>('meal_templates').create(r => {
        r.name = name;
      });
      for (const item of items) {
        const created = await database.collections
          .get<MealTemplateItem>('meal_template_items')
          .create(r => {
            r.mealTemplateId = tmpl!.id;
            r.foodName = item.foodName;
            r.calories = item.calories;
            r.proteinG = item.proteinG;
            r.carbsG = item.carbsG;
            r.fatG = item.fatG;
            r.quantity = item.quantity;
            r.unit = item.unit;
          });
        createdItems.push(created);
      }
    });
    if (tmpl) syncUpsert('meal_templates', serializeMealTemplate(tmpl));
    for (const item of createdItems) {
      syncUpsert('meal_template_items', serializeMealTemplateItem(item));
    }
  } catch (e) {
    console.error('mealTemplateStore.createTemplate failed', e);
    useToastStore.getState().showToast("Couldn't save meal template", 'error');
  }
}

export async function deleteTemplate(templateId: string): Promise<void> {
  try {
    let itemIds: string[] = [];
    await database.write(async () => {
      const items = await database.collections
        .get<MealTemplateItem>('meal_template_items')
        .query(Q.where('meal_template_id', templateId))
        .fetch();
      itemIds = items.map(i => i.id);
      for (const item of items) await item.destroyPermanently();
      const tmpl = await database.collections.get<MealTemplate>('meal_templates').find(templateId);
      await tmpl.destroyPermanently();
    });
    for (const id of itemIds) syncDelete('meal_template_items', id);
    syncDelete('meal_templates', templateId);
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
    useToastStore.getState().showToast(`Logged ${tmpl.name}`);
  } catch (e) {
    console.error('mealTemplateStore.logTemplate failed', e);
    useToastStore.getState().showToast("Couldn't log meal template", 'error');
  }
}
```

- [ ] **Step 3: Run typecheck, lint, and tests**

```bash
npm run typecheck && npm run lint
npm test -- --no-watchman --forceExit
```

Expected: no errors, all tests pass. Existing store tests still pass because `syncUpsert`/`syncDelete` are no-ops without a session.

- [ ] **Step 4: Commit**

```bash
git add store/foodStore.ts store/mealTemplateStore.ts
git commit -m "feat: wire cloud sync into food + meal template stores"
```

---

### Task 6: Wire sync into workoutStore + bodyWeightStore

Same pattern as Task 5. `deleteSession` cascades to sets — sync each.

**Files:**

- Modify: `store/workoutStore.ts`
- Modify: `store/bodyWeightStore.ts`

- [ ] **Step 1: Update workoutStore.ts**

Replace `store/workoutStore.ts` with:

```typescript
import { database } from '@/db/database';
import type { WorkoutSession } from '@/db/models/WorkoutSession';
import type { WorkoutSet } from '@/db/models/WorkoutSet';
import { serializeWorkoutSession, serializeWorkoutSet } from '@/db/sync/serializers';

import { syncDelete, syncUpsert } from './syncStore';
import { useToastStore } from './toastStore';

export async function createSession(input: {
  date: string;
  name: string;
  notes?: string;
}): Promise<string> {
  try {
    let id = '';
    let created: WorkoutSession | undefined;
    await database.write(async () => {
      created = await database.collections.get<WorkoutSession>('workout_sessions').create(r => {
        r.date = input.date;
        r.name = input.name;
        r.notes = input.notes ?? null;
        r.durationMin = null;
        r.planId = null;
      });
      id = created.id;
    });
    if (created) syncUpsert('workout_sessions', serializeWorkoutSession(created));
    return id;
  } catch (e) {
    console.error('workoutStore.createSession failed', e);
    useToastStore.getState().showToast("Couldn't create workout", 'error');
    throw e;
  }
}

export async function updateSession(
  id: string,
  input: { name?: string; notes?: string; durationMin?: number | null },
): Promise<void> {
  try {
    let updated: WorkoutSession | undefined;
    await database.write(async () => {
      const session = await database.collections.get<WorkoutSession>('workout_sessions').find(id);
      updated = await session.update(r => {
        if (input.name !== undefined) r.name = input.name;
        if (input.notes !== undefined) r.notes = input.notes;
        if (input.durationMin !== undefined) r.durationMin = input.durationMin;
      });
    });
    if (updated) syncUpsert('workout_sessions', serializeWorkoutSession(updated));
  } catch (e) {
    console.error('workoutStore.updateSession failed', e);
    useToastStore.getState().showToast("Couldn't update workout", 'error');
  }
}

export async function deleteSession(id: string): Promise<void> {
  try {
    let setIds: string[] = [];
    await database.write(async () => {
      const session = await database.collections.get<WorkoutSession>('workout_sessions').find(id);
      const sets = await database.collections.get<WorkoutSet>('workout_sets').query().fetch();
      const sessionSets = sets.filter(s => s.sessionId === id);
      setIds = sessionSets.map(s => s.id);
      for (const s of sessionSets) await s.destroyPermanently();
      await session.destroyPermanently();
    });
    for (const setId of setIds) syncDelete('workout_sets', setId);
    syncDelete('workout_sessions', id);
  } catch (e) {
    console.error('workoutStore.deleteSession failed', e);
    useToastStore.getState().showToast("Couldn't delete workout", 'error');
  }
}

export async function addSet(input: {
  sessionId: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe?: number;
}): Promise<void> {
  try {
    let created: WorkoutSet | undefined;
    await database.write(async () => {
      created = await database.collections.get<WorkoutSet>('workout_sets').create(r => {
        r.sessionId = input.sessionId;
        r.exerciseName = input.exerciseName;
        r.setNumber = input.setNumber;
        r.reps = input.reps;
        r.weightKg = input.weightKg;
        r.rpe = input.rpe ?? null;
      });
    });
    if (created) syncUpsert('workout_sets', serializeWorkoutSet(created));
  } catch (e) {
    console.error('workoutStore.addSet failed', e);
    useToastStore.getState().showToast("Couldn't save set", 'error');
    throw e;
  }
}

export async function deleteSet(id: string): Promise<void> {
  try {
    await database.write(async () => {
      const set = await database.collections.get<WorkoutSet>('workout_sets').find(id);
      await set.destroyPermanently();
    });
    syncDelete('workout_sets', id);
  } catch (e) {
    console.error('workoutStore.deleteSet failed', e);
    useToastStore.getState().showToast("Couldn't delete set", 'error');
  }
}
```

- [ ] **Step 2: Update bodyWeightStore.ts**

Replace `store/bodyWeightStore.ts` with:

```typescript
import { database } from '@/db/database';
import type { BodyWeightEntry } from '@/db/models/BodyWeightEntry';
import { serializeBodyWeightEntry } from '@/db/sync/serializers';

import { syncDelete, syncUpsert } from './syncStore';
import { useToastStore } from './toastStore';

export async function logWeight(
  date: string,
  weightKg: number,
  notes: string | null,
): Promise<void> {
  try {
    let created: BodyWeightEntry | undefined;
    await database.write(async () => {
      created = await database.collections.get<BodyWeightEntry>('body_weight_entries').create(r => {
        r.date = date;
        r.weightKg = weightKg;
        r.notes = notes;
      });
    });
    if (created) syncUpsert('body_weight_entries', serializeBodyWeightEntry(created));
  } catch (e) {
    console.error('bodyWeightStore.logWeight failed', e);
    useToastStore.getState().showToast("Couldn't save weight", 'error');
    throw e;
  }
}

export async function deleteWeightEntry(id: string): Promise<void> {
  try {
    await database.write(async () => {
      const entry = await database.collections.get<BodyWeightEntry>('body_weight_entries').find(id);
      await entry.destroyPermanently();
    });
    syncDelete('body_weight_entries', id);
  } catch (e) {
    console.error('bodyWeightStore.deleteWeightEntry failed', e);
    useToastStore.getState().showToast("Couldn't delete entry", 'error');
  }
}
```

- [ ] **Step 3: Run typecheck, lint, and tests**

```bash
npm run typecheck && npm run lint
npm test -- --no-watchman --forceExit
```

Expected: no errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add store/workoutStore.ts store/bodyWeightStore.ts
git commit -m "feat: wire cloud sync into workout + body weight stores"
```

---

### Task 7: Wire sync into trainingPlanStore

`launchSessionFromPlan` creates a session AND many sets — sync each. `deletePlan` cascades to exercises — sync each.

**Files:**

- Modify: `store/trainingPlanStore.ts`

- [ ] **Step 1: Update trainingPlanStore.ts**

Replace `store/trainingPlanStore.ts` with:

```typescript
import { Q } from '@nozbe/watermelondb';

import { database } from '@/db/database';
import type { TrainingPlan } from '@/db/models/TrainingPlan';
import type { TrainingPlanExercise } from '@/db/models/TrainingPlanExercise';
import type { WorkoutSession } from '@/db/models/WorkoutSession';
import type { WorkoutSet } from '@/db/models/WorkoutSet';
import {
  serializeTrainingPlan,
  serializeTrainingPlanExercise,
  serializeWorkoutSession,
  serializeWorkoutSet,
} from '@/db/sync/serializers';

import { syncDelete, syncUpsert } from './syncStore';
import { useToastStore } from './toastStore';

export async function createPlan(name: string): Promise<string> {
  try {
    let id = '';
    let created: TrainingPlan | undefined;
    await database.write(async () => {
      created = await database.collections.get<TrainingPlan>('training_plans').create(r => {
        r.name = name;
      });
      id = created.id;
    });
    if (created) syncUpsert('training_plans', serializeTrainingPlan(created));
    return id;
  } catch (e) {
    console.error('trainingPlanStore.createPlan failed', e);
    useToastStore.getState().showToast("Couldn't create plan", 'error');
    throw e;
  }
}

export async function deletePlan(id: string): Promise<void> {
  try {
    let exerciseIds: string[] = [];
    await database.write(async () => {
      const exercises = await database.collections
        .get<TrainingPlanExercise>('training_plan_exercises')
        .query(Q.where('plan_id', id))
        .fetch();
      exerciseIds = exercises.map(e => e.id);
      for (const ex of exercises) await ex.destroyPermanently();
      const plan = await database.collections.get<TrainingPlan>('training_plans').find(id);
      await plan.destroyPermanently();
    });
    for (const exId of exerciseIds) syncDelete('training_plan_exercises', exId);
    syncDelete('training_plans', id);
  } catch (e) {
    console.error('trainingPlanStore.deletePlan failed', e);
    useToastStore.getState().showToast("Couldn't delete plan", 'error');
  }
}

export async function addExerciseToPlan(input: {
  planId: string;
  day: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  targetWeightKg: number;
  orderIndex: number;
}): Promise<void> {
  try {
    let created: TrainingPlanExercise | undefined;
    await database.write(async () => {
      created = await database.collections
        .get<TrainingPlanExercise>('training_plan_exercises')
        .create(r => {
          r.planId = input.planId;
          r.day = input.day;
          r.exerciseName = input.exerciseName;
          r.targetSets = input.targetSets;
          r.targetReps = input.targetReps;
          r.targetWeightKg = input.targetWeightKg;
          r.orderIndex = input.orderIndex;
        });
    });
    if (created) syncUpsert('training_plan_exercises', serializeTrainingPlanExercise(created));
  } catch (e) {
    console.error('trainingPlanStore.addExerciseToPlan failed', e);
    useToastStore.getState().showToast("Couldn't add exercise", 'error');
    throw e;
  }
}

export async function deletePlanExercise(id: string): Promise<void> {
  try {
    await database.write(async () => {
      const ex = await database.collections
        .get<TrainingPlanExercise>('training_plan_exercises')
        .find(id);
      await ex.destroyPermanently();
    });
    syncDelete('training_plan_exercises', id);
  } catch (e) {
    console.error('trainingPlanStore.deletePlanExercise failed', e);
    useToastStore.getState().showToast("Couldn't delete exercise", 'error');
  }
}

export async function launchSessionFromPlan(
  planId: string,
  day: string,
  sessionDate: string,
): Promise<string> {
  try {
    let sessionId = '';
    let createdSession: WorkoutSession | undefined;
    const createdSets: WorkoutSet[] = [];
    await database.write(async () => {
      const plan = await database.collections.get<TrainingPlan>('training_plans').find(planId);
      const exercises = await database.collections
        .get<TrainingPlanExercise>('training_plan_exercises')
        .query(Q.where('plan_id', planId), Q.where('day', day), Q.sortBy('order_index', Q.asc))
        .fetch();

      createdSession = await database.collections
        .get<WorkoutSession>('workout_sessions')
        .create(r => {
          r.date = sessionDate;
          r.name = `${plan.name} — ${day}`;
          r.notes = null;
          r.durationMin = null;
          r.planId = planId;
        });
      sessionId = createdSession.id;

      for (const ex of exercises) {
        for (let i = 0; i < ex.targetSets; i++) {
          const set = await database.collections.get<WorkoutSet>('workout_sets').create(r => {
            r.sessionId = createdSession!.id;
            r.exerciseName = ex.exerciseName;
            r.setNumber = i + 1;
            r.reps = ex.targetReps;
            r.weightKg = ex.targetWeightKg;
            r.rpe = null;
          });
          createdSets.push(set);
        }
      }
    });
    if (createdSession) syncUpsert('workout_sessions', serializeWorkoutSession(createdSession));
    for (const set of createdSets) {
      syncUpsert('workout_sets', serializeWorkoutSet(set));
    }
    return sessionId;
  } catch (e) {
    console.error('trainingPlanStore.launchSessionFromPlan failed', e);
    useToastStore.getState().showToast("Couldn't launch session", 'error');
    throw e;
  }
}
```

- [ ] **Step 2: Run typecheck, lint, and tests**

```bash
npm run typecheck && npm run lint
npm test -- --no-watchman --forceExit
```

Expected: no errors, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add store/trainingPlanStore.ts
git commit -m "feat: wire cloud sync into training plan store"
```

---

### Task 8: Auto-restore on first sign-in to empty DB

After a user signs in, if the local WatermelonDB is empty, call `restoreAll()` once. Uses a ref in `(protected)/_layout.tsx` so it only runs once per session. Skipped under `EXPO_PUBLIC_SKIP_AUTH`.

**Files:**

- Modify: `app/(protected)/_layout.tsx`

- [ ] **Step 1: Update protected layout**

Replace `app/(protected)/_layout.tsx` with:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { useAuthStore } from '@/store/authStore';
import { isLocalDatabaseEmpty, restoreAll } from '@/store/syncStore';

export default function ProtectedLayout() {
  const session = useAuthStore(s => s.session);
  const isLoading = useAuthStore(s => s.isLoading);
  const skipAuth = process.env.EXPO_PUBLIC_SKIP_AUTH === 'true';

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const restoreAttempted = useRef(false);

  useEffect(() => {
    if (skipAuth) return;
    AsyncStorage.getItem('onboardingComplete').then(val => {
      setOnboardingComplete(val === 'true');
      setOnboardingChecked(true);
    });
  }, [skipAuth]);

  useEffect(() => {
    if (skipAuth) return;
    if (!session) {
      restoreAttempted.current = false;
      return;
    }
    if (restoreAttempted.current) return;
    restoreAttempted.current = true;
    (async () => {
      try {
        const empty = await isLocalDatabaseEmpty();
        if (empty) await restoreAll();
      } catch (e) {
        console.warn('[sync] restore on sign-in failed', e);
      }
    })();
  }, [session, skipAuth]);

  if (skipAuth) {
    return (
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="session/new"
          options={{ title: 'New workout', presentation: 'modal' }}
        />
        <Stack.Screen name="session/[id]" options={{ title: 'Workout' }} />
        <Stack.Screen name="plan/new" options={{ title: 'New plan', presentation: 'modal' }} />
        <Stack.Screen name="plan/[id]" options={{ title: 'Plan' }} />
        <Stack.Screen
          name="food/search"
          options={{ title: 'Search food', presentation: 'modal' }}
        />
        <Stack.Screen name="food/add" options={{ title: 'Add food', presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
      </Stack>
    );
  }

  if (isLoading || !onboardingChecked) return null;
  if (!session) return <Redirect href="/(auth)/welcome" />;
  if (!onboardingComplete) return <Redirect href="/(onboarding)/goal" />;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="session/new" options={{ title: 'New workout', presentation: 'modal' }} />
      <Stack.Screen name="session/[id]" options={{ title: 'Workout' }} />
      <Stack.Screen name="plan/new" options={{ title: 'New plan', presentation: 'modal' }} />
      <Stack.Screen name="plan/[id]" options={{ title: 'Plan' }} />
      <Stack.Screen name="food/search" options={{ title: 'Search food', presentation: 'modal' }} />
      <Stack.Screen name="food/add" options={{ title: 'Add food', presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
    </Stack>
  );
}
```

- [ ] **Step 2: Run typecheck, lint, and tests**

```bash
npm run typecheck && npm run lint
npm test -- --no-watchman --forceExit
```

Expected: no errors. ProtectedLayout tests still pass (they mock the layout's effects via Redirect, syncStore restore is a no-op without a real DB).

- [ ] **Step 3: Commit**

```bash
git add app/(protected)/_layout.tsx
git commit -m "feat: auto-restore from cloud on first sign-in to empty DB"
```

---

### Task 9: Manual restore button in settings UI

Add a "Restore from cloud" row inside the Data & Privacy card on the settings screen. Disabled while restoring. Toast on success/failure.

**Files:**

- Modify: `app/(protected)/settings.tsx`
- Modify: `__tests__/integration/ui/SettingsScreen.test.tsx`

- [ ] **Step 1: Write failing test**

Add to `__tests__/integration/ui/SettingsScreen.test.tsx`. First, add a mock for syncStore at the top of the file (just after the existing jest.mock calls):

```typescript
jest.mock('@/store/syncStore', () => ({
  restoreAll: jest.fn().mockResolvedValue({ restoredCount: 12 }),
  syncUpsert: jest.fn(),
  syncDelete: jest.fn(),
  isLocalDatabaseEmpty: jest.fn(),
}));
```

Then add a new test inside the existing `describe('SettingsScreen', ...)` block:

```typescript
it('calls restoreAll and shows toast when Restore from cloud pressed', async () => {
  render(<SettingsScreen />);
  fireEvent.press(screen.getByLabelText('Restore from cloud'));
  await new Promise(r => setImmediate(r));
  expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('Restored 12'));
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- --no-watchman --forceExit __tests__/integration/ui/SettingsScreen.test.tsx
```

Expected: FAIL — `Unable to find an element with text: Restore from cloud`.

- [ ] **Step 3: Update settings.tsx**

In `app/(protected)/settings.tsx`:

1. Add import at the top with other store imports:

```typescript
import { restoreAll } from '@/store/syncStore';
```

2. Inside `SettingsScreen()` after the other `useState` calls, add:

```typescript
const [restoring, setRestoring] = useState(false);
```

3. Add a handler function alongside the other handlers:

```typescript
async function handleRestore() {
  if (restoring) return;
  setRestoring(true);
  try {
    const { restoredCount } = await restoreAll();
    showToast(`Restored ${restoredCount} records from cloud`);
  } catch {
    showToast("Couldn't restore from cloud", 'error');
  } finally {
    setRestoring(false);
  }
}
```

4. In the Data & Privacy card JSX, after the `<View style={s.row}>...Sync my data...</View>`, add:

```typescript
<RowSeparator />
<Pressable
  style={s.row}
  onPress={handleRestore}
  disabled={restoring}
  accessibilityLabel="Restore from cloud"
  accessibilityRole="button"
  accessibilityState={{ disabled: restoring }}
>
  <Text style={s.rowLabel}>{restoring ? 'Restoring…' : 'Restore from cloud'}</Text>
</Pressable>
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --no-watchman --forceExit __tests__/integration/ui/SettingsScreen.test.tsx
```

Expected: PASS — all tests including the new restore test pass.

- [ ] **Step 5: Run lint + typecheck**

```bash
npm run typecheck && npm run lint
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/(protected)/settings.tsx __tests__/integration/ui/SettingsScreen.test.tsx
git commit -m "feat: add Restore from cloud button to settings"
```

---

### Task 10: Sign-up consent text

Add ToS + Privacy Policy acknowledgement text above the Create account button on `sign-up.tsx`. Since the spec calls for consent, and writing actual ToS/Privacy docs is out of scope here, the text is a one-line informational notice with placeholder links — the user can wire them to real URLs later.

**Files:**

- Modify: `app/(auth)/sign-up.tsx`

- [ ] **Step 1: Update sign-up.tsx**

In `app/(auth)/sign-up.tsx`, add a consent text element right before the "Create account" `TouchableOpacity` (the primary button). Insert:

```typescript
<Text style={styles.consent} accessibilityLabel="Consent notice">
  By creating an account you agree to our Terms of Service and Privacy Policy, including syncing your data to our servers.
</Text>
```

Add the `consent` style to the `StyleSheet.create` block, alongside `link`:

```typescript
consent: { fontSize: 12, color: '#666', lineHeight: 18, marginTop: 4 },
```

- [ ] **Step 2: Run tests to verify they still pass**

```bash
npm test -- --no-watchman --forceExit __tests__/integration/ui/SignUpScreen.test.tsx
```

Expected: PASS — no behavior change, only an added Text node.

- [ ] **Step 3: Run lint + typecheck**

```bash
npm run typecheck && npm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/sign-up.tsx
git commit -m "feat: add ToS/privacy consent notice on sign-up"
```

---

### Task 11: Final verification

End-to-end sanity check: all tests green, formatter clean, typecheck zero errors.

- [ ] **Step 1: Run formatter and fix any drift**

```bash
npm run format
```

Expected: no changes (or only trivial whitespace fixes — re-commit those if needed).

- [ ] **Step 2: Run full lint**

```bash
npm run lint
```

Expected: zero errors, zero warnings.

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: zero errors.

- [ ] **Step 4: Run full test suite**

```bash
npm test -- --no-watchman --forceExit
```

Expected: all tests pass.

- [ ] **Step 5: Verify file list**

Confirm these files exist and are tracked:

```bash
ls supabase/migrations/0001_initial_schema.sql
ls supabase/README.md
ls db/sync/serializers.ts
ls lib/cloudSync.ts
ls store/syncStore.ts
ls __tests__/unit/syncSerializers.test.ts
ls __tests__/unit/cloudSync.test.ts
ls __tests__/unit/syncStore.test.ts
```

Expected: all 8 files exist.

- [ ] **Step 6: Manual smoke-test instructions (informational, no commit)**

The user must:

1. Set up the Supabase project per `supabase/README.md`.
2. Update `app.config.ts` with real `supabaseUrl` and `supabaseAnonKey`.
3. Run the app, sign up a new user, log some entries.
4. Open the Supabase Table Editor — verify rows appear in each table with `user_id` matching the signed-in user.
5. Reinstall the app, sign back in — local data should restore automatically.

This step is informational only; no code change, no commit.
