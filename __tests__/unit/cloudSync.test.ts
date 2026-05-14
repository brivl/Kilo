import { fetchAllRows, softDeleteRow, upsertRow } from '@/lib/cloudSync';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const mockedFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;

beforeEach(() => {
  mockedFrom.mockReset();
});

describe('upsertRow', () => {
  it('calls supabase.from(table).upsert with user_id added', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedFrom.mockReturnValue({ upsert: mockUpsert } as any);

    await upsertRow('food_entries', { id: 'fe1', date: '2026-05-14' }, 'user-1');

    expect(mockedFrom).toHaveBeenCalledWith('food_entries');
    expect(mockUpsert).toHaveBeenCalledWith({
      id: 'fe1',
      date: '2026-05-14',
      user_id: 'user-1',
    });
  });
});

describe('softDeleteRow', () => {
  it('updates the row setting deleted_at, filtered by id', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn(() => ({ eq: mockEq }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedFrom.mockReturnValue({ update: mockUpdate } as any);

    await softDeleteRow('food_entries', 'fe1');

    expect(mockedFrom).toHaveBeenCalledWith('food_entries');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) }),
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'fe1');
  });
});

describe('fetchAllRows', () => {
  it('returns rows for user where deleted_at is null', async () => {
    const mockIs = jest.fn().mockResolvedValue({ data: [{ id: 'row1' }], error: null });
    const mockEq = jest.fn(() => ({ is: mockIs }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedFrom.mockReturnValue({ select: mockSelect } as any);

    const rows = await fetchAllRows('food_entries', 'user-1');

    expect(mockedFrom).toHaveBeenCalledWith('food_entries');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
    expect(rows).toEqual([{ id: 'row1' }]);
  });

  it('returns empty array on error', async () => {
    const mockIs = jest.fn().mockResolvedValue({ data: null, error: { message: 'boom' } });
    const mockEq = jest.fn(() => ({ is: mockIs }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedFrom.mockReturnValue({ select: mockSelect } as any);

    const rows = await fetchAllRows('food_entries', 'user-1');
    expect(rows).toEqual([]);
  });
});
