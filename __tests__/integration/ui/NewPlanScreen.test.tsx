import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import NewPlanScreen from '@/app/(protected)/plan/new';

import { makeTestDatabase } from '../../test-utils/makeTestDatabase';

let mockDb: ReturnType<typeof makeTestDatabase>;
const mockReplace = jest.fn();

jest.mock('@/db/database', () => ({
  get database() {
    return mockDb;
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  Stack: { Screen: () => null },
}));

beforeAll(() => {
  mockDb = makeTestDatabase();
});

beforeEach(() => {
  mockReplace.mockClear();
});

it('renders plan name input and a disabled create button', () => {
  render(<NewPlanScreen />);
  expect(screen.getByLabelText('Plan name')).toBeTruthy();
  expect(screen.getByLabelText('Create plan')).toBeDisabled();
});

it('enables create button once a name is entered', () => {
  render(<NewPlanScreen />);
  fireEvent.changeText(screen.getByLabelText('Plan name'), 'Push Pull Legs');
  expect(screen.getByLabelText('Create plan')).not.toBeDisabled();
});

it('creates a plan and navigates to its detail screen', async () => {
  render(<NewPlanScreen />);
  fireEvent.changeText(screen.getByLabelText('Plan name'), 'Push Pull Legs');
  fireEvent.press(screen.getByLabelText('Create plan'));

  await waitFor(() => {
    expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/^\/plan\/.+/));
  });
});
