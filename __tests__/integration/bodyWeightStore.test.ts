import { logWeight, deleteWeightEntry } from '@/store/bodyWeightStore';

import { makeTestDatabase } from '../test-utils/makeTestDatabase';

let mockDb: ReturnType<typeof makeTestDatabase>;

jest.mock('@/db/database', () => ({
  get database() {
    return mockDb;
  },
}));

jest.mock('@/store/toastStore', () => ({
  useToastStore: { getState: () => ({ showToast: jest.fn() }) },
}));

beforeEach(() => {
  mockDb = makeTestDatabase();
});

describe('bodyWeightStore', () => {
  it('logWeight creates an entry', async () => {
    await logWeight('2024-01-15', 80.5, null);
    const entries = await mockDb.collections.get('body_weight_entries').query().fetch();
    expect(entries).toHaveLength(1);
    expect((entries[0] as unknown as { weightKg: number }).weightKg).toBe(80.5);
  });

  it('deleteWeightEntry removes an entry', async () => {
    await logWeight('2024-01-15', 80.5, null);
    const before = await mockDb.collections.get('body_weight_entries').query().fetch();
    expect(before).toHaveLength(1);
    await deleteWeightEntry((before[0] as { id: string }).id);
    const after = await mockDb.collections.get('body_weight_entries').query().fetch();
    expect(after).toHaveLength(0);
  });
});
