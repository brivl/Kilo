import { fetchAllRows, softDeleteRow, upsertRow } from '@/lib/cloudSync';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { restoreAll, syncDelete, syncUpsert } from '@/store/syncStore';

jest.mock('@/lib/cloudSync', () => ({
  upsertRow: jest.fn().mockResolvedValue({ error: null }),
  softDeleteRow: jest.fn().mockResolvedValue({ error: null }),
  fetchAllRows: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/db/database', () => ({
  database: {
    write: jest.fn().mockResolvedValue(undefined),
    collections: {
      get: jest.fn().mockReturnValue({
        query: jest.fn().mockReturnValue({ fetchCount: jest.fn().mockResolvedValue(0) }),
        prepareCreateFromDirtyRaw: jest.fn(),
      }),
    },
    batch: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockUpsert = upsertRow as jest.MockedFunction<typeof upsertRow>;
const mockSoftDelete = softDeleteRow as jest.MockedFunction<typeof softDeleteRow>;
const mockFetchAll = fetchAllRows as jest.MockedFunction<typeof fetchAllRows>;

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ session: null, isLoading: false });
  useSettingsStore.setState({ syncEnabled: true });
});

describe('syncUpsert', () => {
  it('is a no-op when there is no session', async () => {
    syncUpsert('food_entries', { id: 'fe1' });
    await new Promise(r => setImmediate(r));
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('is a no-op when syncEnabled is false', async () => {
    useAuthStore.setState({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session: { user: { id: 'user-1' } } as any,
      isLoading: false,
    });
    useSettingsStore.setState({ syncEnabled: false });
    syncUpsert('food_entries', { id: 'fe1' });
    await new Promise(r => setImmediate(r));
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('calls upsertRow with table, row, and userId when session+sync ok', async () => {
    useAuthStore.setState({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session: { user: { id: 'user-1' } } as any,
      isLoading: false,
    });
    syncUpsert('food_entries', { id: 'fe1', date: '2026-05-14' });
    await new Promise(r => setImmediate(r));
    expect(mockUpsert).toHaveBeenCalledWith(
      'food_entries',
      { id: 'fe1', date: '2026-05-14' },
      'user-1',
    );
  });

  it('swallows errors from upsertRow', async () => {
    useAuthStore.setState({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session: { user: { id: 'user-1' } } as any,
      isLoading: false,
    });
    mockUpsert.mockRejectedValueOnce(new Error('boom'));
    expect(() => syncUpsert('food_entries', { id: 'fe1' })).not.toThrow();
    await new Promise(r => setImmediate(r));
  });
});

describe('syncDelete', () => {
  it('calls softDeleteRow when session+sync ok', async () => {
    useAuthStore.setState({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session: { user: { id: 'user-1' } } as any,
      isLoading: false,
    });
    syncDelete('food_entries', 'fe1');
    await new Promise(r => setImmediate(r));
    expect(mockSoftDelete).toHaveBeenCalledWith('food_entries', 'fe1');
  });

  it('is a no-op when no session', async () => {
    syncDelete('food_entries', 'fe1');
    await new Promise(r => setImmediate(r));
    expect(mockSoftDelete).not.toHaveBeenCalled();
  });
});

describe('restoreAll', () => {
  it('returns 0 restoredCount when no session', async () => {
    const result = await restoreAll();
    expect(result.restoredCount).toBe(0);
    expect(mockFetchAll).not.toHaveBeenCalled();
  });
});
