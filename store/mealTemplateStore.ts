import { Q } from '@nozbe/watermelondb';

import { database } from '@/db/database';
import type { FoodEntry } from '@/db/models/FoodEntry';
import type { MealTemplate } from '@/db/models/MealTemplate';
import type { MealTemplateItem } from '@/db/models/MealTemplateItem';
import {
  serializeFoodEntry,
  serializeMealTemplate,
  serializeMealTemplateItem,
} from '@/db/sync/serializers';

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
    if (tmpl)
      syncUpsert(
        'meal_templates',
        serializeMealTemplate(tmpl) as unknown as Record<string, unknown>,
      );
    for (const item of createdItems) {
      syncUpsert(
        'meal_template_items',
        serializeMealTemplateItem(item) as unknown as Record<string, unknown>,
      );
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
    const foodEntries = database.collections.get<FoodEntry>('food_entries');
    const createdEntries: FoodEntry[] = [];
    await database.write(async () => {
      const prepared = items.map(item =>
        foodEntries.prepareCreate(r => {
          r.date = targetDate;
          r.mealType = mealType;
          r.foodName = item.foodName;
          r.calories = item.calories;
          r.proteinG = item.proteinG;
          r.carbsG = item.carbsG;
          r.fatG = item.fatG;
          r.quantity = item.quantity;
          r.unit = item.unit;
          r.source = 'manual';
        }),
      );
      await database.batch(...prepared);
      createdEntries.push(...prepared);
    });
    for (const entry of createdEntries) {
      syncUpsert('food_entries', serializeFoodEntry(entry) as unknown as Record<string, unknown>);
    }
    const tmpl = await database.collections.get<MealTemplate>('meal_templates').find(templateId);
    useToastStore.getState().showToast(`Logged ${tmpl.name}`);
  } catch (e) {
    console.error('mealTemplateStore.logTemplate failed', e);
    useToastStore.getState().showToast("Couldn't log meal template", 'error');
  }
}
