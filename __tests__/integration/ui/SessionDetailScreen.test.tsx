import { fireEvent, render, screen } from '@testing-library/react-native';

import SessionDetailScreen from '@/app/session/[id]';
import { createSession } from '@/store/workoutStore';

import { makeTestDatabase } from '../../test-utils/makeTestDatabase';

let mockDb: ReturnType<typeof makeTestDatabase>;
let mockSessionId = '';

jest.mock('@/db/database', () => ({
  get database() {
    return mockDb;
  },
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: mockSessionId }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  Stack: { Screen: () => null },
}));

beforeAll(() => {
  mockDb = makeTestDatabase();
});

beforeEach(async () => {
  const sessions = await mockDb.collections.get('workout_sessions').query().fetch();
  const sets = await mockDb.collections.get('workout_sets').query().fetch();
  await mockDb.write(async () => {
    for (const s of sessions) await s.destroyPermanently();
    for (const s of sets) await s.destroyPermanently();
  });
  mockSessionId = await createSession({ date: '2026-05-05', name: 'Test session' });
});

it('shows empty state before any sets', async () => {
  const { findByText } = render(<SessionDetailScreen />);
  expect(await findByText('No sets yet — add one below')).toBeTruthy();
});

it('adds a set and shows it in the list', async () => {
  render(<SessionDetailScreen />);

  fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), 'Bench press');
  fireEvent.changeText(screen.getByLabelText('Reps'), '8');
  fireEvent.changeText(screen.getByLabelText('Weight'), '80');
  fireEvent.press(screen.getByLabelText('Add set'));

  expect((await screen.findAllByText('Bench press')).length).toBeGreaterThan(0);
  expect(await screen.findByText('8')).toBeTruthy();
});
