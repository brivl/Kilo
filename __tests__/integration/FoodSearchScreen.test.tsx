import { fireEvent, render } from '@testing-library/react-native';

import FoodSearchScreen from '@/app/food/search';
import type { OffFood } from '@/services/openFoodFacts';
import { addEntry } from '@/store/foodStore';
import { useSettingsStore } from '@/store/settingsStore';

import { makeTestDatabase } from '../test-utils/makeTestDatabase';

let mockDb: ReturnType<typeof makeTestDatabase>;

jest.mock('@/db/database', () => ({
  get database() {
    return mockDb;
  },
}));

const mockSearchFoods = jest.fn<Promise<OffFood[]>, [string, AbortSignal?]>();
jest.mock('@/services/openFoodFacts', () => ({
  searchFoods: (...args: [string, AbortSignal?]) => mockSearchFoods(...args),
  OffNetworkError: class OffNetworkError extends Error {},
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
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
  mockPush.mockClear();
  mockSearchFoods.mockResolvedValue([]);
  const entries = await mockDb.collections.get('food_entries').query().fetch();
  await mockDb.write(async () => {
    for (const e of entries) await e.destroyPermanently();
  });
});

it('shows recent foods from the database', async () => {
  await addEntry({
    date: '2026-05-03',
    mealType: 'breakfast',
    foodName: 'Porridge',
    calories: 300,
    proteinG: 10,
    carbsG: 50,
    fatG: 5,
    quantity: 1,
    unit: 'serving',
    source: 'manual',
  });

  const { findByText } = render(<FoodSearchScreen />);
  expect(await findByText('Porridge')).toBeTruthy();
});

it('shows OFF results when searching', async () => {
  const result: OffFood = {
    id: 'abc123',
    name: 'Greek Yogurt',
    brand: 'Chobani',
    kcalPer100g: 60,
    proteinPer100g: 10,
    carbsPer100g: 4,
    fatPer100g: 0.7,
  };
  mockSearchFoods.mockResolvedValue([result]);

  const { getByPlaceholderText, findByText } = render(<FoodSearchScreen />);
  fireEvent.changeText(getByPlaceholderText('Search foods…'), 'yogurt');

  expect(await findByText('Greek Yogurt')).toBeTruthy();
});

it('navigates to add screen with OFF food details on tap', async () => {
  const result: OffFood = {
    id: 'abc123',
    name: 'Greek Yogurt',
    brand: 'Chobani',
    kcalPer100g: 60,
    proteinPer100g: 10,
    carbsPer100g: 4,
    fatPer100g: 0.7,
  };
  mockSearchFoods.mockResolvedValue([result]);

  const { getByPlaceholderText, findByText } = render(<FoodSearchScreen />);
  fireEvent.changeText(getByPlaceholderText('Search foods…'), 'yogurt');

  const item = await findByText('Greek Yogurt');
  fireEvent.press(item);

  expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/food/add' }));
});
