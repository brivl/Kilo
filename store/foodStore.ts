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
    if (created)
      syncUpsert('food_entries', serializeFoodEntry(created) as unknown as Record<string, unknown>);
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
    if (created)
      syncUpsert('food_entries', serializeFoodEntry(created) as unknown as Record<string, unknown>);
    useToastStore.getState().showToast(`Logged ${srcName!}`);
  } catch (e) {
    console.error('foodStore.relogEntry failed', e);
    useToastStore.getState().showToast("Couldn't re-log entry", 'error');
  }
}
