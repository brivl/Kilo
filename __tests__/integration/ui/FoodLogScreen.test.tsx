import { render, waitFor } from '@testing-library/react-native';

import FoodLogTab from '@/app/(protected)/(tabs)/index';
import { addEntry } from '@/store/foodStore';
import { useSettingsStore } from '@/store/settingsStore';

import { makeTestDatabase } from '../../test-utils/makeTestDatabase';

let mockDb: ReturnType<typeof makeTestDatabase>;

jest.mock('@/db/database', () => ({
  get database() {
    return mockDb;
  },
}));

// expo-router mock — useRouter is called by MealSectionHeader
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

// safe-area-context mock — DateHeader doesn't use it but Toast does
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));

// datetimepicker mock
jest.mock('@react-native-community/datetimepicker', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  function MockPicker() {
    return <View />;
  }
  return MockPicker;
});

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

it('renders entries for selected date', async () => {
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
  const { findByText } = render(<FoodLogTab />);
  expect(await findByText('Porridge')).toBeTruthy();
});

it('does not show entries for other dates', async () => {
  await addEntry({
    date: '2026-05-02',
    mealType: 'lunch',
    foodName: 'Yesterday pizza',
    calories: 500,
    proteinG: 20,
    carbsG: 60,
    fatG: 15,
    quantity: 1,
    unit: 'serving',
    source: 'manual',
  });
  const { queryByText } = render(<FoodLogTab />);
  await waitFor(() => expect(queryByText('Yesterday pizza')).toBeNull());
});
