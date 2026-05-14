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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const count = await (database.collections.get(table) as any).query().fetchCount();
    if (count > 0) return false;
  }
  return true;
}
