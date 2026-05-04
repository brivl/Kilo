import { Q } from '@nozbe/watermelondb';

import { database } from '@/db/database';
import type { MealTemplate } from '@/db/models/MealTemplate';
import type { MealTemplateItem } from '@/db/models/MealTemplateItem';

import { addEntry } from './foodStore';
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
    useToastStore.getState().showToast(`Logged ${tmpl.name}`);
  } catch (e) {
    console.error('mealTemplateStore.logTemplate failed', e);
    useToastStore.getState().showToast("Couldn't log meal template", 'error');
  }
}
