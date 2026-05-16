# Phase 7 — Cloud Sync Design

## Goal

Mirror all local WatermelonDB data to Supabase Postgres so users don't lose data on reinstall and can access it across devices.

## Architecture

Direct upsert from the React Native client to Supabase Postgres on every store write. No Edge Function, no WatermelonDB sync protocol. The local WatermelonDB database is the source of truth at all times. Cloud is a durable backup.

On reinstall or new device login, a one-time restore pull fetches all rows for the authenticated user and writes them into the empty local database.

Conflict resolution: last-write-wins via `updated_at` timestamp. Sufficient for v1 — single-user, single-device-active pattern.

## Supabase Schema

Mirror all 6 WatermelonDB tables. Each Supabase table adds two columns beyond the WatermelonDB schema:

- `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz` — soft-delete column; NULL means active

Tables:

| Table                     | Mirrors                 |
| ------------------------- | ----------------------- |
| `food_entries`            | food_entries            |
| `workout_sessions`        | workout_sessions        |
| `workout_sets`            | workout_sets            |
| `body_weight_entries`     | body_weight_entries     |
| `training_plans`          | training_plans          |
| `training_plan_exercises` | training_plan_exercises |

Primary keys are WatermelonDB `id` strings (text). All columns match the WatermelonDB schema exactly (same names, compatible types).

### Row-Level Security

Enabled on all 6 tables. Single policy per table:

```sql
-- SELECT / INSERT / UPDATE / DELETE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid())
```

Users can only read and write their own rows.

## Sync Mechanism

### Write path (upsert on every store write)

After every WatermelonDB write (create, update, delete) succeeds, fire an async upsert to Supabase:

- **Create/Update**: `supabase.from(table).upsert({ ...row, user_id, updated_at: new Date() })`
- **Delete**: set `deleted_at = now()` on the Supabase row (soft delete), do not call `.delete()`

Soft deletes preserve the row so restore can replay the deletion state on another device.

The upsert is **fire-and-forget** in v1:

- Failures are silently ignored (no toast, no retry queue)
- Local DB write has already committed — UX is unaffected
- Sync gaps will be resolved when full sync is implemented in a future phase

Sync only fires when: `session !== null` AND `syncEnabled === true`.

### Restore path (on reinstall)

Triggered once after login when the local WatermelonDB database is empty (all table counts = 0).

1. For each of the 6 tables, fetch all rows where `user_id = auth.uid()` and `deleted_at IS NULL`
2. Batch-write fetched rows into WatermelonDB using `database.write(() => table.prepareCreate(...))`
3. Show a loading state during restore; redirect to tabs when complete

Restore is also triggered manually from Settings > Data & Privacy > "Restore from cloud".

## Data Retention

No automatic deletion in v1. Data remains in Supabase as long as the account exists. The `ON DELETE CASCADE` on `user_id` ensures all user rows are wiped when an account is deleted.

Scheduled cleanup (e.g., after years of inactivity) is deferred to a future phase.

## Consent & Opt-Out

### Sign-up consent

ToS and Privacy Policy links shown at sign-up with a required acknowledgement. Privacy Policy states that data is synced to Supabase servers hosted in [region].

### Opt-out toggle

Settings screen gets a **Data & Privacy** section with a `Sync my data` toggle, default **on**.

- Toggling off: confirmation sheet warns "Opting out disables backup. Data lost on reinstall won't be recoverable." On confirm, sets `syncEnabled = false` in `settingsStore`. Future upserts are skipped.
- Toggling back on: sync resumes from that point forward. No retroactive backfill in v1.
- Already-synced data stays in Supabase until account deletion.

`syncEnabled` is stored in `settingsStore` and persisted via AsyncStorage.

### Account deletion

Settings gets a **Delete account** option in the Data & Privacy section.

Flow:

1. Confirm dialog: "This permanently deletes your account and all synced data."
2. Call a Supabase Edge Function to delete the auth user (client cannot safely self-delete)
3. `ON DELETE CASCADE` on `user_id` wipes all 6 tables for that user
4. Clear local WatermelonDB database
5. Clear AsyncStorage (`onboardingComplete`, `syncEnabled`, `settingsStore`)
6. Redirect to welcome screen

## Implementation Touchpoints

| File                                  | Change                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------- |
| `lib/supabase.ts`                     | Add typed table query helpers                                             |
| `store/syncStore.ts`                  | New — `upsertRow(table, row)`, `softDeleteRow(table, id)`, `restoreAll()` |
| `store/foodStore.ts`                  | Call `syncStore.upsertRow` / `softDeleteRow` after each DB write          |
| `store/workoutStore.ts`               | Same                                                                      |
| `store/bodyWeightStore.ts`            | Same                                                                      |
| `store/trainingPlanStore.ts`          | Same                                                                      |
| `store/settingsStore.ts`              | Add `syncEnabled: boolean` (default `true`)                               |
| `app/(protected)/(tabs)/settings.tsx` | New or expanded — Data & Privacy section, Delete Account                  |
| `app/(onboarding)/targets.tsx`        | Trigger `restoreAll()` after first save if DB is empty                    |
| Supabase migrations                   | SQL for all 6 tables + RLS policies                                       |

## Out of Scope (v1)

- Retry queue for failed upserts
- Conflict resolution beyond last-write-wins
- Multi-device real-time sync
- Scheduled data cleanup / inactivity expiry
- Incremental restore (only full restore on empty DB)
