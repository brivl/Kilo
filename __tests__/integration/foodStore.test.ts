import { firstValueFrom } from 'rxjs';

import { observeEntriesForDate } from '@/db/queries/foodEntries';
import { addEntry, deleteEntry, relogEntry } from '@/store/foodStore';

import { makeTestDatabase } from '../test-utils/makeTestDatabase';

// database is resolved lazily via getter so the instance is available
// by the time any test calls into foodStore
let mockDb: ReturnType<typeof makeTestDatabase>;

jest.mock('@/db/database', () => ({
  get database() {
    return mockDb;
  },
}));

const base = {
  date: '2026-05-03',
  mealType: 'breakfast',
  foodName: 'Eggs',
  calories: 140,
  proteinG: 12,
  carbsG: 1,
  fatG: 10,
  quantity: 2,
  unit: 'serving',
  source: 'manual' as const,
};

beforeAll(() => {
  mockDb = makeTestDatabase();
});

beforeEach(async () => {
  const entries = await mockDb.collections.get('food_entries').query().fetch();
  await mockDb.write(async () => {
    for (const e of entries) await (e as any).destroyPermanently();
  });
});

it('addEntry creates a record visible via observe', async () => {
  await addEntry(base);
  const entries = await firstValueFrom(observeEntriesForDate('2026-05-03'));
  expect(entries).toHaveLength(1);
  expect((entries[0] as any).foodName).toBe('Eggs');
});

it('deleteEntry removes the record', async () => {
  await addEntry(base);
  const before = await firstValueFrom(observeEntriesForDate('2026-05-03'));
  await deleteEntry((before[0] as any).id);
  const after = await firstValueFrom(observeEntriesForDate('2026-05-03'));
  expect(after).toHaveLength(0);
});

it('relogEntry copies to new date and meal', async () => {
  await addEntry(base);
  const [src] = await firstValueFrom(observeEntriesForDate('2026-05-03'));
  await relogEntry((src as any).id, '2026-05-04', 'lunch');
  const newEntries = await firstValueFrom(observeEntriesForDate('2026-05-04'));
  expect(newEntries).toHaveLength(1);
  expect((newEntries[0] as any).mealType).toBe('lunch');
  expect((newEntries[0] as any).foodName).toBe('Eggs');
});
