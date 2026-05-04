import { Q } from '@nozbe/watermelondb';

import { database } from '@/db/database';
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
