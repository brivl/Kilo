import {
  bodyWeightEntryRowToRaw,
  foodEntryRowToRaw,
  serializeBodyWeightEntry,
  serializeFoodEntry,
  serializeWorkoutSession,
  workoutSessionRowToRaw,
} from '@/db/sync/serializers';

describe('serializeFoodEntry', () => {
  it('maps camelCase model fields to snake_case row', () => {
    const model = {
      id: 'fe1',
      date: '2026-05-14',
      mealType: 'breakfast',
      foodName: 'Oats',
      calories: 300,
      proteinG: 12,
      carbsG: 50,
      fatG: 6,
      quantity: 100,
      unit: 'g',
      source: 'manual',
      createdAt: new Date(1700000000000),
    };
    const row = serializeFoodEntry(model as never);
    expect(row).toEqual({
      id: 'fe1',
      date: '2026-05-14',
      meal_type: 'breakfast',
      food_name: 'Oats',
      calories: 300,
      protein_g: 12,
      carbs_g: 50,
      fat_g: 6,
      quantity: 100,
      unit: 'g',
      source: 'manual',
      created_at: 1700000000000,
    });
  });
});

describe('foodEntryRowToRaw', () => {
  it('strips cloud-only fields and marks status synced', () => {
    const row = {
      id: 'fe1',
      user_id: 'user-1',
      date: '2026-05-14',
      meal_type: 'breakfast',
      food_name: 'Oats',
      calories: 300,
      protein_g: 12,
      carbs_g: 50,
      fat_g: 6,
      quantity: 100,
      unit: 'g',
      source: 'manual',
      created_at: 1700000000000,
      updated_at: '2026-05-14T00:00:00Z',
      deleted_at: null,
    };
    expect(foodEntryRowToRaw(row)).toEqual({
      id: 'fe1',
      date: '2026-05-14',
      meal_type: 'breakfast',
      food_name: 'Oats',
      calories: 300,
      protein_g: 12,
      carbs_g: 50,
      fat_g: 6,
      quantity: 100,
      unit: 'g',
      source: 'manual',
      created_at: 1700000000000,
      _status: 'synced',
      _changed: '',
    });
  });
});

describe('serializeWorkoutSession', () => {
  it('preserves nullable fields', () => {
    const model = {
      id: 'ws1',
      date: '2026-05-14',
      name: 'Push day',
      notes: null,
      durationMin: null,
      planId: null,
      createdAt: new Date(1700000000000),
    };
    const row = serializeWorkoutSession(model as never);
    expect(row.notes).toBeNull();
    expect(row.duration_min).toBeNull();
    expect(row.plan_id).toBeNull();
  });
});

describe('workoutSessionRowToRaw', () => {
  it('handles null optional fields', () => {
    const row = {
      id: 'ws1',
      user_id: 'user-1',
      date: '2026-05-14',
      name: 'Push day',
      notes: null,
      duration_min: null,
      plan_id: null,
      created_at: 1700000000000,
      updated_at: '2026-05-14T00:00:00Z',
      deleted_at: null,
    };
    const raw = workoutSessionRowToRaw(row);
    expect(raw.notes).toBeNull();
    expect(raw.duration_min).toBeNull();
    expect(raw.plan_id).toBeNull();
    expect(raw._status).toBe('synced');
  });
});

describe('serializeBodyWeightEntry', () => {
  it('maps fields', () => {
    const model = {
      id: 'bw1',
      date: '2026-05-14',
      weightKg: 82.5,
      notes: 'feeling good',
      createdAt: new Date(1700000000000),
    };
    expect(serializeBodyWeightEntry(model as never)).toEqual({
      id: 'bw1',
      date: '2026-05-14',
      weight_kg: 82.5,
      notes: 'feeling good',
      created_at: 1700000000000,
    });
  });
});

describe('bodyWeightEntryRowToRaw', () => {
  it('produces raw with synced status', () => {
    const row = {
      id: 'bw1',
      user_id: 'user-1',
      date: '2026-05-14',
      weight_kg: 82.5,
      notes: null,
      created_at: 1700000000000,
      updated_at: '2026-05-14T00:00:00Z',
      deleted_at: null,
    };
    const raw = bodyWeightEntryRowToRaw(row);
    expect(raw.id).toBe('bw1');
    expect(raw.weight_kg).toBe(82.5);
    expect(raw._status).toBe('synced');
    expect(raw._changed).toBe('');
  });
});
