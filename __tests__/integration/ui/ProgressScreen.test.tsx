import { render } from '@testing-library/react-native';

import ProgressScreen from '@/app/(protected)/(tabs)/progress';
import { logWeight } from '@/store/bodyWeightStore';

import { makeTestDatabase } from '../../test-utils/makeTestDatabase';

let mockDb: ReturnType<typeof makeTestDatabase>;

jest.mock('@/db/database', () => ({
  get database() {
    return mockDb;
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  Stack: { Screen: () => null },
}));

beforeAll(() => {
  mockDb = makeTestDatabase();
});

beforeEach(async () => {
  const entries = await mockDb.collections.get('body_weight_entries').query().fetch();
  await mockDb.write(async () => {
    for (const e of entries) await e.destroyPermanently();
  });
});

it('renders empty state', async () => {
  const { findByText } = render(<ProgressScreen />);
  expect(await findByText('No entries yet — log your first weight above')).toBeTruthy();
});

it('shows logged weight entry', async () => {
  await logWeight('2026-05-05', 82.5, null);
  const { findByText } = render(<ProgressScreen />);
  expect(await findByText('82.5 kg')).toBeTruthy();
  expect(await findByText('2026-05-05')).toBeTruthy();
});

it('shows chart placeholder with fewer than 2 entries', async () => {
  const { findByText } = render(<ProgressScreen />);
  expect(await findByText('Log at least 2 entries to see your chart')).toBeTruthy();
});
