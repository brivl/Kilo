import { fireEvent, render, waitFor } from '@testing-library/react-native';

import AddFoodScreen from '@/app/food/add';
import type { FoodEntry } from '@/db/models/FoodEntry';
import { useSettingsStore } from '@/store/settingsStore';

import { makeTestDatabase } from '../test-utils/makeTestDatabase';

let mockDb: ReturnType<typeof makeTestDatabase>;

jest.mock('@/db/database', () => ({
  get database() {
    return mockDb;
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
  useLocalSearchParams: () => ({ mealType: 'breakfast' }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));

beforeAll(() => {
  mockDb = makeTestDatabase();
});

beforeEach(async () => {
  useSettingsStore.setState({ selectedDate: '2026-05-03' });
  const entries = await mockDb.collections.get('food_entries').query().fetch();
  await mockDb.write(async () => {
    for (const e of entries) await e.destroyPermanently();
  });
});

it('saves a manual food entry and navigates back', async () => {
  const { getByPlaceholderText, getByRole } = render(<AddFoodScreen />);

  fireEvent.changeText(getByPlaceholderText('Food name'), 'Oats');
  fireEvent.changeText(getByPlaceholderText('Calories'), '300');
  fireEvent.changeText(getByPlaceholderText('Protein (g)'), '10');
  fireEvent.changeText(getByPlaceholderText('Carbs (g)'), '50');
  fireEvent.changeText(getByPlaceholderText('Fat (g)'), '5');

  fireEvent.press(getByRole('button', { name: 'Save' }));

  await waitFor(async () => {
    const entries = (await mockDb.collections.get('food_entries').query().fetch()) as FoodEntry[];
    expect(entries).toHaveLength(1);
    expect(entries[0]!.foodName).toBe('Oats');
    expect(entries[0]!.calories).toBe(300);
  });
});

it('does not save when food name is empty', async () => {
  const { getByPlaceholderText, getByRole } = render(<AddFoodScreen />);

  fireEvent.changeText(getByPlaceholderText('Calories'), '200');
  fireEvent.press(getByRole('button', { name: 'Save' }));

  await waitFor(async () => {
    const entries = await mockDb.collections.get('food_entries').query().fetch();
    expect(entries).toHaveLength(0);
  });
});
