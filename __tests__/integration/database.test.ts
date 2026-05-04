/* eslint-disable @typescript-eslint/no-explicit-any */

import { makeTestDatabase } from '../test-utils/makeTestDatabase';

describe('database smoke tests', () => {
  it('creates and queries a food entry', async () => {
    const db = makeTestDatabase();
    await db.write(async () => {
      await db.collections.get('food_entries').create((r: any) => {
        r.date = '2026-05-03';
        r.mealType = 'breakfast';
        r.foodName = 'Eggs';
        r.calories = 140;
        r.proteinG = 12;
        r.carbsG = 1;
        r.fatG = 10;
        r.quantity = 2;
        r.unit = 'serving';
        r.source = 'manual';
      });
    });
    const entries = await db.collections.get('food_entries').query().fetch();
    expect(entries).toHaveLength(1);
    expect((entries[0] as any).foodName).toBe('Eggs');
  });

  it('creates a meal template with items', async () => {
    const db = makeTestDatabase();
    await db.write(async () => {
      const tmpl = await db.collections.get('meal_templates').create((r: any) => {
        r.name = 'Morning bulk';
      });
      await db.collections.get('meal_template_items').create((r: any) => {
        r.mealTemplateId = tmpl.id;
        r.foodName = 'Oats';
        r.calories = 379;
        r.proteinG = 13;
        r.carbsG = 68;
        r.fatG = 7;
        r.quantity = 100;
        r.unit = 'g';
      });
    });
    const templates = await db.collections.get('meal_templates').query().fetch();
    expect(templates).toHaveLength(1);
    const items = await db.collections.get('meal_template_items').query().fetch();
    expect(items).toHaveLength(1);
  });
});
