import { database } from '@/db/database';
import type { FoodEntry } from '@/db/models/FoodEntry';

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
    let srcName: string;
    await database.write(async () => {
      const src = await database.collections.get<FoodEntry>('food_entries').find(sourceEntryId);
      srcName = src.foodName;
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
    useToastStore.getState().showToast(`Logged ${srcName!}`);
  } catch (e) {
    console.error('foodStore.relogEntry failed', e);
    useToastStore.getState().showToast("Couldn't re-log entry", 'error');
  }
}
