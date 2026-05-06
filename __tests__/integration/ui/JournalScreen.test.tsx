import { render, waitFor } from '@testing-library/react-native';

import JournalScreen from '@/app/(tabs)/journal';
import { useSettingsStore } from '@/store/settingsStore';
import { createSession } from '@/store/workoutStore';

import { makeTestDatabase } from '../../test-utils/makeTestDatabase';

let mockDb: ReturnType<typeof makeTestDatabase>;

jest.mock('@/db/database', () => ({
  get database() {
    return mockDb;
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  Stack: { Screen: () => null },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));

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
  useSettingsStore.setState({ selectedDate: '2026-05-05' });
  const sessions = await mockDb.collections.get('workout_sessions').query().fetch();
  await mockDb.write(async () => {
    for (const s of sessions) await s.destroyPermanently();
  });
});

it('shows sessions for selected date', async () => {
  await createSession({ name: 'Morning push', date: '2026-05-05' });
  const { findByText } = render(<JournalScreen />);
  expect(await findByText('Morning push')).toBeTruthy();
});

it('does not show sessions from other dates', async () => {
  await createSession({ name: 'Yesterday run', date: '2026-05-04' });
  const { queryByText } = render(<JournalScreen />);
  await waitFor(() => expect(queryByText('Yesterday run')).toBeNull());
});

it('shows empty state when no sessions', async () => {
  const { findByText } = render(<JournalScreen />);
  expect(await findByText('No workouts — tap + to start one')).toBeTruthy();
});
