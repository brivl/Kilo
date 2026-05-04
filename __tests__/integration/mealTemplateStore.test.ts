import { firstValueFrom } from 'rxjs';

import type { FoodEntry } from '@/db/models/FoodEntry';
import type { MealTemplate } from '@/db/models/MealTemplate';
import type { MealTemplateItem } from '@/db/models/MealTemplateItem';
import { observeEntriesForDate } from '@/db/queries/foodEntries';
import { observeAllTemplates, observeTemplateItems } from '@/db/queries/mealTemplates';
import { createTemplate, deleteTemplate, logTemplate } from '@/store/mealTemplateStore';

import { makeTestDatabase } from '../test-utils/makeTestDatabase';

let mockDb: ReturnType<typeof makeTestDatabase>;

jest.mock('@/db/database', () => ({
  get database() {
    return mockDb;
  },
}));

const item = {
  foodName: 'Oats',
  calories: 379,
  proteinG: 13,
  carbsG: 68,
  fatG: 7,
  quantity: 100,
  unit: 'g',
};

beforeAll(() => {
  mockDb = makeTestDatabase();
});

beforeEach(async () => {
  for (const table of ['meal_templates', 'meal_template_items', 'food_entries'] as const) {
    const records = await mockDb.collections.get(table).query().fetch();
    await mockDb.write(async () => {
      for (const r of records) await r.destroyPermanently();
    });
  }
});

it('creates a template with items', async () => {
  await createTemplate('Morning bulk', [item]);
  const templates = await firstValueFrom(observeAllTemplates());
  expect(templates).toHaveLength(1);
  expect((templates[0] as MealTemplate).name).toBe('Morning bulk');
  const items = await firstValueFrom(observeTemplateItems((templates[0] as MealTemplate).id));
  expect(items).toHaveLength(1);
  expect((items[0] as MealTemplateItem).foodName).toBe('Oats');
});

it('logTemplate creates food entries', async () => {
  await createTemplate('Quick breakfast', [item]);
  const templates = await firstValueFrom(observeAllTemplates());
  await logTemplate((templates[0] as MealTemplate).id, '2026-05-04', 'breakfast');
  const entries = await firstValueFrom(observeEntriesForDate('2026-05-04'));
  expect(entries).toHaveLength(1);
  expect((entries[0] as FoodEntry).foodName).toBe('Oats');
});

it('deleteTemplate removes template and items', async () => {
  await createTemplate('To delete', [item]);
  const [tmpl] = await firstValueFrom(observeAllTemplates());
  const tmplId = (tmpl as MealTemplate).id;
  await deleteTemplate(tmplId);
  expect(await firstValueFrom(observeAllTemplates())).toHaveLength(0);
  expect(await firstValueFrom(observeTemplateItems(tmplId))).toHaveLength(0);
});
