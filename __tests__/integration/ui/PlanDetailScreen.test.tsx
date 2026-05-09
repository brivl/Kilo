import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import PlanDetailScreen from '@/app/plan/[id]';
import { createPlan } from '@/store/trainingPlanStore';

import { makeTestDatabase } from '../../test-utils/makeTestDatabase';

let mockDb: ReturnType<typeof makeTestDatabase>;
let mockPlanId = '';
const mockPush = jest.fn();

jest.mock('@/db/database', () => ({
  get database() {
    return mockDb;
  },
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: mockPlanId }),
  useRouter: () => ({ push: mockPush }),
  Stack: { Screen: () => null },
}));

beforeAll(() => {
  mockDb = makeTestDatabase();
});

beforeEach(async () => {
  mockPush.mockClear();

  const plans = await mockDb.collections.get('training_plans').query().fetch();
  const exercises = await mockDb.collections.get('training_plan_exercises').query().fetch();
  await mockDb.write(async () => {
    for (const p of plans) await p.destroyPermanently();
    for (const e of exercises) await e.destroyPermanently();
  });

  mockPlanId = await createPlan('Test plan');
});

it('shows empty state when plan has no exercises', async () => {
  render(<PlanDetailScreen />);
  expect(await screen.findByText('No days yet — add an exercise to get started')).toBeTruthy();
});

it('adds an exercise and shows it in the day card', async () => {
  render(<PlanDetailScreen />);

  await screen.findByText('No days yet — add an exercise to get started');

  fireEvent.changeText(screen.getByLabelText('Exercise name'), 'Bench press');
  fireEvent.changeText(screen.getByLabelText('Target sets'), '4');
  fireEvent.changeText(screen.getByLabelText('Target reps'), '8');
  fireEvent.press(screen.getByLabelText('Add exercise to plan'));

  expect(await screen.findByText('Bench press')).toBeTruthy();
  expect(await screen.findByText('4 × 8 @ 0 kg')).toBeTruthy();
});

it('tapping Start launches a session and navigates to it', async () => {
  render(<PlanDetailScreen />);

  await screen.findByText('No days yet — add an exercise to get started');

  fireEvent.changeText(screen.getByLabelText('Exercise name'), 'Squat');
  fireEvent.press(screen.getByLabelText('Add exercise to plan'));

  await screen.findByText('Squat');

  fireEvent.press(screen.getByLabelText('Start Monday workout'));

  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/^\/session\/.+/));
  });
});
