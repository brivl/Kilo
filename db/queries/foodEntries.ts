import { Q } from '@nozbe/watermelondb';

import { database } from '@/db/database';
import type { FoodEntry } from '@/db/models/FoodEntry';

export function observeEntriesForDate(dateISO: string) {
  return database.collections
    .get<FoodEntry>('food_entries')
    .query(Q.where('date', dateISO), Q.sortBy('created_at', Q.asc))
    .observe();
}

export function observeRecentFoods() {
  return database.collections
    .get<FoodEntry>('food_entries')
    .query(Q.sortBy('created_at', Q.desc), Q.take(50))
    .observe();
  // Deduplicate by food_name in component — WatermelonDB has no DISTINCT
}

export function observeRecentByMeal(mealType: string) {
  return database.collections
    .get<FoodEntry>('food_entries')
    .query(Q.where('meal_type', mealType), Q.sortBy('created_at', Q.desc), Q.take(30))
    .observe();
}
